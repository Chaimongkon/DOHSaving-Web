import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/cookie-consent — สถิติ cookie consent
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [total, accepted, rejected, recent] = await Promise.all([
      prisma.cookieConsent.count(),
      prisma.cookieConsent.count({ where: { consentStatus: true } }),
      prisma.cookieConsent.count({ where: { consentStatus: false } }),
      prisma.cookieConsent.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          userId: true,
          consentStatus: true,
          cookieCategories: true,
          ipAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        accepted,
        rejected,
        acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      },
      recent,
    });
  } catch (error) {
    console.error("Failed to fetch cookie consent stats:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
