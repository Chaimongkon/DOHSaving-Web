/**
 * ประเภทสมาชิกที่ผู้ใช้เลือกไว้ — ใช้ร่วมกันระหว่างหน้าดาวน์โหลดแบบฟอร์มและหน้าระเบียบ/ประกาศ
 *
 * สองหน้าตั้งชื่อกลุ่มต่างกัน ("สมาชิกสามัญ ก" / "สมาชิกสามัญประเภท ก") จึงเทียบกันด้วย key กลาง
 * เก็บไว้ในเครื่องของผู้ใช้เท่านั้น (localStorage) — ไม่ส่งขึ้นเซิร์ฟเวอร์
 */
export type MemberKey = "a" | "b" | "assoc";

const STORAGE_KEY = "doh-member-type";
const KEYS: MemberKey[] = ["a", "b", "assoc"];

/**
 * key ของชื่อกลุ่มที่เป็นประเภทสมาชิกเดี่ยว ๆ
 * กลุ่มรวม (เช่น "สมาชิกสามัญประเภท ก ข สมทบ") และกลุ่มอื่น (เช่น "สหกรณ์ฯ", "สมาชิกทุกประเภท") คืน null
 */
export function memberKeyOf(name: string): MemberKey | null {
  const tokens = name.trim().split(/[\s,/]+/);
  const keys: MemberKey[] = [];
  if (tokens.includes("ก")) keys.push("a");
  if (tokens.includes("ข")) keys.push("b");
  if (name.includes("สมทบ")) keys.push("assoc");
  return keys.length === 1 ? keys[0] : null;
}

export function readSavedMember(): MemberKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return KEYS.includes(raw as MemberKey) ? (raw as MemberKey) : null;
  } catch {
    return null;
  }
}

export function saveMember(key: MemberKey) {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch { /* โหมดส่วนตัว/พื้นที่เต็ม — ไม่จำก็ยังใช้งานได้ */ }
}
