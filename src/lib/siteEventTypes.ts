/**
 * ชนิดเหตุการณ์ที่หน้าเว็บส่งมานับ (ใช้ได้ทั้งฝั่งเว็บและเซิร์ฟเวอร์ — ห้าม import prisma ในไฟล์นี้)
 *
 * - form_download : เปิดดู/ดาวน์โหลดแบบฟอร์ม · target = id แบบฟอร์ม · meta = "view" | "download"
 * - form_group    : เปิดหมวดแบบฟอร์ม (?group=) · target = key หมวด
 * - search_miss   : ค้นหาแล้วไม่พบผลลัพธ์ · target = คำค้น · meta = หน้าที่ค้น
 */
export const SITE_EVENT_TYPES = ["form_download", "form_group", "search_miss"] as const;
export type SiteEventType = (typeof SITE_EVENT_TYPES)[number];

/** หมวดแบบฟอร์ม — key ตรงกับ ?group= ในหน้า /forms */
export const FORM_GROUP_LABELS: Record<string, string> = {
  "member-registration": "แบบฟอร์มสมัครสมาชิก",
  "deposit-withdraw": "แบบฟอร์มเงินฝาก-ถอน",
  loan: "แบบฟอร์มเกี่ยวกับเงินกู้",
  welfare: "แบบฟอร์มขอสวัสดิการ",
  complaint: "แบบฟอร์มหนังสือร้องทุกข์",
  beneficiary: "หนังสือแต่งตั้งผู้รับโอนประโยชน์",
  insurance: "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์",
  other: "แบบฟอร์มอื่นๆ",
};

/** หน้าที่มีช่องค้นหา — ค่า meta ของ search_miss */
export const SEARCH_PAGES: Record<string, { label: string; href: string }> = {
  forms: { label: "ดาวน์โหลดแบบฟอร์ม", href: "/forms" },
  "regulations:statute": { label: "ข้อบังคับ", href: "/regulations/statute" },
  "regulations:rules": { label: "ระเบียบ", href: "/regulations/rules" },
  "regulations:announcements": { label: "ประกาศ", href: "/regulations/announcements" },
  qna: { label: "ถาม-ตอบ", href: "/qna" },
  news: { label: "ข่าวสาร", href: "/news" },
  "annual-meeting": { label: "เอกสารประชุมใหญ่", href: "/reports/annual-meeting" },
};

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 100;

/**
 * คำค้นอาจมีข้อมูลส่วนตัวปน (เลขสมาชิก เบอร์โทร เลขบัตร) — ปิดตัวเลขยาว ๆ ก่อนเก็บ
 * และรวมรูปแบบที่ต่างกันแค่ตัวพิมพ์/ช่องว่างให้เป็นคำเดียวกัน
 */
export function normalizeSearchTerm(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\d[\d\s-]{4,}\d/g, "•••")
    .slice(0, SEARCH_MAX_LENGTH);
}
