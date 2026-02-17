import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/slides — ดึงรายการ slide ทั้งหมด
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { imagePath, urlLink, sortOrder, isActive } = body;

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
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        createdBy: user.userName,
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error("Failed to create slide:", error);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}
