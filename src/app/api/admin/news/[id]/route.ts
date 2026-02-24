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

// GET /api/admin/news/:id
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
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    });

    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

// PUT /api/admin/news/:id — อัพเดทข่าว
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
    const { title, details, imagePath, pdfPath, legacyPath, category, isPinned, isActive } = body;

    // ลบไฟล์เก่าถ้าเปลี่ยนภาพหรือ PDF
    if (imagePath !== undefined || pdfPath !== undefined) {
      const oldNews = await prisma.news.findUnique({
        where: { id: parseInt(id) },
        select: { imagePath: true, pdfPath: true },
      });
      if (oldNews) {
        if (imagePath !== undefined && oldNews.imagePath && oldNews.imagePath !== imagePath) {
          await deleteFile(oldNews.imagePath);
        }
        if (pdfPath !== undefined && oldNews.pdfPath && oldNews.pdfPath !== pdfPath) {
          await deleteFile(oldNews.pdfPath);
        }
      }
    }

    const news = await prisma.news.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(details !== undefined && { details: details || null }),
        ...(imagePath !== undefined && { imagePath: imagePath || null }),
        ...(pdfPath !== undefined && { pdfPath: pdfPath || null }),
        ...(legacyPath !== undefined && { legacyPath: legacyPath || null }),
        ...(category !== undefined && { category }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to update news:", error);
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
  }
}

// DELETE /api/admin/news/:id — ลบข่าว
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
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
      select: { imagePath: true, pdfPath: true },
    });

    await prisma.news.delete({
      where: { id: parseInt(id) },
    });

    // ลบไฟล์ออกจาก disk
    if (news) {
      await deleteFile(news.imagePath);
      await deleteFile(news.pdfPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete news:", error);
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
  }
}
