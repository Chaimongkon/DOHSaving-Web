import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/meeting-documents — public: fetch active documents
export async function GET() {
  try {
    const items = await prisma.meetingDocument.findMany({
      where: { isActive: true },
      orderBy: [{ year: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch meeting documents:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
