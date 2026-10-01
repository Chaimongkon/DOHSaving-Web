// ============================================================
// Complaint tracking — ใช้ร่วมกันทั้งฝั่ง client และ API
// ============================================================

// ตัวอักษรที่ใช้ในเลขที่เรื่อง — ตัด 0/O/1/I ออก เพื่อไม่ให้สมาชิกอ่าน/พิมพ์สับสน
export const TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// รูปแบบใหม่: CP260924-K7QX2M (สุ่ม 6 ตัว ≈ 1 พันล้านแบบต่อวัน เดาไม่ได้)
// รูปแบบเดิม: CP260219-1234 (ยังค้นหาได้ เพื่อให้เรื่องเก่าติดตามต่อได้)
const NEW_FORMAT = /^CP\d{6}-[A-HJ-NP-Z2-9]{6}$/;
const LEGACY_FORMAT = /^CP\d{6}-\d{4}$/;

/** แปลงสิ่งที่ผู้ใช้พิมพ์/วาง ให้เป็นรูปแบบมาตรฐาน เช่น " cp 260924 k7qx2m " → "CP260924-K7QX2M" */
export function normalizeTrackingCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length < 9 || !raw.startsWith("CP")) return input.trim().toUpperCase();
  return `${raw.slice(0, 8)}-${raw.slice(8)}`;
}

export function isValidTrackingCode(code: string): boolean {
  return NEW_FORMAT.test(code) || LEGACY_FORMAT.test(code);
}

// ─── Labels ───
export const categoryLabels: Record<string, string> = {
  complaint: "ร้องเรียน / ร้องทุกข์",
  suggestion: "ข้อเสนอแนะ",
  inquiry: "สอบถามข้อมูล",
};

export const statusLabels: Record<string, string> = {
  pending: "รับเรื่องแล้ว รอดำเนินการ",
  reviewing: "กำลังตรวจสอบ",
  resolved: "ดำเนินการเสร็จสิ้น",
  rejected: "ไม่รับพิจารณา",
};

// ─── เรื่องที่เคยแจ้งจากอุปกรณ์นี้ (localStorage) ───
export interface SavedComplaint {
  code: string;
  subject: string;
  category: string;
  createdAt: string;
}

const STORAGE_KEY = "doh-complaints";
const MAX_SAVED = 10;

export function loadSavedComplaints(): SavedComplaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((c) => c && typeof c.code === "string") : [];
  } catch {
    return [];
  }
}

export function saveComplaint(item: SavedComplaint): SavedComplaint[] {
  const list = [item, ...loadSavedComplaints().filter((c) => c.code !== item.code)].slice(0, MAX_SAVED);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // private mode / storage blocked — ไม่เป็นไร ผู้ใช้ยังมีเลขที่เรื่องบนหน้าจอ
  }
  return list;
}

export function removeSavedComplaint(code: string): SavedComplaint[] {
  const list = loadSavedComplaints().filter((c) => c.code !== code);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}
