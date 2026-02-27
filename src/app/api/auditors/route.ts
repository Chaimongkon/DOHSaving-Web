import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_auditors";

// GET /api/auditors — public
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const auditors = setting?.value ? JSON.parse(setting.value) : [];

    return Response.json(
      { auditors },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch auditors:", error);
    return Response.json({ auditors: [] }, { status: 500 });
  }
}
