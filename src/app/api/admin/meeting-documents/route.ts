import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/meeting-documents — fetch all (including inactive)
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.meetingDocument.findMany({
      orderBy: [{ year: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch meeting documents:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/meeting-documents — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.year || !body.title || !body.fileUrl) {
      return NextResponse.json({ error: "กรุณาระบุปี ชื่อเอกสาร และไฟล์ PDF" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.meetingDocument.create({
      data: {
        year: Number(body.year),
        title: body.title,
        fileUrl: body.fileUrl,
        coverUrl: body.coverUrl || null,
        category: body.category || "general",
        sortOrder: Number(body.sortOrder) || 0,
        description: body.description || null,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting document:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/meeting-documents — update existing
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.year !== undefined) data.year = Number(body.year);
    if (body.title !== undefined) data.title = body.title;
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl;
    if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null;
    if (body.category !== undefined) data.category = body.category;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.description !== undefined) data.description = body.description || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const item = await prisma.meetingDocument.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update meeting document:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/meeting-documents?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.meetingDocument.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meeting document:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
