import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { isKnownSection, resolvePageNamesDetailed } from "@/lib/pageNames";

const PREFIX = "url_translation:";
const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
/** site_settings.key ยาวได้ 100 ตัวอักษร รวมคำนำหน้า */
const MAX_URL = 100 - PREFIX.length;
const MAX_NAME = 120;

/**
 * แปลงสิ่งที่แอดมินวางมาให้เป็น path แบบเดียวกับที่บันทึกการเข้าชม:
 * ลิงก์เต็ม (https://โดเมน/path?x=1#y) → /path · เติม / ข้างหน้า · ตัด / ท้าย · ตัด // ซ้ำ
 */
function normalizeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname;
    } catch {
      return null;
    }
  }
  s = s.split("#")[0].split("?")[0];
  if (/\s/.test(s) || s.includes("://")) return null;
  s = ("/" + s).replace(/\/{2,}/g, "/");
  if (s.length > 1) s = s.replace(/\/+$/, "");
  // บันทึกการเข้าชมเก็บ URL ภาษาไทยแบบเข้ารหัส (%E0%B8…) — พิมพ์ไทยตรง ๆ หรือวางแบบเข้ารหัสมา ให้ได้แบบเดียวกัน
  try {
    s = encodeURI(decodeURI(s));
  } catch {
    return null;
  }
  return s;
}

/** URL จากบันทึกการเข้าชม — ที่จัดรูปแบบไม่ได้ (ลิงก์เสียแปลก ๆ) เก็บไว้ตามเดิม ไม่รวมไปนับเป็นหน้าอื่น */
const normVisit = (u: string | null) => normalizeUrl(u || "/") ?? ((u || "/").split("?")[0] || "/");

// GET /api/admin/url-mappings            ชื่อที่ตั้งไว้ + URL ที่มีคนเข้าใน 90 วัน พร้อมชื่อที่ระบบจะใช้
// GET /api/admin/url-mappings?preview=…  ชื่อที่ระบบจะใช้ของ URL เดียว (ตอนพิมพ์ในฟอร์มเพิ่ม)
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const previewParam = new URL(req.url).searchParams.get("preview");
    if (previewParam !== null) {
      const url = normalizeUrl(previewParam);
      if (!url) return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
      const since = new Date(Date.now() - WINDOW_DAYS * DAY);
      const [auto, existing, visits] = await Promise.all([
        resolvePageNamesDetailed([url], { manual: false }),
        prisma.siteSetting.findUnique({ where: { key: PREFIX + url }, select: { id: true, value: true } }),
        prisma.$queryRaw<{ c: bigint }[]>`
          SELECT COUNT(*) c FROM visit_logs
          WHERE visitDate >= ${since} AND (pageUrl = ${url} OR pageUrl LIKE ${url + "?%"})`,
      ]);
      return NextResponse.json({
        url,
        auto: auto[url],
        existing: existing ? { id: existing.id, name: existing.value ?? "" } : null,
        views: Number(visits[0]?.c ?? 0),
        broken: !isKnownSection(url),
      });
    }

    const since = new Date(Date.now() - WINDOW_DAYS * DAY);
    const [settings, visitRows] = await Promise.all([
      prisma.siteSetting.findMany({ where: { key: { startsWith: PREFIX } }, orderBy: { key: "asc" } }),
      prisma.$queryRaw<{ pageUrl: string | null; c: bigint }[]>`
        SELECT pageUrl, COUNT(*) c FROM visit_logs
        WHERE visitDate >= ${since}
        GROUP BY pageUrl ORDER BY c DESC LIMIT 600`,
    ]);

    const views = new Map<string, number>();
    for (const r of visitRows) views.set(normVisit(r.pageUrl), (views.get(normVisit(r.pageUrl)) ?? 0) + Number(r.c));
    const totalViews = [...views.values()].reduce((a, b) => a + b, 0);

    const manual = new Map(settings.map((s) => [s.key.slice(PREFIX.length), s]));
    const urls = [...new Set([...views.keys(), ...manual.keys()])];
    const auto = await resolvePageNamesDetailed(urls, { manual: false });

    const rows = urls
      .map((url) => {
        const m = manual.get(url);
        return {
          url,
          id: m?.id ?? null,
          name: m?.value ?? null,
          updatedAt: m?.updatedAt ?? null,
          auto: auto[url] ?? { name: url, source: "raw" as const },
          views: views.get(url) ?? 0,
          broken: !isKnownSection(url),
        };
      })
      .sort((a, b) => b.views - a.views || a.url.localeCompare(b.url));

    // สัดส่วนการเข้าชมที่แสดงเป็นชื่ออ่านเข้าใจ (ตั้งเอง หรือระบบรู้จัก) — ไม่นับลิงก์เสีย
    const live = rows.filter((r) => !r.broken);
    const liveViews = live.reduce((n, r) => n + r.views, 0);
    const goodViews = live.filter((r) => r.name || r.auto.source === "auto").reduce((n, r) => n + r.views, 0);

    return NextResponse.json({
      windowDays: WINDOW_DAYS,
      rows,
      totals: {
        manual: settings.length,
        needsName: live.filter((r) => !r.name && r.auto.source !== "auto" && r.views > 0).length,
        broken: rows.filter((r) => r.broken && r.views > 0).length,
        coverage: liveViews ? goodViews / liveViews : 1,
        views: totalViews,
      },
    });
  } catch (error) {
    console.error("GET URL Mappings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/url-mappings { url, thaiName } — เพิ่ม/แก้ชื่อ (URL เดิมมีอยู่แล้ว = แก้ชื่อ)
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json().catch(() => ({}));
    const url = normalizeUrl(body.url);
    const thaiName = typeof body.thaiName === "string" ? body.thaiName.trim().replace(/\s+/g, " ") : "";
    if (!url) return NextResponse.json({ error: "URL ไม่ถูกต้อง ใส่เป็น path เช่น /services หรือวางลิงก์เต็มของหน้าเว็บ" }, { status: 400 });
    if (url.length > MAX_URL) return NextResponse.json({ error: `URL ยาวเกิน ${MAX_URL} ตัวอักษร` }, { status: 400 });
    if (!thaiName) return NextResponse.json({ error: "กรุณาระบุชื่อที่ต้องการแสดง" }, { status: 400 });
    if (thaiName.length > MAX_NAME) return NextResponse.json({ error: `ชื่อยาวเกิน ${MAX_NAME} ตัวอักษร` }, { status: 400 });

    const key = PREFIX + url;
    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    const saved = await prisma.siteSetting.upsert({
      where: { key },
      update: { value: thaiName },
      create: { key, value: thaiName, remark: `ชื่อหน้าของ URL: ${url}`.slice(0, 255) },
    });

    await writeAuditLog({
      userId: user.userId,
      action: existing ? "update" : "create",
      tableName: "site_settings",
      recordId: saved.id,
      ipAddress: getAuditIpAddress(req),
      oldValues: existing ? { url, name: existing.value } : undefined,
      newValues: { url, name: thaiName },
    });

    return NextResponse.json({ id: saved.id, url, name: saved.value, updatedAt: saved.updatedAt, created: !existing });
  } catch (error) {
    console.error("POST URL Mappings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/admin/url-mappings?id=… — ลบชื่อที่ตั้งเอง (กลับไปใช้ชื่อที่ระบบตั้งให้)
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id") || "", 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // ลบได้เฉพาะรายการชื่อ URL — ไม่ให้ลบการตั้งค่าอื่นของเว็บผ่าน id
    const existing = await prisma.siteSetting.findUnique({ where: { id } });
    if (!existing || !existing.key.startsWith(PREFIX)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.siteSetting.delete({ where: { id } });
    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "site_settings",
      recordId: id,
      ipAddress: getAuditIpAddress(req),
      oldValues: { url: existing.key.slice(PREFIX.length), name: existing.value },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE URL Mappings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
