import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_vision_data";

// GET /api/vision-data — public
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const data = setting?.value
      ? JSON.parse(setting.value)
      : { coreValues: "", vision: "", missions: [] };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch vision data:", error);
    return NextResponse.json(
      { coreValues: "", vision: "", missions: [] },
      { status: 500 }
    );
  }
}
