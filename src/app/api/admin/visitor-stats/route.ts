import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

// GET /api/admin/visitor-stats — detailed stats for admin dashboard
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 7 days ago
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [total, today, thisMonth, thisYear, last7DaysRaw] = await Promise.all([
      prisma.visitLog.count(),
      prisma.visitLog.count({
        where: { visitDate: { gte: startOfToday } },
      }),
      prisma.visitLog.count({
        where: { visitDate: { gte: startOfMonth } },
      }),
      prisma.visitLog.count({
        where: { visitDate: { gte: startOfYear } },
      }),
      // Daily counts for last 7 days
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT DATE_FORMAT(visitDate, '%Y-%m-%d') as day, COUNT(*) as count
        FROM visit_logs
        WHERE visitDate >= ${sevenDaysAgo}
        GROUP BY DATE_FORMAT(visitDate, '%Y-%m-%d')
        ORDER BY day ASC
      `,
    ]);

    // Fill in missing days for chart
    const dailyChart: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = last7DaysRaw.find(
        (r) => String(r.day).slice(0, 10) === dateStr
      );
      dailyChart.push({
        date: dateStr,
        count: found ? Number(found.count) : 0,
      });
    }

    // Top pages
    const topPages = await prisma.$queryRaw<{ pageUrl: string; count: bigint }[]>`
      SELECT pageUrl, COUNT(*) as count
      FROM visit_logs
      WHERE visitDate >= ${startOfMonth}
      GROUP BY pageUrl
      ORDER BY count DESC
      LIMIT 10
    `;

    // Fetch dynamic URL translations
    const urlTranslationsRaw = await prisma.siteSetting.findMany({
      where: {
        key: {
          startsWith: "url_translation:",
        },
      },
    });

    const translations: Record<string, string> = {};
    urlTranslationsRaw.forEach((setting) => {
      const url = setting.key.replace("url_translation:", "");
      translations[url] = setting.value || url;
    });

    return NextResponse.json({
      total,
      today,
      thisMonth,
      thisYear,
      dailyChart,
      topPages: topPages.map((p) => ({
        pageUrl: p.pageUrl,
        count: Number(p.count),
      })),
      translations,
    });
  } catch (error) {
    console.error("Failed to get admin visitor stats:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
