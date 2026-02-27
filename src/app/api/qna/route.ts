import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// ─── Security helpers ───
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function truncate(val: string, max: number): string {
  return val.length > max ? val.slice(0, max) : val;
}

// Rate limit: 5 questions per hour per IP
const qnaLimitMap = new Map<string, number[]>();
function isQnaLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (qnaLimitMap.get(ip) || []).filter((t) => now - t < 3600000);
  qnaLimitMap.set(ip, ts);
  if (ts.length >= 5) return true;
  ts.push(now);
  qnaLimitMap.set(ip, ts);
  return false;
}

// GET /api/qna — list questions (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all | answered | unanswered
    const sort = searchParams.get("sort") || "latest"; // latest | popular
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (search) where.title = { contains: search };
    if (filter === "answered") where.replies = { some: { isActive: true } };
    if (filter === "unanswered") where.replies = { none: { isActive: true } };

    const orderBy =
      sort === "popular"
        ? [{ isPinned: "desc" as const }, { views: "desc" as const }]
        : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    const [questions, total, totalAll, totalAnswered] = await Promise.all([
      prisma.qnaQuestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          authorName: true,
          title: true,
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
      prisma.qnaQuestion.count({ where }),
      prisma.qnaQuestion.count({ where: { isActive: true } }),
      prisma.qnaQuestion.count({
        where: { isActive: true, replies: { some: { isActive: true } } },
      }),
    ]);

    return Response.json({
      questions: questions.map((q) => ({
        ...q,
        replyCount: q._count.replies,
        latestReply: q.replies[0] || null,
        replies: undefined,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isQnaLimited(ip)) {
      return Response.json(
        { error: "ตั้งกระทู้ได้สูงสุด 5 กระทู้ต่อชั่วโมง" },
        { status: 429 }
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

    const { authorName, memberCode, title, body: questionBody } = body;

    if (!title || !questionBody) {
      return Response.json({ error: "กรุณากรอกหัวข้อและเนื้อหา" }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.create({
      data: {
        authorName: truncate(sanitize(authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม"), 255),
        memberCode: truncate(sanitize(memberCode?.trim() || "000000"), 50),
        title: truncate(sanitize(title.trim()), 500),
        body: truncate(sanitize(questionBody.trim()), 5000),
      },
    });

    return Response.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
