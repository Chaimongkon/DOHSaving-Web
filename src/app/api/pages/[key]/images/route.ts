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

    let images: string[] = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (typeof parsed === "string") {
          images = [parsed];
        }
      } catch {
        // Fallback for old single string data
        images = setting.value ? [setting.value] : [];
      }
    }

    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
