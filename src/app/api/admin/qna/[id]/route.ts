import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { id } = await params;
    const qid = parseInt(id, 10);
    if (Number.isNaN(qid)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.findUnique({
      where: { id: qid },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorName: true,
            memberCode: true,
            body: true,
            isAdmin: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: { select: { replies: true } },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({
      question: {
        ...question,
        replyCount: question._count.replies,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Admin QnA detail error:", error);
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { id } = await params;
    const qid = parseInt(id, 10);
    if (Number.isNaN(qid)) {
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
        authorName: sanitize(authorName || user.fullName || "เจ้าหน้าที่สหกรณ์").slice(0, 255),
        body: sanitize(replyBody.trim()).slice(0, 5000),
        isAdmin: true,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const replyId = parseInt(searchParams.get("replyId") || "", 10);

    if (Number.isNaN(replyId)) {
      return NextResponse.json({ error: "Invalid reply ID" }, { status: 400 });
    }

    await prisma.qnaReply.delete({ where: { id: replyId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete reply error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
