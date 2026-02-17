import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/slides — ดึง slide ที่ active สำหรับหน้าเว็บ (public)
export async function GET() {
  try {
    const slides = await prisma.slide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        sortOrder: true,
        imagePath: true,
        urlLink: true,
        title: true,
        subtitle: true,
        description: true,
        bgGradient: true,
        ctaText: true,
        isActive: true,
      },
    });
    return NextResponse.json(slides, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch slides:", error);
    return NextResponse.json([], { status: 500 });
  }
}
