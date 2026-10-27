import { after, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";
import { quoteMatches, splitQuote } from "@/lib/qnaQuote";
import { decodeEntities } from "@/lib/decodeEntities";
import { createSmartSearch } from "@/lib/smartSearch";
import { notifyNewQuestion } from "@/lib/telegram";
import {
  BLOCKED_DATA_ERROR,
  RESERVED_NAME_ERROR,
  findSensitive,
  isReservedName,
  maskPlain,
  stripMarkers,
} from "@/lib/qnaPrivacy";

function truncate(val: string, max: number): string {
  return val.length > max ? val.slice(0, max) : val;
}

const QNA_LIMIT = 5;
const QNA_WINDOW_SECONDS = 60 * 60;
const MAX_MINE_IDS = 20;

// GET /api/qna?ids=1,2,3 — สถานะ "คำถามของฉัน" (id ที่เก็บไว้ในเบราว์เซอร์ของผู้ถาม)
async function getMine(idsParam: string) {
  const ids = [...new Set(idsParam.split(",").map((v) => parseInt(v)).filter((n) => n > 0))].slice(0, MAX_MINE_IDS);
  if (ids.length === 0) return Response.json({ questions: [] });

  const [rows, staff] = await Promise.all([
    prisma.qnaQuestion.findMany({
      where: { id: { in: ids }, isActive: true },
      select: {
        id: true,
        title: true,
        isClosed: true,
        _count: { select: { replies: { where: { isActive: true } } } },
      },
    }),
    prisma.qnaReply.findMany({
      where: { questionId: { in: ids }, isAdmin: true, isActive: true },
      select: { questionId: true },
      distinct: ["questionId"],
    }),
  ]);
  const staffSet = new Set(staff.map((r) => r.questionId));
  return Response.json({
    questions: rows.map((q) => ({
      id: q.id,
      title: maskPlain(decodeEntities(q.title)),
      isClosed: q.isClosed,
      replyCount: q._count.replies,
      hasStaffReply: staffSet.has(q.id),
    })),
  });
}

// GET /api/qna — list questions (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (idsParam) return getMine(idsParam);

    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all | answered | unanswered
    const sort = searchParams.get("sort") || "latest"; // latest | popular
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (filter === "answered") where.replies = { some: { isActive: true } };
    if (filter === "unanswered") where.replies = { none: { isActive: true } };

    const orderBy =
      sort === "popular"
        ? [{ isPinned: "desc" as const }, { views: "desc" as const }]
        : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    // ค้นหา: ค้นในหัวข้อ เนื้อหา และคำตอบของเจ้าหน้าที่ แบบยอมพิมพ์ไม่ตรง (ดู lib/smartSearch)
    // กระทู้มีไม่มาก จึงดึงมาจัดอันดับในโค้ด แล้วแบ่งหน้าจากผลที่ได้
    let pageIds: number[] | null = null;
    let searchTotal = 0;
    let approximate = false;
    if (search) {
      const candidates = await prisma.qnaQuestion.findMany({
        where,
        orderBy,
        select: { id: true, title: true, body: true, replies: { where: { isActive: true, isAdmin: true }, select: { body: true } } },
      });
      const result = createSmartSearch(candidates, (q) =>
        [q.title, q.body, ...q.replies.map((r) => r.body)].map(decodeEntities).join(" ")
      )(search);
      approximate = !result.exact && result.items.length > 0;
      searchTotal = result.items.length;
      pageIds = result.items.slice(skip, skip + limit).map((q) => q.id);
    }

    const [found, total, totalAll, totalAnswered] = await Promise.all([
      prisma.qnaQuestion.findMany({
        where: pageIds ? { id: { in: pageIds } } : where,
        orderBy,
        ...(pageIds ? {} : { skip, take: limit }),
        select: {
          id: true,
          authorName: true,
          title: true,
          body: true,
          views: true,
          isPinned: true,
          isClosed: true,
          createdAt: true,
          _count: { select: { replies: { where: { isActive: true } } } },
          replies: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              authorName: true,
              body: true,
              isAdmin: true,
              createdAt: true,
            },
          },
        },
      }),
      pageIds ? searchTotal : prisma.qnaQuestion.count({ where }),
      prisma.qnaQuestion.count({ where: { isActive: true } }),
      prisma.qnaQuestion.count({
        where: { isActive: true, replies: { some: { isActive: true } } },
      }),
    ]);
    // ผลค้นหา: เรียงตามความเกี่ยวข้อง (ลำดับจาก smartSearch) ไม่ใช่ลำดับของฐานข้อมูล
    const questions = pageIds ? pageIds.map((id) => found.find((q) => q.id === id)).filter((q): q is (typeof found)[number] => !!q) : found;

    // คำตอบแรกของเจ้าหน้าที่ต่อกระทู้ — การ์ด "ถาม → ตอบ" แสดงคำตอบนี้ก่อนคำตอบสมาชิกเสมอ
    const staffReplies = await prisma.qnaReply.findMany({
      where: { questionId: { in: questions.map((q) => q.id) }, isAdmin: true, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { questionId: true, authorName: true, body: true, createdAt: true },
    });
    // ใช้คำตอบที่ตอบตัวคำถามจริง — ข้ามคำตอบที่อ้างถึงข้อความถามต่อของสมาชิกคนอื่น
    // (ไม่มีคำตอบแบบนั้นเลยจึงใช้คำตอบแรกของเจ้าหน้าที่) และตัดบรรทัดอ้างอิงออกจากข้อความย่อ
    const firstStaff = new Map<number, (typeof staffReplies)[number]>();
    for (const q of questions) {
      const mine = staffReplies.filter((r) => r.questionId === q.id);
      const direct = mine.find((r) => {
        const { quote } = splitQuote(decodeEntities(r.body));
        return !quote || quoteMatches(quote, decodeEntities(q.authorName), decodeEntities(q.body));
      });
      const pick = direct ?? mine[0];
      if (pick) firstStaff.set(q.id, { ...pick, body: splitQuote(decodeEntities(pick.body)).rest });
    }

    return Response.json({
      questions: questions.map((q) => ({
        ...q,
        authorName: decodeEntities(q.authorName),
        // ข้อมูลส่วนตัวในหัวข้อ/ข้อความย่อ ถูกแทนด้วยป้าย [เบอร์โทร] ฯลฯ — ดูเบอร์ได้ในหน้ากระทู้เท่านั้น
        title: maskPlain(decodeEntities(q.title)),
        body: undefined,
        excerpt: truncate(maskPlain(decodeEntities(q.body)).replace(/\s+/g, " ").trim(), 160),
        hasStaffReply: firstStaff.has(q.id),
        replyCount: q._count.replies,
        // คำตอบเด่นของการ์ด: เจ้าหน้าที่ก่อน ไม่มีจึงใช้คำตอบล่าสุดของสมาชิก
        answer: firstStaff.has(q.id)
          ? {
              isAdmin: true,
              authorName: decodeEntities(firstStaff.get(q.id)!.authorName),
              // เบอร์ในคำตอบเจ้าหน้าที่เป็นเบอร์ทางการของสหกรณ์ → ไม่ซ่อน
              body: decodeEntities(firstStaff.get(q.id)!.body),
              createdAt: firstStaff.get(q.id)!.createdAt,
            }
          : q.replies[0]
            ? {
                isAdmin: q.replies[0].isAdmin,
                authorName: decodeEntities(q.replies[0].authorName),
                body: maskPlain(decodeEntities(q.replies[0].body)),
                createdAt: q.replies[0].createdAt,
              }
            : null,
        replies: undefined,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      // ไม่มีกระทู้ที่ตรงกับคำค้นพอดี — แสดงกระทู้ที่ใกล้เคียงแทน
      approximate,
      stats: {
        total: totalAll,
        answered: totalAnswered,
        unanswered: totalAll - totalAnswered,
      },
    });
  } catch (error) {
    console.error("Failed to get QnA:", error);
    return Response.json({ questions: [], total: 0 }, { status: 500 });
  }
}

// POST /api/qna — create new question (public)
export async function POST(req: NextRequest) {
  try {
    // ── Security Layer 1: Content-Type check ──
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return Response.json({ error: "Invalid content type" }, { status: 415 });
    }

    // ── Security Layer 2: Rate limit ──
    const ip = getClientIp(req);
    const qnaLimit = await consumeRateLimit({
      scope: "qna-question",
      identifier: ip,
      limit: QNA_LIMIT,
      windowSeconds: QNA_WINDOW_SECONDS,
    });
    if (qnaLimit.limited) {
      return Response.json(
        { error: "ตั้งกระทู้ได้สูงสุด 5 กระทู้ต่อชั่วโมง" },
        {
          status: 429,
          headers: { "Retry-After": String(qnaLimit.retryAfterSeconds) },
        }
      );
    }

    // ── Security Layer 3: Body size limit (max 10KB) ──
    const rawBody = await req.text();
    if (rawBody.length > 10240) {
      return Response.json({ error: "ข้อมูลมีขนาดใหญ่เกินไป" }, { status: 413 });
    }

    const body = JSON.parse(rawBody);

    // ── Security Layer 4: Honeypot bot trap ──
    if (body._website || body._url || body._hp) {
      return Response.json({ question: { id: 0 } }, { status: 201 });
    }

    const { memberCode } = body;
    const authorName = typeof body.authorName === "string" ? stripMarkers(body.authorName) : "";
    const title = typeof body.title === "string" ? stripMarkers(body.title) : "";
    const questionBody = typeof body.body === "string" ? stripMarkers(body.body) : "";

    if (!title.trim() || !questionBody.trim()) {
      return Response.json({ error: "กรุณากรอกหัวข้อและเนื้อหา" }, { status: 400 });
    }

    // ── กันแอบอ้างเป็นเจ้าหน้าที่ ──
    if (isReservedName(authorName)) {
      return Response.json({ error: RESERVED_NAME_ERROR }, { status: 400 });
    }

    // ── ห้ามโพสต์เลขบัตรประชาชน/เลขบัญชี (หน้าเว็บเตือนแล้ว — ตรงนี้กันการยิง API ตรง) ──
    if (findSensitive(`${title}\n${questionBody}`).some((m) => m.type !== "phone")) {
      return Response.json({ error: BLOCKED_DATA_ERROR }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.create({
      data: {
        authorName: truncate(authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม", 255),
        memberCode: truncate(memberCode?.trim() || "000000", 50),
        title: truncate(title.trim(), 500),
        body: truncate(questionBody.trim(), 5000),
      },
    });

    after(() => notifyNewQuestion(question));
    return Response.json({ question: { id: question.id } }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
