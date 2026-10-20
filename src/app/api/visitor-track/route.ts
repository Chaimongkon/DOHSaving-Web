import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";
import { purgeExpiredData } from "@/lib/retention";

const VISIT_LIMIT = 60;
const VISIT_WINDOW_SECONDS = 60;

/**
 * ผู้เข้าชมยินยอมคุกกี้วิเคราะห์หรือไม่
 * - consent_analytics = "1"/"0" ตั้งโดย /api/cookie-consent (ตั้งแต่มีหมวดแยก)
 * - ผู้ที่ตัดสินใจก่อนหน้านั้นมีแค่ cookie_consent: "accepted" เกือบทั้งหมดคือยอมรับทั้งหมด
 * - ยังไม่ตัดสินใจ = ยังไม่ยินยอม
 */
function hasAnalyticsConsent(req: NextRequest): boolean {
  const analytics = req.cookies.get("consent_analytics")?.value;
  if (analytics) return analytics === "1";
  return req.cookies.get("cookie_consent")?.value === "accepted";
}

// POST /api/visitor-track — record a page visit
// ยินยอม → เก็บ IP และ user agent · ไม่ยินยอม/ยังไม่ตัดสินใจ → นับจำนวนอย่างเดียว เก็บแค่ประเภทอุปกรณ์
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // IP ใช้กันการยิงซ้ำเท่านั้น (ประโยชน์โดยชอบด้านความปลอดภัย) ไม่ได้บันทึกลงสถิติถ้าไม่ยินยอม
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
    const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : "/";
    const userAgent = req.headers.get("user-agent") || "";
    const consented = hasAnalyticsConsent(req);
    const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

    await prisma.visitLog.create({
      data: consented
        ? { ipAddress: ip, userAgent: userAgent.slice(0, 500), pageUrl: pageUrl.slice(0, 500) }
        : { ipAddress: null, userAgent: mobile ? "anonymous: Mobile" : "anonymous: Desktop", pageUrl: pageUrl.slice(0, 500) },
    });

    void purgeExpiredData();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to track visit:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
