import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const { title, imagePath, urlLink, sortOrder, startDate, endDate, isActive } = body;

    if (!imagePath) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปภาพ" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        title: title || null,
        imagePath: imagePath || null,
        urlLink: urlLink || null,
        sortOrder: sortOrder ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? false,
        createdBy: user.userName,
        updatedBy: user.userName,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "notifications",
      recordId: notification.id,
      ipAddress,
      newValues: notification,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}