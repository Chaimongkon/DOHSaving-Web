import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/news — ดึงรายการข่าวทั้งหมด
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const news = await prisma.news.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

// POST /api/admin/news — สร้างข่าวใหม่
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, details, imagePath, pdfPath, legacyPath, category, isPinned, isActive } = body;

    if (!title) {
      return NextResponse.json({ error: "กรุณาระบุหัวข้อข่าว" }, { status: 400 });
    }

    const news = await prisma.news.create({
      data: {
        title,
        details: details || null,
        imagePath: imagePath || null,
        pdfPath: pdfPath || null,
        legacyPath: legacyPath || null,
        category: category || "general",
        isPinned: isPinned ?? false,
        isActive: isActive ?? true,
        createdBy: user.userName,
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Failed to create news:", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}
