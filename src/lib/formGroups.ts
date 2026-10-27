/**
 * รวมแบบฟอร์มชื่อเดียวกันของสมาชิกต่างประเภทเป็นรายการเดียว (เช่น "คำขอกู้เงินสามัญ" ฉบับ ก / ข / สมทบ)
 * ใช้ในหน้าหลัก: แบบฟอร์มยอดนิยมและผลค้นหา — ปุ่มดาวน์โหลดแยกตามประเภทสมาชิก จะได้ไม่โหลดผิดฉบับ
 */
export const MEMBER_ORDER = ["สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ", "สมาชิกทุกประเภท"];

export interface FormVariant {
  id: number;
  category: string;
  fileUrl: string;
}

export interface FormGroup {
  title: string;
  group: string;
  variants: FormVariant[];
}

const keyOf = (title: string) => title.normalize("NFC").replace(/\s+/g, " ").trim();
const rank = (c: string) => {
  const i = MEMBER_ORDER.indexOf(c);
  return i < 0 ? MEMBER_ORDER.length : i;
};

/** จัดกลุ่มตามชื่อ (เรียงกลุ่มตามลำดับที่ส่งเข้ามา) · ข้ามแบบฟอร์มที่ไม่มีไฟล์ */
export function groupForms<T extends { id: number; title: string; group: string; category: string; fileUrl: string | null }>(
  forms: T[]
): FormGroup[] {
  const map = new Map<string, FormGroup>();
  for (const f of forms) {
    if (!f.fileUrl) continue;
    const k = keyOf(f.title);
    const g = map.get(k) ?? { title: k, group: f.group, variants: [] };
    if (!g.variants.some((v) => v.category === f.category)) g.variants.push({ id: f.id, category: f.category, fileUrl: f.fileUrl });
    map.set(k, g);
  }
  for (const g of map.values()) g.variants.sort((a, b) => rank(a.category) - rank(b.category));
  return [...map.values()];
}
