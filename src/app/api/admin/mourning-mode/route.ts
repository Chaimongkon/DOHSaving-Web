import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

const DB_KEY = "mourning_mode";

type MourningModeData = {
  active: boolean;
  intensity: number;
  bannerText: string;
};

const DEFAULTS: MourningModeData = {
  active: false,
  intensity: 100,
  bannerText: "",
};

function clampIntensity(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function parseStored(value: string | null | undefined): MourningModeData {
  if (!value) return DEFAULTS;
  try {
    const parsed = JSON.parse(value);
    return {
      active: Boolean(parsed.active),
      intensity: clampIntensity(parsed.intensity),
      bannerText: typeof parsed.bannerText === "string" ? parsed.bannerText : "",
    };
  } catch {
    return DEFAULTS;
  }
}

export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: DB_KEY } });
    return NextResponse.json(parseStored(setting?.value));
  } catch (error) {
    console.error("Failed to read mourning mode:", error);
    return NextResponse.json(DEFAULTS, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const next: MourningModeData = {
      active: Boolean(body.active),
      intensity: clampIntensity(body.intensity),
      bannerText: typeof body.bannerText === "string" ? body.bannerText.trim().slice(0, 500) : "",
    };

    const existing = await prisma.siteSetting.findUnique({ where: { key: DB_KEY } });
    const previous = parseStored(existing?.value);

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      update: { value: JSON.stringify(next), remark: "โหมดไว้อาลัย (ลดสีหน้าเว็บ + banner)" },
      create: {
        key: DB_KEY,
        value: JSON.stringify(next),
        remark: "โหมดไว้อาลัย (ลดสีหน้าเว็บ + banner)",
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "site_settings",
      ipAddress: getAuditIpAddress(req),
      oldValues: { key: DB_KEY, ...previous },
      newValues: { key: DB_KEY, ...next },
    });

    return NextResponse.json(next);
  } catch (error) {
    console.error("Failed to save mourning mode:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
