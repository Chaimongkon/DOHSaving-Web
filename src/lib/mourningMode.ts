/**
 * โหมดไว้อาลัย — ค่าที่เก็บใน site_settings (key: mourning_mode) เป็น JSON
 * ใช้ร่วมกันทั้ง API หน้าเว็บ API admin และแดชบอร์ด (ห้าม import prisma ในไฟล์นี้)
 */
export const MOURNING_KEY = "mourning_mode";
export const MOURNING_TEXT_MAX = 500;

export interface MourningSettings {
  /** สวิตช์ที่แอดมินเปิดไว้ */
  active: boolean;
  /** ความเข้มขาว-ดำ 0–100 */
  intensity: number;
  bannerText: string;
  /** ปิดอัตโนมัติเมื่อถึงเวลานี้ (ISO) · null = ไม่กำหนด */
  endsAt: string | null;
  /** เปิดครั้งล่าสุดเมื่อ (ISO) */
  since: string | null;
  updatedBy: string | null;
}

export const MOURNING_DEFAULTS: MourningSettings = {
  active: false,
  intensity: 100,
  bannerText: "",
  endsAt: null,
  since: null,
  updatedBy: null,
};

export function clampIntensity(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n)));
}

const isoOrNull = (raw: unknown): string | null => {
  if (typeof raw !== "string" || !raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export function parseMourning(value: string | null | undefined): MourningSettings {
  if (!value) return MOURNING_DEFAULTS;
  try {
    const p = JSON.parse(value);
    return {
      active: Boolean(p.active),
      intensity: clampIntensity(p.intensity),
      bannerText: typeof p.bannerText === "string" ? p.bannerText.slice(0, MOURNING_TEXT_MAX) : "",
      endsAt: isoOrNull(p.endsAt),
      since: isoOrNull(p.since),
      updatedBy: typeof p.updatedBy === "string" ? p.updatedBy : null,
    };
  } catch {
    return MOURNING_DEFAULTS;
  }
}

/** แสดงบนหน้าเว็บจริงตอนนี้ไหม — เปิดอยู่ และยังไม่ถึงเวลาปิดอัตโนมัติ */
export function isMourningLive(s: MourningSettings, now = new Date()): boolean {
  return s.active && (!s.endsAt || new Date(s.endsAt).getTime() > now.getTime());
}
