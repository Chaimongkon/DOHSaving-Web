/**
 * ข้อมูลธีมเทศกาลฝั่งหน้าเว็บ — ดึงครั้งเดียวต่อการเปิดหน้าเว็บ ใช้ร่วมกันทุกคอมโพเนนต์
 */
export interface ActiveFestival {
  id: number;
  themeKey: string;
  isActive: boolean;
  [key: string]: unknown;
}

let festivalPromise: Promise<ActiveFestival | null> | null = null;
let mourningPromise: Promise<boolean> | null = null;

export function fetchActiveFestival(): Promise<ActiveFestival | null> {
  festivalPromise ??= fetch("/api/festival/active")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && d.isActive ? (d as ActiveFestival) : null))
    .catch(() => null);
  return festivalPromise;
}

/** โหมดไว้อาลัยเปิดอยู่หรือไม่ — เปิดอยู่ = ห้ามแสดงของตกแต่งเทศกาล */
export function fetchMourningActive(): Promise<boolean> {
  mourningPromise ??= fetch("/api/mourning-mode")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => Boolean(d?.active))
    .catch(() => false);
  return mourningPromise;
}

/* ── โหมดดูตัวอย่างธีม — เฉพาะเจ้าหน้าที่ที่ล็อกอินอยู่ ──
   ?festival-preview=draft         ดูค่าที่กรอกอยู่ในฟอร์ม Festival Theme (ยังไม่ต้องบันทึก) — ฟอร์มเขียนไว้ใน localStorage
   ?festival-preview=loy-krathong  ดูชุดตกแต่งของธีมนั้นอย่างเดียว */
const PREVIEW_KEY = "festival-preview";
const DRAFT_KEY = "festival-preview-draft";

/** หน้า admin: เก็บค่าฟอร์มไว้ให้แท็บหน้าเว็บอ่าน (โดเมนเดียวกัน ใช้ localStorage ร่วมกัน) */
export function saveFestivalDraft(form: Record<string, unknown>) {
  const iconUrls = Array.isArray(form.iconUrls) ? (form.iconUrls.length ? JSON.stringify(form.iconUrls) : null) : form.iconUrls;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, iconUrls, isActive: true, id: 0 }));
}

function readDraft(): ActiveFestival | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ActiveFestival) : null;
  } catch {
    return null;
  }
}

/** ธีมเปล่า (ไม่มีเอฟเฟกต์/แบนเนอร์) — ใช้ตอนดูตัวอย่างชุดตกแต่งด้วยชื่อธีม */
const bareTheme = (themeKey: string): ActiveFestival => ({
  id: 0,
  themeKey,
  isActive: true,
  effect: "none",
  animation: "none",
  iconMode: "none",
  bannerText: null,
  colorPrimary: null,
  colorBg: null,
});

export interface ResolvedFestival {
  festival: ActiveFestival | null;
  preview: boolean;
}

let resolvedPromise: Promise<ResolvedFestival> | null = null;

/**
 * ธีมเทศกาลที่หน้าเว็บควรแสดงตอนนี้ — ทุกคอมโพเนนต์เทศกาล (สี เอฟเฟกต์ แอนิเมชัน แบนเนอร์ ของตกแต่ง) ใช้ค่านี้ค่าเดียว
 * ลำดับ: โหมดดูตัวอย่างของเจ้าหน้าที่ > ธีมที่เปิดอยู่ตามช่วงวันที่ · โหมดไว้อาลัยเปิดอยู่ = ไม่แสดงอะไรของเทศกาลเลย
 */
export function resolveFestival(): Promise<ResolvedFestival> {
  resolvedPromise ??= (async () => {
    const preview = readFestivalPreview();
    if (preview && (await canPreviewFestival())) {
      const festival = preview === "draft" ? readDraft() : bareTheme(preview);
      if (festival) return { festival, preview: true };
    }
    if (preview) clearFestivalPreview(); // ไม่มีสิทธิ์ — ลิงก์ไม่มีผล เห็นเว็บปกติ
    const [festival, mourning] = await Promise.all([fetchActiveFestival(), fetchMourningActive()]);
    return { festival: mourning ? null : festival, preview: false };
  })();
  return resolvedPromise;
}

/**
 * ดูตัวอย่างธีมได้ไหม: ล็อกอินหลังบ้านอยู่ในเบราว์เซอร์นี้ และเป็น admin หรือมีสิทธิ์เมนู Festival Theme
 * (คุกกี้ล็อกอินส่งมากับทุกหน้า — หน้าเว็บสาธารณะจึงถามสถานะได้)
 */
export async function canPreviewFestival(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return false;
    const me = await res.json();
    if (me?.userRole === "admin") return true;
    let perms: unknown = me?.menuPermissions;
    if (typeof perms === "string") perms = JSON.parse(perms);
    return Array.isArray(perms) && perms.includes("/admin/festivals");
  } catch {
    return false;
  }
}

/** อ่านธีมที่กำลังดูตัวอย่าง — จาก URL (แล้วจำไว้ตลอดการเปิดแท็บ) หรือที่จำไว้ก่อนหน้า */
export function readFestivalPreview(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(PREVIEW_KEY);
    if (fromUrl === "off") {
      window.sessionStorage.removeItem(PREVIEW_KEY);
      return null;
    }
    if (fromUrl && /^[a-z-]{2,40}$/.test(fromUrl)) {
      window.sessionStorage.setItem(PREVIEW_KEY, fromUrl);
      return fromUrl;
    }
    return window.sessionStorage.getItem(PREVIEW_KEY);
  } catch {
    return null;
  }
}

export function clearFestivalPreview() {
  try {
    window.sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    /* โหมดส่วนตัว */
  }
}

export function exitFestivalPreview() {
  clearFestivalPreview();
  const url = new URL(window.location.href);
  url.searchParams.delete(PREVIEW_KEY);
  window.location.replace(url.toString());
}

/** ชื่อธีมที่กำลังดูตัวอย่าง (สำหรับป้ายมุมจอ) */
export const previewLabel = (f: ActiveFestival | null) =>
  (typeof f?.name === "string" && f.name.trim()) || (f?.themeKey === "loy-krathong" ? "ลอยกระทง" : f?.themeKey ?? "");
