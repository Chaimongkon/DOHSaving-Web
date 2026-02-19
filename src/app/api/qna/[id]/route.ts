import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const body = await req.json();
    const { authorName, memberCode, body: replyBody } = body;

    if (!replyBody) {
      return NextResponse.json({ error: "กรุณากรอกข้อความ" }, { status: 400 });
    }

    const reply = await prisma.qnaReply.create({
      data: {
        questionId: qid,
        authorName: authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม",
        memberCode: memberCode?.trim() || "000000",
        body: replyBody.trim(),
        isAdmin: false,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
