import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/pages/:key — ดึงเนื้อหาหน้าเพจ
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
      where: { key: `page_${key}` },
    });

    return NextResponse.json({
      key,
      content: setting?.value || "",
      remark: setting?.remark || "",
      updatedAt: setting?.updatedAt || null,
    });
  } catch (error) {
    console.error("Failed to fetch page content:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT /api/admin/pages/:key — บันทึก/อัปเดตเนื้อหาหน้าเพจ
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
    const { content, remark } = body;

    const setting = await prisma.siteSetting.upsert({
      where: { key: `page_${key}` },
      create: {
        key: `page_${key}`,
        value: content || "",
        remark: remark || `เนื้อหาหน้า ${key}`,
      },
      update: {
        value: content || "",
        ...(remark !== undefined && { remark }),
      },
    });

    return NextResponse.json({
      key,
      content: setting.value,
      updatedAt: setting.updatedAt,
    });
  } catch (error) {
    console.error("Failed to save page content:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
