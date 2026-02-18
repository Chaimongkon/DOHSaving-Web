import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/visitor-track — record a page visit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pageUrl = body.pageUrl || "/";

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    await prisma.visitLog.create({
      data: {
        ipAddress: ip.slice(0, 45),
        userAgent: userAgent.slice(0, 500),
        pageUrl: pageUrl.slice(0, 500),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track visit:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
