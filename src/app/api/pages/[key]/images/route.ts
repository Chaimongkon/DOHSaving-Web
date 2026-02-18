import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/pages/:key/images — ดึงรูป infographic (public, single image)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `page_${key}_image` },
    });

    return NextResponse.json(
      { image: setting?.value || "" },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return NextResponse.json({ image: "" }, { status: 500 });
  }
}
