import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Rate limit: max 60 visits per minute per IP (prevents flooding)
const visitLimitMap = new Map<string, number[]>();
const VISIT_LIMIT = 60;
const VISIT_WINDOW_MS = 60_000;

function isVisitLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (visitLimitMap.get(ip) || []).filter((t) => now - t < VISIT_WINDOW_MS);
  visitLimitMap.set(ip, ts);
  if (ts.length >= VISIT_LIMIT) return true;
  ts.push(now);
  visitLimitMap.set(ip, ts);
  return false;
}

// POST /api/visitor-track — record a page visit
export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Rate limit check
    if (isVisitLimited(ip)) {
      return Response.json({ ok: true }); // silent reject
    }

    const body = await req.json().catch(() => ({}));
    const pageUrl = body.pageUrl || "/";
    const userAgent = req.headers.get("user-agent") || "";

    await prisma.visitLog.create({
      data: {
        ipAddress: ip.slice(0, 45),
        userAgent: userAgent.slice(0, 500),
        pageUrl: pageUrl.slice(0, 500),
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to track visit:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
