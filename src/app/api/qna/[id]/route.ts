import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";
import { decodeEntities } from "@/lib/decodeEntities";
import {
  BLOCKED_DATA_ERROR,
  RESERVED_NAME_ERROR,
  findSensitive,
  isReservedName,
  maskForPublic,
  maskPlain,
  phoneExpired,
  stripMarkers,
} from "@/lib/qnaPrivacy";

function truncate(val: string, max: number): string {
  return val.length > max ? val.slice(0, max) : val;
}

const REPLY_LIMIT = 10;
const REPLY_WINDOW_SECONDS = 60 * 60;

// GET /api/qna/[id] — get single question + replies
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qid = parseInt(id);
    if (isNaN(qid)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // updateMany ไม่ throw เมื่อไม่พบ → กระทู้ที่ไม่มี/ถูกซ่อนได้ 404 แทน 500
    const { count } = await prisma.qnaQuestion.updateMany({
      where: { id: qid, isActive: true },
      data: { views: { increment: 1 } },
    });
    if (count === 0) {
      return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });
    }

    // ไม่ส่ง memberCode ออกสู่สาธารณะ — เลขสมาชิกเป็นข้อมูลส่วนบุคคล (แอดมินดูผ่าน /api/admin/qna)
    const question = await prisma.qnaQuestion.findFirst({
      where: { id: qid, isActive: true },
      select: {
        id: true,
        authorName: true,
        title: true,
        body: true,
        views: true,
        isPinned: true,
        isClosed: true,
        createdAt: true,
        replies: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorName: true,
            body: true,
            isAdmin: true,
            createdAt: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });
    }

    // เบอร์โทรไม่อยู่ในหน้าเว็บ — ส่งเป็น marker ให้กด "ดูเบอร์" ผ่าน /api/qna/[id]/contact
    // เกิน 30 วัน หรือกระทู้ปิดแล้ว → ซ่อนถาวร · คำตอบเจ้าหน้าที่ (เบอร์ทางการ) ไม่ซ่อน
    return NextResponse.json({
      question: {
        ...question,
        authorName: decodeEntities(question.authorName),
        title: maskPlain(decodeEntities(question.title)),
        body: maskForPublic(decodeEntities(question.body), !phoneExpired(question.createdAt, question.isClosed)),
        replies: question.replies.map((r) => ({
          ...r,
          authorName: decodeEntities(r.authorName),
          body: r.isAdmin
            ? decodeEntities(r.body)
            : maskForPublic(decodeEntities(r.body), !phoneExpired(r.createdAt, question.isClosed)),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get question:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/qna/[id] — add reply to a question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qid = parseInt(id);
    if (isNaN(qid)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.findFirst({
      where: { id: qid, isActive: true },
    });

    if (!question) {
      return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });
    }

    if (question.isClosed) {
      return NextResponse.json({ error: "กระทู้นี้ปิดรับคำตอบแล้ว" }, { status: 403 });
    }

    // ── Security: Content-Type check ──
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
    }

    // ── Security: Rate limit ──
    const ip = getClientIp(req);
    const replyLimit = await consumeRateLimit({
      scope: "qna-reply",
      identifier: ip,
      limit: REPLY_LIMIT,
      windowSeconds: REPLY_WINDOW_SECONDS,
    });
    if (replyLimit.limited) {
      return NextResponse.json(
        { error: "ตอบกระทู้ได้สูงสุด 10 ครั้งต่อชั่วโมง" },
        {
          status: 429,
          headers: { "Retry-After": String(replyLimit.retryAfterSeconds) },
        }
      );
    }

    // ── Security: Body size limit (max 10KB) ──
    const rawBody = await req.text();
    if (rawBody.length > 10240) {
      return NextResponse.json({ error: "ข้อมูลมีขนาดใหญ่เกินไป" }, { status: 413 });
    }

    const body = JSON.parse(rawBody);

    // ── Security: Honeypot bot trap ──
    if (body._website || body._url || body._hp) {
      return NextResponse.json({ reply: { id: 0 } }, { status: 201 });
    }

    const { memberCode } = body;
    const authorName = typeof body.authorName === "string" ? stripMarkers(body.authorName) : "";
    const replyBody = typeof body.body === "string" ? stripMarkers(body.body) : "";

    if (!replyBody.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อความ" }, { status: 400 });
    }

    if (isReservedName(authorName)) {
      return NextResponse.json({ error: RESERVED_NAME_ERROR }, { status: 400 });
    }

    if (findSensitive(replyBody).some((m) => m.type !== "phone")) {
      return NextResponse.json({ error: BLOCKED_DATA_ERROR }, { status: 400 });
    }

    const reply = await prisma.qnaReply.create({
      data: {
        questionId: qid,
        authorName: truncate(authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม", 255),
        memberCode: truncate(memberCode?.trim() || "000000", 50),
        body: truncate(replyBody.trim(), 5000),
        isAdmin: false,
      },
    });

    return NextResponse.json({ reply: { id: reply.id } }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
