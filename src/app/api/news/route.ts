import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/news — ดึงข่าวที่ active สำหรับหน้าเว็บ (public)
// Query params:
//   page=1        — หน้า (default 1)
//   limit=12      — จำนวนต่อหน้า (default 12, max 50)
//   category      — filter หมวดหมู่
//   search        — ค้นหาจาก title / details
//   related=ID    — ดึงข่าวหมวดเดียวกันกับ ID (ไม่รวมตัวเอง, 3 รายการ)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Related news mode
    const relatedId = searchParams.get("related");
    if (relatedId) {
      const source = await prisma.news.findUnique({
        where: { id: parseInt(relatedId) },
        select: { category: true },
      });
      const related = await prisma.news.findMany({
        where: {
          isActive: true,
          id: { not: parseInt(relatedId) },
          ...(source ? { category: source.category } : {}),
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: {
          id: true, title: true, imagePath: true, pdfPath: true,
          category: true, viewCount: true, createdAt: true,
        },
      });
      return Response.json(related, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    // Normal list mode
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "12")), 50);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          details: true,
          imagePath: true,
          pdfPath: true,
          category: true,
          viewCount: true,
          isPinned: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.news.count({ where }),
    ]);

    return Response.json(
      { data: news, total, page, totalPages: Math.ceil(total / limit) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return Response.json({ data: [], total: 0, page: 1, totalPages: 0 }, { status: 500 });
  }
}
