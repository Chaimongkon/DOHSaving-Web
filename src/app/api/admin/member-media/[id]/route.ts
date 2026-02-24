import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// PUT /api/admin/member-media/[id] — อัปเดตรายการ
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    const body = await req.json();
    const { title, description, category, coverUrl, filePath, fileType, legacyPath, sortOrder, isActive } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (category !== undefined) data.category = category;
    if (coverUrl !== undefined) data.coverUrl = coverUrl || null;
    if (filePath !== undefined) data.filePath = filePath || null;
    if (fileType !== undefined) data.fileType = fileType;
    if (legacyPath !== undefined) data.legacyPath = legacyPath || null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const item = await prisma.memberMedia.update({
      where: { id: itemId },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update member media:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/member-media/[id] — ลบรายการ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.memberMedia.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete member media:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
