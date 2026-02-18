import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/pages/:key/images — ดึงรูป infographic
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
      where: { key: `page_${key}_images` },
    });

    const images: string[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}

// PUT /api/admin/pages/:key/images — บันทึกรูป infographic (JSON array of URLs)
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
      where: { key: `page_${key}_images` },
      create: {
        key: `page_${key}_images`,
        value: JSON.stringify(images || []),
        remark: `รูปภาพ infographic หน้า ${key}`,
      },
      update: {
        value: JSON.stringify(images || []),
      },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Failed to save images:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
