import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

async function deleteImageFile(imagePath: string | null) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  try {
    const filePath = path.join(process.cwd(), "public", imagePath);
    await unlink(filePath);
  } catch {
    // Ignore missing files.
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const slideId = parseInt(id, 10);

  try {
    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const slideId = parseInt(id, 10);

  try {
    const ipAddress = getAuditIpAddress(req);
    const existingSlide = await prisma.slide.findUnique({
      where: { id: slideId },
    });

    if (!existingSlide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const body = await req.json();
    const { imagePath, urlLink, title, subtitle, description, bgGradient, ctaText, sortOrder, isActive } = body;

    if (imagePath !== undefined && existingSlide.imagePath && existingSlide.imagePath !== imagePath) {
      await deleteImageFile(existingSlide.imagePath);
    }

    const slide = await prisma.slide.update({
      where: { id: slideId },
      data: {
        ...(imagePath !== undefined && { imagePath }),
        ...(urlLink !== undefined && { urlLink: urlLink || null }),
        ...(title !== undefined && { title: title || null }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(description !== undefined && { description: description || null }),
        ...(bgGradient !== undefined && { bgGradient: bgGradient || null }),
        ...(ctaText !== undefined && { ctaText: ctaText || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: user.userName,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "slides",
      recordId: slide.id,
      ipAddress,
      oldValues: existingSlide,
      newValues: slide,
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Failed to update slide:", error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const slideId = parseInt(id, 10);

  try {
    const ipAddress = getAuditIpAddress(req);
    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    await prisma.slide.delete({
      where: { id: slideId },
    });

    await deleteImageFile(slide.imagePath);

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "slides",
      recordId: slideId,
      ipAddress,
      oldValues: slide,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete slide:", error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}