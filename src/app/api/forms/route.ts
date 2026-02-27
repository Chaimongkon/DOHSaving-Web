import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/forms — public: fetch active forms, optionally filter by category/group
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const group = searchParams.get("group");

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (group) where.group = group;

    const items = await prisma.form.findMany({
      where,
      orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        category: true,
        group: true,
        title: true,
        fileUrl: true,
        sortOrder: true,
      },
    });

    return Response.json(items);
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
