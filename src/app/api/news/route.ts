import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/news — ดึงข่าวที่ active สำหรับหน้าเว็บ (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const news = await prisma.news.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      select: {
        id: true,
        title: true,
        details: true,
        imagePath: true,
        pdfPath: true,
        category: true,
        viewCount: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(news, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json([], { status: 500 });
  }
}
