import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/regulations?type=statute — fetch active regulations by type
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.typeForm = type;

    const items = await prisma.regulation.findMany({
      where,
      orderBy: [{ typeMember: "asc" }, { sortOrder: "asc" }],
    });
    return Response.json(items);
  } catch (error) {
    console.error("Failed to fetch regulations:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
