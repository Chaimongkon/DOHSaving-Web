import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

async function deleteFile(filePath: string | null) {
  if (!filePath || !filePath.startsWith("/uploads/")) return;
  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    await unlink(fullPath);
  } catch {
    // Ignore missing files.
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const notificationId = parseInt(id, 10);

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const notificationId = parseInt(id, 10);

  try {
    const ipAddress = getAuditIpAddress(req);
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, imagePath, urlLink, sortOrder, startDate, endDate, isActive } = body;

    if (imagePath !== undefined && existingNotification.imagePath && existingNotification.imagePath !== imagePath) {
      await deleteFile(existingNotification.imagePath);
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(imagePath !== undefined && { imagePath: imagePath || null }),
        ...(urlLink !== undefined && { urlLink: urlLink || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "notifications",
      recordId: notification.id,
      ipAddress,
      oldValues: existingNotification,
      newValues: notification,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const notificationId = parseInt(id, 10);

  try {
    const ipAddress = getAuditIpAddress(req);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    await deleteFile(notification.imagePath);

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "notifications",
      recordId: notificationId,
      ipAddress,
      oldValues: notification,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}