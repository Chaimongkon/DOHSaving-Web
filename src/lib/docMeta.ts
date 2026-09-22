/**
 * ข้อมูลที่มาของเอกสารกำกับดูแล (นโยบาย / จรรยาบรรณ)
 *
 * หน้าเผยแพร่พวกนี้เป็นเอกสารที่สมาชิกและผู้ตรวจสอบกิจการอาจต้องอ้างอิง
 * จึงต้องบอกได้ว่าประกาศใช้เมื่อไร ตามมติใด และดูไฟล์ต้นฉบับได้ที่ไหน
 * เก็บแยก siteSetting key ละหน้า (เช่น page_ethics_staff_meta)
 * เพื่อไม่ไปแตะ schema ของรายการข้อที่มีอยู่เดิม
 */

export interface DocMeta {
  /** ประกาศ ณ วันที่ — เก็บเป็นข้อความอิสระ เพราะแอดมินกรอก พ.ศ. เช่น "1 มกราคม 2567" */
  announcedAt: string;
  /** อ้างอิง เช่น "มติที่ประชุมคณะกรรมการดำเนินการ ชุดที่ 45 ครั้งที่ 3/2567" */
  reference: string;
  /** ฉบับ เช่น "ฉบับปี 2567" */
  edition: string;
  /** ลิงก์ไฟล์เอกสารต้นฉบับ (PDF) */
  documentUrl: string;
}

export const EMPTY_DOC_META: DocMeta = {
  announcedAt: "",
  reference: "",
  edition: "",
  documentUrl: "",
};

const asString = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** อ่านค่าจาก siteSetting.value — ทนต่อ JSON เสียหรือ key ขาด */
export function parseDocMeta(raw: string | null | undefined): DocMeta {
  if (!raw) return { ...EMPTY_DOC_META };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_DOC_META };
    return {
      announcedAt: asString(parsed.announcedAt),
      reference: asString(parsed.reference),
      edition: asString(parsed.edition),
      documentUrl: asString(parsed.documentUrl),
    };
  } catch {
    return { ...EMPTY_DOC_META };
  }
}

/** ทำให้ payload ที่รับจากแอดมินสะอาดก่อนบันทึก */
export function normalizeDocMeta(input: unknown): DocMeta {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    announcedAt: asString(src.announcedAt),
    reference: asString(src.reference),
    edition: asString(src.edition),
    documentUrl: asString(src.documentUrl),
  };
}

export function hasDocMeta(meta: DocMeta): boolean {
  return Boolean(meta.announcedAt || meta.reference || meta.edition || meta.documentUrl);
}

/**
 * ยอมเฉพาะลิงก์ที่ปลอดภัย — ค่านี้แอดมินพิมพ์เองได้
 * จึงต้องกัน javascript:, data: ฯลฯ ไม่ให้กลายเป็น href
 */
export function safeDocUrl(url: string): string | null {
  const v = url.trim();
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const parsed = new URL(v);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}
