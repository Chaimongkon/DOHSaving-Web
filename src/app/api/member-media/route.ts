import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/member-media — public: ดึงสื่อที่เปิดใช้งาน
export async function GET() {
  try {
    const items = await prisma.memberMedia.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch member media:", error);
    return NextResponse.json([], { status: 500 });
  }
}
