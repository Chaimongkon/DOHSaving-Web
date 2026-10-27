/**
 * ค่าปรับของ Effect แบบ Lottie (เช่น พลุ) — เก็บต่อท้ายลิงก์ไฟล์ในช่อง effectUrl เดิม (หลังเครื่องหมาย #)
 * ไม่ต้องเพิ่มช่องในฐานข้อมูล · ส่วนหลัง # ไม่ถูกส่งไป server ตอนโหลดไฟล์
 *
 *   /uploads/lottie/fireworks.json#size=520&area=55&vary=30&mobile=70
 */
export interface LottieFx {
  /** ความกว้างของแต่ละลูกบนจอคอม (px) — ไม่ระบุ = คำนวณจาก "ขนาด" เดิม (effectScale) */
  size?: number;
  /** ระเบิดได้ลงมาถึงกี่ % ของความสูงจอ (นับจากบน) */
  area: number;
  /** ขนาดแต่ละลูกต่างกันได้ ± กี่ % */
  vary: number;
  /** ขนาดบนมือถือ เทียบกับจอคอม (%) */
  mobile: number;
}

export const LOTTIE_FX_DEFAULT: LottieFx = { area: 40, vary: 20, mobile: 60 };

export const LOTTIE_AREAS = [
  { value: 40, label: "ฟ้าด้านบน (แนะนำ)" },
  { value: 55, label: "ครึ่งบนของจอ" },
  { value: 85, label: "ทั้งจอ" },
];

/** ขนาดจากค่า "ขนาด" แบบเดิม (effectScale 10–100 → 120–450 px) */
export const sizeFromScale = (scale: number) => Math.round(120 + ((450 - 120) * scale) / 100);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function parseEffectUrl(url: string | null | undefined): { src: string; fx: LottieFx } {
  const [src = "", hash = ""] = (url ?? "").split("#");
  const q = new URLSearchParams(hash);
  const num = (k: string) => (q.has(k) && !Number.isNaN(Number(q.get(k))) ? Number(q.get(k)) : undefined);
  const size = num("size");
  return {
    src,
    fx: {
      size: size === undefined ? undefined : clamp(size, 80, 1200),
      area: clamp(num("area") ?? LOTTIE_FX_DEFAULT.area, 20, 90),
      vary: clamp(num("vary") ?? LOTTIE_FX_DEFAULT.vary, 0, 50),
      mobile: clamp(num("mobile") ?? LOTTIE_FX_DEFAULT.mobile, 30, 100),
    },
  };
}

/** สร้างลิงก์พร้อมค่าปรับ — เก็บเฉพาะค่าที่ต่างจากค่าเริ่มต้น */
export function buildEffectUrl(src: string, fx: LottieFx): string {
  if (!src) return "";
  const q = new URLSearchParams();
  if (fx.size !== undefined) q.set("size", String(Math.round(fx.size)));
  for (const k of ["area", "vary", "mobile"] as const) if (fx[k] !== LOTTIE_FX_DEFAULT[k]) q.set(k, String(Math.round(fx[k])));
  const hash = q.toString();
  return hash ? `${src}#${hash}` : src;
}
