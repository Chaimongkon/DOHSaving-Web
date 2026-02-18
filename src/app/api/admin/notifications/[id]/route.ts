import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// ลบไฟล์จาก disk (ถ้าเป็น local upload)
async function deleteFile(filePath: string | null) {
  if (!filePath || !filePath.startsWith("/uploads/")) return;
  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    await unlink(fullPath);
  } catch {
    // ไฟล์อาจถูกลบไปแล้ว
  }
}

// GET /api/admin/notifications/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 });
  }
}

// PUT /api/admin/notifications/:id — อัพเดท
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { imagePath, urlLink, isActive } = body;

    // ลบรูปเก่าถ้าเปลี่ยนรูป
    if (imagePath !== undefined) {
      const old = await prisma.notification.findUnique({
        where: { id: parseInt(id) },
        select: { imagePath: true },
      });
      if (old && old.imagePath && old.imagePath !== imagePath) {
        await deleteFile(old.imagePath);
      }
    }

    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        ...(imagePath !== undefined && { imagePath: imagePath || null }),
        ...(urlLink !== undefined && { urlLink: urlLink || null }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications/:id — ลบ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      select: { imagePath: true },
    });

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    // ลบไฟล์ออกจาก disk
    if (notification) {
      await deleteFile(notification.imagePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
