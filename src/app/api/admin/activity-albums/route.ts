import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/activity-albums — all albums with photo count
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.activityAlbum.findMany({
      orderBy: [{ sortOrder: "asc" }, { eventDate: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { photos: true } } },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/activity-albums — create album
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "กรุณาระบุชื่ออัลบั้ม" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const album = await prisma.activityAlbum.create({
      data: {
        title: body.title,
        description: body.description || null,
        coverUrl: body.coverUrl || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error("Failed to create album:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/activity-albums — update album
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null;
    if (body.eventDate !== undefined) data.eventDate = body.eventDate ? new Date(body.eventDate) : null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const album = await prisma.activityAlbum.update({ where: { id }, data });
    return NextResponse.json(album);
  } catch (error) {
    console.error("Failed to update album:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/activity-albums?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.activityAlbum.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete album:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
