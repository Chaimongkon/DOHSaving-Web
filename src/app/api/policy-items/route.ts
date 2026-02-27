import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_policy_items";

// GET /api/policy-items — ดึง policy items (public)
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const items = setting?.value ? JSON.parse(setting.value) : [];

    return Response.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch policy items:", error);
    return Response.json({ items: [] }, { status: 500 });
  }
}
