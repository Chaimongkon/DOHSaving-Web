import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

/* ── เวลาไทย: แบ่งเดือนตามปฏิทินไทย ── */
const TH_OFFSET = 7 * 60 * 60 * 1000;
const monthKey = (d: Date) => new Date(d.getTime() + TH_OFFSET).toISOString().slice(0, 7);

type Categories = { analytics?: boolean; marketing?: boolean; preferences?: boolean } | null;

/** รูปแบบการตัดสินใจ: ยอมรับทั้งหมด · ปฏิเสธ (จำเป็นเท่านั้น) · เลือกเอง
 *  (หมวด "การตลาด" เลิกใช้แล้ว — บันทึกเก่าที่มีค่านี้ไม่นำมาคิด) */
function choiceOf(c: Categories): "all" | "none" | "custom" {
  const on = [c?.analytics, c?.preferences].filter(Boolean).length;
  return on === 2 ? "all" : on === 0 ? "none" : "custom";
}

const isMobile = (ua: string | null) => /Mobile|Android|iPhone|iPad/i.test(ua ?? "");

/** แสดง IP แบบปิดบางส่วน — พอใช้ตรวจสอบได้ แต่ไม่เปิดเผยตัวบุคคลบนหน้าจอ */
function maskIp(ip: string) {
  if (!ip || ip === "unknown") return "ไม่ทราบ";
  if (ip.includes(".")) return ip.split(".").slice(0, 2).join(".") + ".x.x";
  return ip.split(":").slice(0, 3).join(":") + ":…";
}

// GET /api/admin/cookie-consent — สถิติและรายการบันทึกความยินยอม
//   ?search= (รหัสผู้เข้าชม)  ?status=accepted|rejected  ?page=
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = 25;

    /* ── สถิติ: ดึงเฉพาะคอลัมน์ที่ต้องใช้ แล้วรวมใน JS (หลักหมื่นแถว) ── */
    const rows = await prisma.cookieConsent.findMany({
      select: { consentStatus: true, cookieCategories: true, userAgent: true, ipAddress: true, createdAt: true, updatedAt: true },
    });

    const monthly = new Map<string, { accepted: number; rejected: number }>();
    const choices = { all: 0, none: 0, custom: 0 };
    const device = { mobile: { total: 0, accepted: 0 }, desktop: { total: 0, accepted: 0 } };
    let ipUnknown = 0;
    let changed = 0;
    let oldest: Date | null = null;

    for (const r of rows) {
      const m = monthKey(r.createdAt);
      const bucket = monthly.get(m) ?? { accepted: 0, rejected: 0 };
      bucket[r.consentStatus ? "accepted" : "rejected"] += 1;
      monthly.set(m, bucket);

      choices[choiceOf(r.cookieCategories as Categories)] += 1;

      const d = isMobile(r.userAgent) ? device.mobile : device.desktop;
      d.total += 1;
      if (r.consentStatus) d.accepted += 1;

      if (!r.ipAddress || r.ipAddress === "unknown") ipUnknown += 1;
      if (r.updatedAt.getTime() - r.createdAt.getTime() > 60_000) changed += 1;
      if (!oldest || r.createdAt < oldest) oldest = r.createdAt;
    }

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [visits30, anonVisits30] = await Promise.all([
      prisma.visitLog.count({ where: { visitDate: { gte: since30 } } }),
      prisma.visitLog.count({ where: { visitDate: { gte: since30 }, userAgent: { startsWith: "anonymous:" } } }),
    ]);

    const total = rows.length;
    const accepted = rows.filter((r) => r.consentStatus).length;

    /* ── รายการ ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.userId = { contains: search };
    if (status === "accepted") where.consentStatus = true;
    else if (status === "rejected") where.consentStatus = false;

    const [records, recordTotal] = await Promise.all([
      prisma.cookieConsent.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, userId: true, consentStatus: true, cookieCategories: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true },
      }),
      prisma.cookieConsent.count({ where }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        accepted,
        rejected: total - accepted,
        acceptRate: total > 0 ? accepted / total : 0,
        choices,
        device,
        monthly: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
        ipUnknownRate: total > 0 ? ipUnknown / total : 0,
        changed,
        since: oldest?.toISOString() ?? null,
        visits30,
        anonVisits30,
      },
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        consentStatus: r.consentStatus,
        choice: choiceOf(r.cookieCategories as Categories),
        cookieCategories: r.cookieCategories,
        ip: maskIp(r.ipAddress),
        device: isMobile(r.userAgent) ? "mobile" : "desktop",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      recordTotal,
      page,
      totalPages: Math.max(1, Math.ceil(recordTotal / limit)),
    });
  } catch (error) {
    console.error("Failed to fetch cookie consent stats:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/cookie-consent?id=1 — ลบบันทึกความยินยอม (กรณีเจ้าของข้อมูลขอลบตามสิทธิ์ PDPA)
// ผู้เข้าชมจะถูกถามความยินยอมใหม่เมื่อคุกกี้ในเครื่องหมดอายุหรือถูกล้าง
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id") || "", 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.cookieConsent.findUnique({ where: { id }, select: { id: true, userId: true, consentStatus: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.cookieConsent.delete({ where: { id } });
    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "cookie_consents",
      recordId: id,
      ipAddress: getAuditIpAddress(req),
      oldValues: existing,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete cookie consent:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
