import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pages/:key — ดึงเนื้อหาหน้าเพจ (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `page_${key}` },
    });

    if (!setting || !setting.value) {
      return NextResponse.json({ content: "" });
    }

    return NextResponse.json(
      { content: setting.value },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json({ content: "" }, { status: 500 });
  }
}
