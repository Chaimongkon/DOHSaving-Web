import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/member-media — ดึงทั้งหมด (รวม inactive)
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.memberMedia.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch member media:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/member-media — สร้างรายการใหม่
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, coverUrl, filePath, fileType, legacyPath, sortOrder, isActive } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและหมวดหมู่" }, { status: 400 });
    }

    const item = await prisma.memberMedia.create({
      data: {
        title,
        description: description || null,
        category,
        coverUrl: coverUrl || null,
        filePath: filePath || null,
        fileType: fileType || "pdf",
        legacyPath: legacyPath || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create member media:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
