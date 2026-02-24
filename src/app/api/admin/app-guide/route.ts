import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/app-guide — fetch all sections
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.appGuideSection.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch app guide sections:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/app-guide — create section
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหัวข้อ" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.appGuideSection.create({
      data: {
        title: body.title,
        images: body.images || "[]",
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create app guide section:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/app-guide — update section
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.title !== undefined) data.title = body.title;
    if (body.images !== undefined) data.images = body.images;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const item = await prisma.appGuideSection.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update app guide section:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/app-guide?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.appGuideSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete app guide section:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
