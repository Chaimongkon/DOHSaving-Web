import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/notifications — ดึง notification ที่ active + อยู่ในช่วงเวลา
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = await prisma.notification.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: today }, endDate: null },
          { startDate: null, endDate: { gte: today } },
          { startDate: { lte: today }, endDate: { gte: today } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        imagePath: true,
        urlLink: true,
      },
    });

    return Response.json(notifications, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return Response.json([], { status: 500 });
  }
}

// POST /api/notifications/click — นับจำนวนคลิก
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { clickCount: { increment: 1 } },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to track click:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
