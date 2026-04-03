import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

// GET /api/admin/slides — ดึงรายการ slide ทั้งหมด
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const slides = await prisma.slide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error("Failed to fetch slides:", error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}

// POST /api/admin/slides — สร้าง slide ใหม่
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const { imagePath, urlLink, title, subtitle, description, bgGradient, ctaText, sortOrder, isActive } = body;

    if (!imagePath) {
      return NextResponse.json(
        { error: "กรุณาอัพโหลดรูปภาพ" },
        { status: 400 }
      );
    }

    const slide = await prisma.slide.create({
      data: {
        imagePath,
        urlLink: urlLink || null,
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        bgGradient: bgGradient || null,
        ctaText: ctaText || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        createdBy: user.userName,
        updatedBy: user.userName,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "slides",
      recordId: slide.id,
      ipAddress,
      newValues: slide,
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error("Failed to create slide:", error);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}
