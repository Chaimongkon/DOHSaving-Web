import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { RETENTION_LAST_RUN_KEY, RETENTION_YEARS } from "@/lib/retention";
import {
  DIGEST_HOUR,
  DIGEST_KEY,
  TELEGRAM_SETTINGS_KEY,
  getTelegramToggles,
  isTelegramConfigured,
  lastDelivery,
  parseTelegramToggles,
  resetTelegramToggles,
  sendTelegramTest,
  telegramChatCount,
} from "@/lib/telegram";

const UPLOADS = path.join(process.cwd(), "public", "uploads");
const DAY = 24 * 60 * 60 * 1000;

/** ขนาดรวมของโฟลเดอร์ (ไล่ทุกไฟล์) */
async function folderSize(dir: string): Promise<{ bytes: number; files: number }> {
  let bytes = 0;
  let files = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await folderSize(p);
      bytes += sub.bytes;
      files += sub.files;
    } else if (e.isFile()) {
      const st = await fs.stat(p).catch(() => null);
      if (st) {
        bytes += st.size;
        files += 1;
      }
    }
  }
  return { bytes, files };
}

// GET /api/admin/settings — การแจ้งเตือน Telegram + สถานะระบบ (ผู้ดูแลระบบเท่านั้น)
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  try {
    const t0 = Date.now();
    const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const dbMs = Date.now() - t0;

    const since7 = new Date(Date.now() - 7 * DAY);
    const [digest, retention, ipRows, folders, disk] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: DIGEST_KEY }, select: { value: true } }),
      prisma.siteSetting.findUnique({ where: { key: RETENTION_LAST_RUN_KEY }, select: { value: true } }),
      // การเข้าชมที่ยินยอมคุกกี้ (มีช่อง IP) แต่ได้ IP เป็น unknown = ระบบอ่าน IP จริงไม่ได้
      prisma.$queryRaw<{ total: bigint; unknown: bigint | null }[]>`
        SELECT COUNT(*) total, SUM(ipAddress = 'unknown') unknown FROM visit_logs
        WHERE visitDate >= ${since7} AND ipAddress IS NOT NULL`,
      fs.readdir(UPLOADS, { withFileTypes: true }).catch(() => []),
      fs.statfs(UPLOADS).catch(() => null),
    ]);

    const byFolder = await Promise.all(
      folders.filter((f) => f.isDirectory()).map(async (f) => ({ name: f.name, ...(await folderSize(path.join(UPLOADS, f.name))) }))
    );
    byFolder.sort((a, b) => b.bytes - a.bytes);

    let retentionRun: { at: string; visits: number; consents: number; events: number } | null = null;
    try {
      retentionRun = retention?.value ? JSON.parse(retention.value) : null;
    } catch { /* ค่าเสีย = ยังไม่มีข้อมูล */ }

    const ipTotal = Number(ipRows[0]?.total ?? 0);
    const ipUnknown = Number(ipRows[0]?.unknown ?? 0);

    return NextResponse.json({
      telegram: {
        configured: isTelegramConfigured(),
        chats: telegramChatCount(),
        siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
        toggles: await getTelegramToggles(),
        digestHour: DIGEST_HOUR,
        lastDigest: digest?.value ?? null,
        lastDelivery,
      },
      system: {
        db: { ok: dbOk, ms: dbMs },
        node: process.version,
        env: process.env.NODE_ENV ?? "development",
        uptimeSec: Math.round(process.uptime()),
        trustProxy: process.env.TRUST_PROXY_HEADERS === "true",
        ipUnknownRate: ipTotal ? ipUnknown / ipTotal : null,
        ipSample: ipTotal,
      },
      storage: {
        folders: byFolder,
        total: byFolder.reduce((n, f) => n + f.bytes, 0),
        files: byFolder.reduce((n, f) => n + f.files, 0),
        disk: disk ? { free: Number(disk.bavail) * Number(disk.bsize), size: Number(disk.blocks) * Number(disk.bsize) } : null,
      },
      // ทำงานวันละครั้งเมื่อมีคนเข้าเว็บ — ไม่ได้รันเกิน 3 วัน = ผิดปกติ
      retention: {
        years: RETENTION_YEARS,
        lastRun: retentionRun,
        stale: !retentionRun || Date.now() - new Date(retentionRun.at).getTime() > 3 * DAY,
      },
    });
  } catch (error) {
    console.error("Settings status error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/admin/settings { telegram: { complaint, question, reply, digest } } — เปิด/ปิดการแจ้งเตือนแต่ละแบบ
export async function PUT(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json().catch(() => ({}));
    const next = parseTelegramToggles(JSON.stringify(body.telegram ?? {}));
    const existing = await prisma.siteSetting.findUnique({ where: { key: TELEGRAM_SETTINGS_KEY } });
    const saved = await prisma.siteSetting.upsert({
      where: { key: TELEGRAM_SETTINGS_KEY },
      update: { value: JSON.stringify(next) },
      create: { key: TELEGRAM_SETTINGS_KEY, value: JSON.stringify(next), remark: "เปิด/ปิดการแจ้งเตือน Telegram แต่ละแบบ" },
    });
    resetTelegramToggles();

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "site_settings",
      recordId: saved.id,
      ipAddress: getAuditIpAddress(req),
      oldValues: { key: TELEGRAM_SETTINGS_KEY, ...parseTelegramToggles(existing?.value) },
      newValues: { key: TELEGRAM_SETTINGS_KEY, ...next },
    });

    return NextResponse.json({ toggles: next });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// POST /api/admin/settings { action: "telegram-test" } — ส่งข้อความทดสอบ
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => ({}));
  if (body.action !== "telegram-test") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID ในไฟล์ .env" }, { status: 400 });
  }

  const ok = await sendTelegramTest(user.fullName || user.userName);
  return NextResponse.json({ ok, lastDelivery }, { status: ok ? 200 : 502 });
}
