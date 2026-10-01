// ============================================================
// Q&A privacy — ตรวจจับ/ซ่อนข้อมูลส่วนตัวบนกระดานสาธารณะ
// ใช้ทั้งฝั่ง API (ซ่อนก่อนส่งออก + ปฏิเสธตอนโพสต์) และฝั่งหน้าเว็บ (ถามก่อนโพสต์)
//
// - เบอร์โทร: อนุญาต (สมาชิกใช้หาผู้ค้ำประกัน) แต่ไม่ส่งเบอร์เต็มในหน้าเว็บ
//   ต้องกด "ดูเบอร์" ผ่าน /api/qna/[id]/contact (จำกัดครั้ง) และซ่อนถาวรหลัง 30 วัน
// - เลขบัตรประชาชน / เลขบัญชี: ไม่มีเหตุผลต้องเปิดเผย → ห้ามโพสต์ และซ่อนเสมอในข้อมูลเก่า
// ============================================================

export type SensitiveType = "phone" | "idcard" | "account";

export interface SensitiveMatch {
  type: SensitiveType;
  start: number;
  end: number;
  value: string;
}

/** อายุการแสดงเบอร์ติดต่อหลังโพสต์ */
export const PHONE_VISIBLE_DAYS = 30;

// ตัวคั่น marker ในข้อความที่ API ส่งออก — ใช้อักขระ Private Use Area ที่ผู้ใช้พิมพ์เองไม่ได้
export const MARK_OPEN = "";
export const MARK_CLOSE = "";
export const MARKER_RE = /([^]*)/g;

// เบอร์ไทย: 0X-XXX-XXXX (9 หลัก) / 0XX-XXX-XXXX (10 หลัก) / +66 — คั่นด้วยช่องว่าง . หรือ - ได้
const PHONE_RE = /(?<!\d)(?:\+?66[\s.-]?|0)[1-9](?:[\s.-]?\d){7,8}(?!\d)/g;
// 13 หลัก (คั่นได้) — ตรวจ checksum เพื่อลดการจับตัวเลขอื่นผิด
const IDCARD_RE = /(?<!\d)\d(?:[\s-]?\d){12}(?!\d)/g;
// เลขบัญชี: ต้องมีคำว่า "บัญชี" นำหน้า ไม่งั้นแยกจากเบอร์โทร/ยอดเงินไม่ได้
const ACCOUNT_RE = /(?:เลขที่บัญชี|เลขบัญชี|บัญชี|บ\/ช|บช\.?|account|acc\.?)\s*(?:เลขที่|no\.?)?\s*[:：]?\s*(\d(?:[\s-]?\d){8,14})(?!\d)/gi;

const digitsOnly = (s: string) => s.replace(/\D/g, "");

function isThaiIdCard(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(d[12]);
}

/** หาข้อมูลอ่อนไหวทั้งหมด (ไม่ซ้อนกัน เรียงตามตำแหน่ง) */
export function findSensitive(text: string): SensitiveMatch[] {
  const found: SensitiveMatch[] = [];
  const overlaps = (s: number, e: number) => found.some((m) => s < m.end && e > m.start);

  for (const m of text.matchAll(ACCOUNT_RE)) {
    const value = m[1];
    const start = m.index! + m[0].lastIndexOf(value);
    found.push({ type: "account", start, end: start + value.length, value });
  }
  for (const m of text.matchAll(IDCARD_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    // checksum ถูก หรือมีคำว่า "บัตร/ปชช." นำหน้า (กรณีพิมพ์เลขผิดหลักใดหลักหนึ่ง)
    const labelled = /(?:บัตร|ประชาชน|ปชช\.?|id\s*card)[^\d]{0,15}$/i.test(text.slice(Math.max(0, start - 25), start));
    if ((isThaiIdCard(m[0]) || labelled) && !overlaps(start, end)) found.push({ type: "idcard", start, end, value: m[0] });
  }
  for (const m of text.matchAll(PHONE_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (!overlaps(start, end)) found.push({ type: "phone", start, end, value: m[0] });
  }
  return found.sort((a, b) => a.start - b.start);
}

function replaceMatches(text: string, matches: SensitiveMatch[], fn: (m: SensitiveMatch, phoneIndex: number) => string) {
  let out = "";
  let last = 0;
  let phoneIndex = 0;
  for (const m of matches) {
    out += text.slice(last, m.start) + fn(m, m.type === "phone" ? phoneIndex++ : -1);
    last = m.end;
  }
  return out + text.slice(last);
}

/**
 * สำหรับเนื้อหากระทู้/คำตอบที่ส่งออกสาธารณะ — แทนด้วย marker ให้หน้าเว็บวาดปุ่ม "ดูเบอร์"
 * canReveal=false (เกิน 30 วัน / กระทู้ปิด) → เบอร์ถูกซ่อนถาวร
 */
export function maskForPublic(text: string, canReveal: boolean): string {
  return replaceMatches(text, findSensitive(text), (m, i) => {
    if (m.type !== "phone") return `${MARK_OPEN}${m.type}${MARK_CLOSE}`;
    if (!canReveal) return `${MARK_OPEN}tel-hidden${MARK_CLOSE}`;
    return `${MARK_OPEN}tel:${i}:${digitsOnly(m.value).slice(-2)}${MARK_CLOSE}`;
  });
}

/** สำหรับหัวข้อ/ข้อความย่อ (แสดงเป็นข้อความธรรมดา ไม่มีปุ่ม) */
export function maskPlain(text: string): string {
  const label: Record<SensitiveType, string> = {
    phone: "[เบอร์โทร]",
    idcard: "[เลขบัตรประชาชน]",
    account: "[เลขบัญชี]",
  };
  return replaceMatches(text, findSensitive(text), (m) => label[m.type]);
}

/** เบอร์โทรลำดับที่ index ในข้อความ (ลำดับเดียวกับ marker tel:index) */
export function phoneAt(text: string, index: number): string | null {
  const phones = findSensitive(text).filter((m) => m.type === "phone");
  return phones[index] ? digitsOnly(phones[index].value).replace(/^66/, "0") : null;
}

/** ลบข้อมูลตามประเภทออกจากข้อความ (ปุ่ม "ลบให้อัตโนมัติ") */
export function removeSensitive(text: string, types: SensitiveType[]): string {
  const matches = findSensitive(text).filter((m) => types.includes(m.type));
  return replaceMatches(text, matches, () => "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .trim();
}

/** ตัด marker ปลอมที่ผู้ใช้อาจแนบมา */
export function stripMarkers(text: string): string {
  return text.replace(/[]/g, "");
}

export function phoneExpired(createdAt: Date | string, isClosed: boolean): boolean {
  if (isClosed) return true;
  const age = Date.now() - new Date(createdAt).getTime();
  return age > PHONE_VISIBLE_DAYS * 24 * 60 * 60 * 1000;
}

export function formatPhone(digits: string): string {
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  return digits;
}

// ─── ชื่อที่สงวนไว้ (กันแอบอ้างเป็นเจ้าหน้าที่) ───
const RESERVED_NAME_RE = /เจ้าหน้าที่|จนท\.?|แอดมิน|แอดมิ้น|ผู้ดูแล|สหกรณ์|ประธาน|ผู้จัดการ|กรรมการ|ฝ่ายสินเชื่อ|ฝ่ายทะเบียน|admin|staff|moderator|official|doh\s*saving/i;

export function isReservedName(name: string): boolean {
  return RESERVED_NAME_RE.test(name.replace(/\s+/g, " "));
}

export const RESERVED_NAME_ERROR =
  "ไม่สามารถใช้ชื่อที่คล้ายเจ้าหน้าที่หรือสหกรณ์ได้ เพื่อป้องกันการแอบอ้าง";

export const BLOCKED_DATA_ERROR =
  "พบเลขบัตรประชาชนหรือเลขบัญชีในข้อความ กรุณาลบออกก่อนโพสต์ เพื่อความปลอดภัยของท่าน";
