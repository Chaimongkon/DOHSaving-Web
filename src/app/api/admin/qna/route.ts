import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/qna — list all questions (admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = search ? { title: { contains: search } } : {};

    const [questions, total] = await Promise.all([
      prisma.qnaQuestion.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          _count: { select: { replies: true } },
        },
      }),
      prisma.qnaQuestion.count({ where }),
    ]);

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        replyCount: q._count.replies,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin QnA list error:", error);
    return NextResponse.json({ questions: [], total: 0 }, { status: 500 });
  }
}

// PATCH /api/admin/qna — update question (pin, close, hide)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.update({
      where: { id },
      data,
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Admin QnA update error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/qna — delete question
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.qnaQuestion.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin QnA delete error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
