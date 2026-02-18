import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/news/:id — ดึงข่าวตาม id (public) + เพิ่ม viewCount
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    });

    if (!news || !news.isActive) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // เพิ่ม viewCount
    await prisma.news.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(news, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
