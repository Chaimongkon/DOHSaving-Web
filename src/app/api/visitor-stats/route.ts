import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/visitor-stats — public: today + total counts
export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, today] = await Promise.all([
      prisma.visitLog.count(),
      prisma.visitLog.count({
        where: { visitDate: { gte: startOfToday } },
      }),
    ]);

    return NextResponse.json(
      { total, today },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Failed to get visitor stats:", error);
    return NextResponse.json({ total: 0, today: 0 }, { status: 500 });
  }
}
