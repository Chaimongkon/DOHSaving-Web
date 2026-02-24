import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/activity-albums — public: list active albums
// GET /api/activity-albums?id=1 — public: single album with photos
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  try {
    if (id) {
      const album = await prisma.activityAlbum.findFirst({
        where: { id, isActive: true },
        include: {
          photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        },
      });
      if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(album);
    }

    const albums = await prisma.activityAlbum.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { eventDate: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { photos: true } } },
    });
    return NextResponse.json(albums);
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
