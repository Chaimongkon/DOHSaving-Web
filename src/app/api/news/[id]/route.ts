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

    const updated = await prisma.news.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(updated, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
