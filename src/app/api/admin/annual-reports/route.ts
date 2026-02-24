import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/annual-reports — fetch all (including inactive)
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.annualReport.findMany({
      orderBy: { year: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch annual reports:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/annual-reports — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.year || !body.title || !body.fileUrl) {
      return NextResponse.json({ error: "กรุณาระบุปี ชื่อรายงาน และไฟล์ PDF" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.annualReport.create({
      data: {
        year: Number(body.year),
        title: body.title,
        coverUrl: body.coverUrl || null,
        fileUrl: body.fileUrl,
        legacyPath: body.legacyPath || null,
        description: body.description || null,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create annual report:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/annual-reports — update existing
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
    if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null;
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl;
    if (body.legacyPath !== undefined) data.legacyPath = body.legacyPath || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const item = await prisma.annualReport.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update annual report:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/annual-reports?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.annualReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete annual report:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
