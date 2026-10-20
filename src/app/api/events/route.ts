import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { consumeRateLimit } from "@/lib/rateLimit";
import { recordSiteEvent } from "@/lib/siteEvents";
import {
  FORM_GROUP_LABELS,
  SEARCH_MIN_LENGTH,
  SEARCH_PAGES,
  SITE_EVENT_TYPES,
  type SiteEventType,
  normalizeSearchTerm,
} from "@/lib/siteEventTypes";

const EVENT_LIMIT = 40;
const EVENT_WINDOW_SECONDS = 60;

/** ตรวจและจัดรูปค่าที่ส่งมา — ค่าที่ไม่รู้จักทิ้งไป ไม่ให้ใครยัดข้อมูลแปลก ๆ ลงตาราง */
function parse(body: Record<string, unknown>): { type: SiteEventType; target: string; meta: string | null } | null {
  const type = body.type as SiteEventType;
  if (!SITE_EVENT_TYPES.includes(type)) return null;
  const target = typeof body.target === "string" ? body.target : String(body.target ?? "");
  const meta = typeof body.meta === "string" ? body.meta : null;

  switch (type) {
    case "form_download":
      if (!/^\d{1,9}$/.test(target)) return null;
      return { type, target, meta: meta === "view" ? "view" : "download" };
    case "form_group":
      return target in FORM_GROUP_LABELS ? { type, target, meta: null } : null;
    case "search_miss": {
      if (!meta || !(meta in SEARCH_PAGES)) return null;
      const term = normalizeSearchTerm(target);
      return term.length >= SEARCH_MIN_LENGTH ? { type, target: term, meta } : null;
    }
  }
}

// POST /api/events — นับการใช้งาน (ไม่มีข้อมูลส่วนบุคคล) · ตอบ 204 เสมอ ไม่ให้หน้าเว็บสะดุด
export async function POST(req: NextRequest) {
  try {
    const limit = await consumeRateLimit({
      scope: "site-events",
      identifier: getClientIp(req),
      limit: EVENT_LIMIT,
      windowSeconds: EVENT_WINDOW_SECONDS,
    });
    if (limit.limited) return new Response(null, { status: 204 });

    const body = await req.json().catch(() => null);
    const event = body && typeof body === "object" ? parse(body as Record<string, unknown>) : null;
    if (event) await recordSiteEvent(event.type, event.target, event.meta);
  } catch (error) {
    console.error("Failed to record site event:", error);
  }
  return new Response(null, { status: 204 });
}
