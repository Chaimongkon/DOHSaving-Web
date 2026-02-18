import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/notifications — ดึง notification ที่ active สำหรับ popup dialog
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imagePath: true,
        urlLink: true,
      },
    });

    return NextResponse.json(notifications, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json([], { status: 500 });
  }
}
