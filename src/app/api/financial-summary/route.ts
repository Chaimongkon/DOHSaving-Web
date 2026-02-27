import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/financial-summary?year=2568 — public: fetch financial summaries by year
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    // Get distinct years for filter (always)
    const distinctYears = await prisma.financialSummary.findMany({
      where: { isActive: true },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });
    const availableYears = distinctYears.map((y: { year: number }) => y.year);

    // Determine which year to query
    let targetYear: number | null = null;
    if (yearParam) {
      targetYear = parseInt(yearParam);
    } else if (availableYears.length) {
      targetYear = availableYears[0]; // latest year with data
    }

    const items = targetYear
      ? await prisma.financialSummary.findMany({
          where: { isActive: true, year: targetYear },
          orderBy: [{ year: "desc" }, { month: "asc" }],
        })
      : [];

    return Response.json({
      items,
      years: availableYears,
      selectedYear: targetYear,
    });
  } catch (error) {
    console.error("Financial summary fetch error:", error);
    return Response.json({ items: [], years: [], selectedYear: null }, { status: 500 });
  }
}
