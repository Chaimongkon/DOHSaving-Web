import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/slides/:id — ดึง slide ตาม id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const slide = await prisma.slide.findUnique({
      where: { id: parseInt(id) },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to fetch slide:", error);
    return NextResponse.json({ error: "Failed to fetch slide" }, { status: 500 });
  }
}

// PUT /api/admin/slides/:id — อัพเดท slide
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { imagePath, urlLink, sortOrder, isActive } = body;

    const slide = await prisma.slide.update({
      where: { id: parseInt(id) },
      data: {
        ...(imagePath !== undefined && { imagePath }),
        ...(urlLink !== undefined && { urlLink }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to update slide:", error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

// DELETE /api/admin/slides/:id — ลบ slide
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.slide.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete slide:", error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
