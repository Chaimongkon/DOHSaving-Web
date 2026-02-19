import { NextRequest, NextResponse } from "next/server";
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

// Rate limit: 10 replies per hour per IP
const replyLimitMap = new Map<string, number[]>();
function isReplyLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (replyLimitMap.get(ip) || []).filter((t) => now - t < 3600000);
  replyLimitMap.set(ip, ts);
  if (ts.length >= 10) return true;
  ts.push(now);
  replyLimitMap.set(ip, ts);
  return false;
}

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

    // Increment views
    await prisma.qnaQuestion.update({
      where: { id: qid },
      data: { views: { increment: 1 } },
    });

    const question = await prisma.qnaQuestion.findFirst({
      where: { id: qid, isActive: true },
      include: {
        replies: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorName: true,
            memberCode: true,
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

    return NextResponse.json({ question });
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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isReplyLimited(ip)) {
      return NextResponse.json(
        { error: "ตอบกระทู้ได้สูงสุด 10 ครั้งต่อชั่วโมง" },
        { status: 429 }
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

    const { authorName, memberCode, body: replyBody } = body;

    if (!replyBody) {
      return NextResponse.json({ error: "กรุณากรอกข้อความ" }, { status: 400 });
    }

    const reply = await prisma.qnaReply.create({
      data: {
        questionId: qid,
        authorName: truncate(sanitize(authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม"), 255),
        memberCode: truncate(sanitize(memberCode?.trim() || "000000"), 50),
        body: truncate(sanitize(replyBody.trim()), 5000),
        isAdmin: false,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
