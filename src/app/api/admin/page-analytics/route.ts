import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getPageNameMapping(): Promise<Record<string, string>> {
  try {
    const rawMappings = await prisma.siteSetting.findMany({
      where: { key: { startsWith: "url_translation:" } },
    });
    const map: Record<string, string> = {};
    rawMappings.forEach(m => {
      const url = m.key.replace("url_translation:", "");
      if (m.value) {
        map[url] = m.value;
      }
    });
    return map;
  } catch (error) {
    console.error("Failed to load URL mappings", error);
    return {};
  }
}

function getPageName(url: string, pageNames: Record<string, string>): string {
  // ลองหา exact match ก่อน
  if (pageNames[url]) return pageNames[url];

  // ลอง match prefix 
  for (const [key, name] of Object.entries(pageNames)) {
    if (key !== "/" && url.startsWith(key)) {
      const suffix = url.slice(key.length);
      return suffix ? `${name} - ${suffix}` : name;
    }
  }

  return url;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, 7d, 30d, 90d

    // กำหนดช่วงวันที่
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // month — เดือนปัจจุบัน
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // ดึงข้อมูลจาก VisitLog — นับจำนวนครั้งต่อ pageUrl
    const pageViews = await prisma.visitLog.groupBy({
      by: ["pageUrl"],
      _count: { id: true },
      where: {
        visitDate: { gte: startDate },
        pageUrl: { not: null },
      },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });

    // นับ unique IP ต่อ pageUrl
    const uniqueVisitors = await prisma.visitLog.groupBy({
      by: ["pageUrl"],
      _count: { id: true },
      where: {
        visitDate: { gte: startDate },
        pageUrl: { not: null },
      },
    });

    // นับ unique IP ทั้งหมด
    const uniqueIpRaw = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
      `SELECT COUNT(DISTINCT ipAddress) AS cnt FROM visit_logs WHERE visitDate >= ?`,
      startDate
    );
    const totalUniqueUsers = Number(uniqueIpRaw[0]?.cnt ?? 0);

    // รวมยอดทั้งหมด
    const totalViews = pageViews.reduce((s, r) => s + r._count.id, 0);

    // ดึง URL Mappings
    const urlMappings = await getPageNameMapping();

    // แปลงผลลัพธ์
    const pages = pageViews
      .filter((r) => r.pageUrl) // filter null
      .map((r, idx) => ({
        rank: idx + 1,
        pageUrl: r.pageUrl!,
        pageName: getPageName(r.pageUrl!, urlMappings),
        views: r._count.id,
      }));

    return NextResponse.json({
      success: true,
      data: {
        pages,
        statistics: {
          totalViews,
          totalUniqueUsers,
          totalPages: pages.length,
        },
        period,
        startDate: startDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch page analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
