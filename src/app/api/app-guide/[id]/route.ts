import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/app-guide/[id] — fetch single active section by id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.appGuideSection.findFirst({
      where: { id: Number(id), isActive: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch app guide section:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
