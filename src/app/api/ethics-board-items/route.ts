import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_ethics_board_items";

// GET /api/ethics-board-items — public
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const items = setting?.value ? JSON.parse(setting.value) : [];

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch ethics-board items:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
