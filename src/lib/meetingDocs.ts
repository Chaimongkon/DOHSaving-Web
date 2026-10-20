/**
 * ประเภทเอกสารประชุมใหญ่ — ใช้ร่วมกันทั้งหน้า admin, API และหน้าเว็บ
 *
 * ปีหนึ่งมี "เล่มหลัก" (เอกสารประกอบการประชุมฉบับเต็ม) และเอกสารแนบอื่น ๆ ได้
 * ค่าเก่า general / plan (ก่อนลดหมวด) นับเป็น "อื่น ๆ"
 */
export type MeetingDocKind = "report" | "agenda" | "financial" | "other";

export const MEETING_DOC_KINDS: { value: MeetingDocKind; label: string; short: string; titleOf: (year: number) => string }[] = [
  { value: "report", label: "เล่มเอกสารประกอบการประชุม", short: "เล่มหลัก", titleOf: (y) => `เอกสารประกอบการประชุมใหญ่สามัญประจำปี ${y}` },
  { value: "agenda", label: "หนังสือเชิญ / ระเบียบวาระ", short: "ระเบียบวาระ", titleOf: (y) => `หนังสือเชิญประชุมใหญ่สามัญประจำปี ${y}` },
  { value: "financial", label: "งบการเงิน", short: "งบการเงิน", titleOf: (y) => `งบการเงิน ประจำปี ${y}` },
  { value: "other", label: "อื่น ๆ", short: "อื่น ๆ", titleOf: () => "" },
];

export const meetingDocKind = (category: string | null | undefined): MeetingDocKind =>
  (MEETING_DOC_KINDS.some((k) => k.value === category) ? category : "other") as MeetingDocKind;

/** ลำดับในปีเดียวกัน: เล่มหลักก่อน แล้วหนังสือเชิญ งบการเงิน อื่น ๆ (ไม่ต้องให้ผู้ใช้กรอกเอง) */
export const meetingDocOrder = (category: string | null | undefined) =>
  ({ report: 0, agenda: 10, financial: 20, other: 30 })[meetingDocKind(category)];

/** ป้ายหมวดบนหน้าเว็บ — เล่มหลักไม่ต้องมีป้าย (ชื่อบอกอยู่แล้ว) */
export const meetingDocBadge = (category: string | null | undefined) => {
  const kind = meetingDocKind(category);
  return kind === "report" ? null : MEETING_DOC_KINDS.find((k) => k.value === kind)!.short;
};
