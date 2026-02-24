import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/service-pages/[slug] — fetch active service page by slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.servicePage.findFirst({
      where: { slug, isActive: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Failed to fetch service page:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
