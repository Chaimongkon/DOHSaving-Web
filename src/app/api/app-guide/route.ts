import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/app-guide — fetch active sections for public page
export async function GET() {
  try {
    const items = await prisma.appGuideSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch app guide:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
