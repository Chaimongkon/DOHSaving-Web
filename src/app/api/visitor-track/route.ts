import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";

const VISIT_LIMIT = 60;
const VISIT_WINDOW_SECONDS = 60;

// POST /api/visitor-track — record a page visit
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const visitLimit = await consumeRateLimit({
      scope: "visitor-track",
      identifier: ip,
      limit: VISIT_LIMIT,
      windowSeconds: VISIT_WINDOW_SECONDS,
    });

    if (visitLimit.limited) {
      return Response.json({ ok: true });
    }

    const body = await req.json().catch(() => ({}));
    const pageUrl = body.pageUrl || "/";
    const userAgent = req.headers.get("user-agent") || "";

    await prisma.visitLog.create({
        data: {
          ipAddress: ip,
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
