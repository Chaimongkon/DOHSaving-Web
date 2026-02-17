import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// ลบไฟล์ภาพจาก disk (ถ้าเป็น local upload)
async function deleteImageFile(imagePath: string | null) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  try {
    const filePath = path.join(process.cwd(), "public", imagePath);
    await unlink(filePath);
  } catch {
    // ไฟล์อาจถูกลบไปแล้ว หรือไม่มีอยู่
  }
}

// GET /api/admin/slides/:id — ดึง slide ตาม id
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
    const slide = await prisma.slide.findUnique({
      where: { id: parseInt(id) },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to fetch slide:", error);
    return NextResponse.json({ error: "Failed to fetch slide" }, { status: 500 });
  }
}

// PUT /api/admin/slides/:id — อัพเดท slide
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
    const { imagePath, urlLink, title, subtitle, description, bgGradient, ctaText, sortOrder, isActive } = body;

    // ลบไฟล์ภาพเก่าถ้าเปลี่ยนภาพใหม่
    if (imagePath !== undefined) {
      const oldSlide = await prisma.slide.findUnique({ where: { id: parseInt(id) }, select: { imagePath: true } });
      if (oldSlide?.imagePath && oldSlide.imagePath !== imagePath) {
        await deleteImageFile(oldSlide.imagePath);
      }
    }

    const slide = await prisma.slide.update({
      where: { id: parseInt(id) },
      data: {
        ...(imagePath !== undefined && { imagePath }),
        ...(urlLink !== undefined && { urlLink: urlLink || null }),
        ...(title !== undefined && { title: title || null }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(description !== undefined && { description: description || null }),
        ...(bgGradient !== undefined && { bgGradient: bgGradient || null }),
        ...(ctaText !== undefined && { ctaText: ctaText || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to update slide:", error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

// DELETE /api/admin/slides/:id — ลบ slide
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
    // ดึงข้อมูลภาพก่อนลบ
    const slide = await prisma.slide.findUnique({ where: { id: parseInt(id) }, select: { imagePath: true } });

    await prisma.slide.delete({
      where: { id: parseInt(id) },
    });

    // ลบไฟล์ภาพออกจาก disk
    if (slide) await deleteImageFile(slide.imagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete slide:", error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
