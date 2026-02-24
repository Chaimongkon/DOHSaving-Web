import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/service-pages — fetch all
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.servicePage.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch service pages:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/service-pages — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.slug || !body.title || !body.category) {
      return NextResponse.json({ error: "กรุณาระบุ slug, ชื่อหน้า และหมวดหมู่" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.servicePage.create({
      data: {
        slug: body.slug,
        title: body.title,
        category: body.category,
        infographicUrl: body.infographicUrl || null,
        downloadLinks: body.downloadLinks || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create service page:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/service-pages — update
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.title !== undefined) data.title = body.title;
    if (body.category !== undefined) data.category = body.category;
    if (body.infographicUrl !== undefined) data.infographicUrl = body.infographicUrl || null;
    if (body.downloadLinks !== undefined) data.downloadLinks = body.downloadLinks || null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const item = await prisma.servicePage.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update service page:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/service-pages?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.servicePage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service page:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
