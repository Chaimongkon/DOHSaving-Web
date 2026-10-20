import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { decodeEntities } from "@/lib/decodeEntities";

// GET /api/admin/qna — รายการกระทู้สำหรับเจ้าหน้าที่
//   ?filter=all|pending|answered|pinned|hidden  ?search=  ?page=  ?limit= (สูงสุด 100)
// "pending" = กระทู้ที่ยังเปิดและข้อความล่าสุดมาจากสมาชิก (หรือยังไม่มีคำตอบ) — นับจากข้อความล่าสุดจริง
// จึงกรอง/นับในหน่วยความจำ (กระดานของสหกรณ์มีหลักร้อยกระทู้ ข้อมูลที่ดึงมีแค่สถานะ)
type Filter = "all" | "pending" | "answered" | "pinned" | "hidden";
const FILTERS: Filter[] = ["all", "pending", "answered", "pinned", "hidden"];

export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const rawFilter = searchParams.get("filter") as Filter;
    const filter: Filter = FILTERS.includes(rawFilter) ? rawFilter : "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "30") || 30));

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { body: { contains: search } },
            { authorName: { contains: search } },
            { memberCode: { contains: search } },
          ],
        }
      : {};

    const states = await prisma.qnaQuestion.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        isPinned: true,
        isClosed: true,
        isActive: true,
        createdAt: true,
        replies: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { isAdmin: true, createdAt: true },
        },
      },
    });

    const withState = states.map((s) => {
      const last = s.replies[0];
      return {
        id: s.id,
        isPinned: s.isPinned,
        isActive: s.isActive,
        needsReply: s.isActive && !s.isClosed && (!last || !last.isAdmin),
        lastActivity: (last?.createdAt ?? s.createdAt).getTime(),
      };
    });

    const counts = {
      all: withState.length,
      pending: withState.filter((s) => s.needsReply).length,
      answered: withState.filter((s) => !s.needsReply && s.isActive).length,
      pinned: withState.filter((s) => s.isPinned).length,
      hidden: withState.filter((s) => !s.isActive).length,
    };

    let picked = withState;
    if (filter === "pending") {
      // รอตอบ: ใครรอนานที่สุดขึ้นก่อน
      picked = withState.filter((s) => s.needsReply).sort((a, b) => a.lastActivity - b.lastActivity);
    } else if (filter === "answered") picked = withState.filter((s) => !s.needsReply && s.isActive);
    else if (filter === "pinned") picked = withState.filter((s) => s.isPinned);
    else if (filter === "hidden") picked = withState.filter((s) => !s.isActive);

    const total = picked.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageIds = picked.slice((page - 1) * limit, page * limit);
    const stateById = new Map(pageIds.map((s) => [s.id, s]));

    const rows = await prisma.qnaQuestion.findMany({
      where: { id: { in: pageIds.map((s) => s.id) } },
      include: { _count: { select: { replies: true } } },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    return NextResponse.json({
      questions: pageIds
        .map((s) => byId.get(s.id))
        .filter((q): q is NonNullable<typeof q> => !!q)
        .map((q) => ({
          ...q,
          authorName: decodeEntities(q.authorName),
          memberCode: decodeEntities(q.memberCode),
          title: decodeEntities(q.title),
          body: undefined,
          excerpt: decodeEntities(q.body).replace(/\s+/g, " ").trim().slice(0, 140),
          replyCount: q._count.replies,
          needsReply: stateById.get(q.id)!.needsReply,
          lastActivity: new Date(stateById.get(q.id)!.lastActivity).toISOString(),
          _count: undefined,
        })),
      total,
      page,
      totalPages,
      counts,
    });
  } catch (error) {
    console.error("Admin QnA list error:", error);
    return NextResponse.json({ questions: [], total: 0, counts: null }, { status: 500 });
  }
}
// PATCH /api/admin/qna — update question (pin, close, hide)
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await req.json();
    const { id, isPinned, isClosed, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Whitelist only allowed fields — prevent mass assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (typeof isPinned === "boolean") data.isPinned = isPinned;
    if (typeof isClosed === "boolean") data.isClosed = isClosed;
    if (typeof isActive === "boolean") data.isActive = isActive;

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
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

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
