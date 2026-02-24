import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/activity-photos?albumId=1 — photos for an album
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const albumId = parseInt(searchParams.get("albumId") || "0");
  if (!albumId) return NextResponse.json({ error: "Missing albumId" }, { status: 400 });

  try {
    const photos = await prisma.activityPhoto.findMany({
      where: { albumId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Failed to fetch photos:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/activity-photos — add photos (supports batch)
// body: { albumId, photos: [{ imageUrl, caption?, sortOrder? }] }
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const albumId = Number(body.albumId);
    if (!albumId) return NextResponse.json({ error: "Missing albumId" }, { status: 400 });

    const photosData: { imageUrl: string; caption?: string; sortOrder?: number }[] = body.photos || [];
    if (photosData.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const created = await prisma.activityPhoto.createMany({
      data: photosData.map((p, idx) => ({
        albumId,
        imageUrl: p.imageUrl,
        caption: p.caption || null,
        sortOrder: p.sortOrder ?? idx,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error) {
    console.error("Failed to add photos:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/activity-photos — update single photo caption/order
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (body.caption !== undefined) data.caption = body.caption || null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const photo = await prisma.activityPhoto.update({ where: { id }, data });
    return NextResponse.json(photo);
  } catch (error) {
    console.error("Failed to update photo:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/admin/activity-photos?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.activityPhoto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
