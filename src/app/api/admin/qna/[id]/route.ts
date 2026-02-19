import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// ─── XSS Sanitizer ───
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// POST /api/admin/qna/[id] — admin reply to a question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

// DELETE /api/admin/qna/[id] — admin delete a reply
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
