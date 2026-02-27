import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_board_members";

// GET /api/board-members — public
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const members = setting?.value ? JSON.parse(setting.value) : [];

    return Response.json(
      { members },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch board members:", error);
    return Response.json({ members: [] }, { status: 500 });
  }
}
