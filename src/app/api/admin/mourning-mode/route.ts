import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import {
  MOURNING_DEFAULTS,
  MOURNING_KEY,
  MOURNING_TEXT_MAX,
  type MourningSettings,
  clampIntensity,
  isMourningLive,
  parseMourning,
} from "@/lib/mourningMode";

const REMARK = "โหมดไว้อาลัย (ลดสีหน้าเว็บ + banner)";

const respond = (s: MourningSettings, updatedAt: Date | null) =>
  NextResponse.json({ ...s, live: isMourningLive(s), updatedAt: updatedAt?.toISOString() ?? null });

export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: MOURNING_KEY } });
    return respond(parseMourning(setting?.value), setting?.updatedAt ?? null);
  } catch (error) {
    console.error("Failed to read mourning mode:", error);
    return NextResponse.json({ ...MOURNING_DEFAULTS, live: false, updatedAt: null }, { status: 500 });
  }
}

// POST { active, intensity, bannerText, endsAt } — บันทึกทั้งชุด
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json().catch(() => ({}));
    const existing = await prisma.siteSetting.findUnique({ where: { key: MOURNING_KEY } });
    const previous = parseMourning(existing?.value);

    let endsAt: string | null = null;
    if (typeof body.endsAt === "string" && body.endsAt) {
      const d = new Date(body.endsAt);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "วันปิดอัตโนมัติไม่ถูกต้อง" }, { status: 400 });
      if (Boolean(body.active) && d.getTime() <= Date.now()) {
        return NextResponse.json({ error: "วันปิดอัตโนมัติต้องอยู่ในอนาคต" }, { status: 400 });
      }
      endsAt = d.toISOString();
    }

    const active = Boolean(body.active);
    const next: MourningSettings = {
      active,
      intensity: clampIntensity(body.intensity),
      bannerText: typeof body.bannerText === "string" ? body.bannerText.trim().slice(0, MOURNING_TEXT_MAX) : "",
      endsAt,
      // เริ่มนับ "เปิดตั้งแต่" ใหม่เมื่อเปลี่ยนจากไม่แสดง → แสดง
      since: active ? (isMourningLive(previous) ? previous.since ?? new Date().toISOString() : new Date().toISOString()) : null,
      updatedBy: user.fullName || user.userName,
    };

    const saved = await prisma.siteSetting.upsert({
      where: { key: MOURNING_KEY },
      update: { value: JSON.stringify(next), remark: REMARK },
      create: { key: MOURNING_KEY, value: JSON.stringify(next), remark: REMARK },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "site_settings",
      recordId: saved.id,
      ipAddress: getAuditIpAddress(req),
      oldValues: { key: MOURNING_KEY, ...previous },
      newValues: { key: MOURNING_KEY, ...next },
    });

    return respond(next, saved.updatedAt);
  } catch (error) {
    console.error("Failed to save mourning mode:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
