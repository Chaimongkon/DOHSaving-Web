import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/videos — public: active videos
export async function GET() {
  try {
    const items = await prisma.coopVideo.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        youtubeUrl: true,
        youtubeId: true,
        thumbnailUrl: true,
        description: true,
        createdAt: true,
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
