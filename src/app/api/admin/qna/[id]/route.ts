import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/qna/[id] — admin reply to a question
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

    const body = await req.json();
    const { body: replyBody, authorName } = body;

    if (!replyBody) {
      return NextResponse.json({ error: "กรุณากรอกข้อความ" }, { status: 400 });
    }

    const reply = await prisma.qnaReply.create({
      data: {
        questionId: qid,
        authorName: authorName || "เจ้าหน้าที่สหกรณ์",
        body: replyBody.trim(),
        isAdmin: true,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/qna/[id] — admin delete a reply
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const replyId = parseInt(searchParams.get("replyId") || "");

    if (isNaN(replyId)) {
      return NextResponse.json({ error: "Invalid reply ID" }, { status: 400 });
    }

    await prisma.qnaReply.delete({ where: { id: replyId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete reply error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
