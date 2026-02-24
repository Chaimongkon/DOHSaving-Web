import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/annual-reports — public: fetch active reports
export async function GET() {
  try {
    const items = await prisma.annualReport.findMany({
      where: { isActive: true },
      orderBy: { year: "desc" },
      select: {
        id: true,
        year: true,
        title: true,
        coverUrl: true,
        fileUrl: true,
        description: true,
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch annual reports:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
