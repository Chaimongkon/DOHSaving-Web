import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const items = await prisma.coopVideo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    if (!body.title || !body.youtubeUrl) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและลิงก์ YouTube" }, { status: 400 });
    }

    const youtubeId = extractYoutubeId(body.youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");

    const video = await prisma.coopVideo.create({
      data: {
        title: body.title,
        youtubeUrl: body.youtubeUrl,
        youtubeId,
        thumbnailUrl,
        description: body.description || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "coop_videos",
      recordId: video.id,
      ipAddress,
      newValues: video,
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Failed to create video:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingVideo = await prisma.coopVideo.findUnique({ where: { id } });
    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    if (body.youtubeUrl !== undefined) {
      const youtubeId = extractYoutubeId(body.youtubeUrl);
      if (!youtubeId) {
        return NextResponse.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
      }
      data.youtubeUrl = body.youtubeUrl;
      data.youtubeId = youtubeId;
      data.thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    const video = await prisma.coopVideo.update({ where: { id }, data });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "coop_videos",
      recordId: video.id,
      ipAddress,
      oldValues: existingVideo,
      newValues: video,
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Failed to update video:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingVideo = await prisma.coopVideo.findUnique({ where: { id } });
    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    await prisma.coopVideo.delete({ where: { id } });

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "coop_videos",
      recordId: id,
      ipAddress,
      oldValues: existingVideo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete video:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}