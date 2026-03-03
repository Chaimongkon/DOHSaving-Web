import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/pages/:key/images — ดึงรูป infographic (single image)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}

// PUT /api/admin/pages/:key/images — บันทึกรูป infographic (single URL string)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;

  try {
    const body = await req.json();
    const { images } = body as { images: string[] };

    await prisma.siteSetting.upsert({
      where: { key: `page_${key}_image` },
      create: {
        key: `page_${key}_image`,
        value: JSON.stringify(images || []),
        remark: `รูป infographic หน้า ${key}`,
      },
      update: {
        value: JSON.stringify(images || []),
      },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Failed to save image:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
