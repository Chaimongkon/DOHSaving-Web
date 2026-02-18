import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pages/:key/images — ดึงรูป infographic (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `page_${key}_images` },
    });

    const images: string[] = setting?.value ? JSON.parse(setting.value) : [];

    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
