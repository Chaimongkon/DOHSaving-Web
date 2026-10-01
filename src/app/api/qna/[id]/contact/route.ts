import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";
import { decodeEntities } from "@/lib/decodeEntities";
import { phoneAt, phoneExpired } from "@/lib/qnaPrivacy";

// เพียงพอสำหรับคนจริงที่ไล่ดูหลายกระทู้ แต่บอทกวาดเบอร์ทั้งกระดานไม่ได้
const REVEAL_LIMIT = 15;
const REVEAL_WINDOW_SECONDS = 10 * 60;

const NO_STORE = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

// GET /api/qna/[id]/contact?src=q|<replyId>&i=<index> — เปิดดูเบอร์ติดต่อ 1 เบอร์ (ปุ่ม "แตะเพื่อดูเบอร์")
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qid = parseInt(id);
    const { searchParams } = new URL(req.url);
    const src = searchParams.get("src") || "";
    const index = parseInt(searchParams.get("i") || "");
    if (isNaN(qid) || isNaN(index) || index < 0 || !/^(q|\d+)$/.test(src)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: NO_STORE });
    }

    const limit = await consumeRateLimit({
      scope: "qna-reveal",
      identifier: getClientIp(req),
      limit: REVEAL_LIMIT,
      windowSeconds: REVEAL_WINDOW_SECONDS,
    });
    if (limit.limited) {
      return NextResponse.json(
        { error: "เปิดดูเบอร์บ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
        { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const question = await prisma.qnaQuestion.findFirst({
      where: { id: qid, isActive: true },
      select: { body: true, createdAt: true, isClosed: true },
    });
    if (!question) {
      return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404, headers: NO_STORE });
    }

    let text: string;
    let createdAt: Date;
    if (src === "q") {
      text = question.body;
      createdAt = question.createdAt;
    } else {
      // เบอร์ในคำตอบเจ้าหน้าที่แสดงตรง ๆ อยู่แล้ว → ที่นี่รองรับเฉพาะคำตอบสมาชิก
      const reply = await prisma.qnaReply.findFirst({
        where: { id: parseInt(src), questionId: qid, isActive: true, isAdmin: false },
        select: { body: true, createdAt: true },
      });
      if (!reply) {
        return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404, headers: NO_STORE });
      }
      text = reply.body;
      createdAt = reply.createdAt;
    }

    if (phoneExpired(createdAt, question.isClosed)) {
      return NextResponse.json({ error: "เบอร์ติดต่อนี้หมดอายุการแสดงแล้ว" }, { status: 410, headers: NO_STORE });
    }

    const phone = phoneAt(decodeEntities(text), index);
    if (!phone) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ phone }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to reveal contact:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500, headers: NO_STORE });
  }
}
