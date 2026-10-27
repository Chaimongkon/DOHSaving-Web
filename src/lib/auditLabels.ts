/**
 * ชื่อภาษาไทยของประวัติการแก้ไขระบบ (audit_logs) — ใช้ในแดชบอร์ดและประวัติรายบุคคล (/admin/users)
 */
export const TABLE_LABELS: Record<string, string> = {
  news: "ข่าวประชาสัมพันธ์",
  forms: "แบบฟอร์ม",
  regulations: "ข้อบังคับ/ระเบียบ/ประกาศ",
  slides: "สไลด์หน้าแรก",
  notifications: "ป๊อปอัพแจ้งเตือน",
  service_pages: "หน้าบริการ",
  financial_summaries: "รายการย่อสินทรัพย์และหนี้สิน",
  annual_reports: "รายงานประจำปี",
  meeting_documents: "เอกสารประกอบการประชุม",
  interest_rates: "อัตราดอกเบี้ย",
  member_media: "สื่อสำหรับสมาชิก",
  site_settings: "ตั้งค่าหน้าเว็บ",
  videos: "วิดีโอ",
  photo_albums: "อัลบั้มภาพ",
  activity_albums: "อัลบั้มภาพ",
  complaints: "ร้องเรียน/เสนอแนะ",
  qna_questions: "กระดานถาม-ตอบ",
  qna_replies: "กระดานถาม-ตอบ",
  users: "ผู้ใช้งาน",
  loan_types: "ประเภทเงินกู้",
  festival_themes: "Festival Theme",
  auth_sessions: "การเข้าสู่ระบบ",
  uploads: "ไฟล์",
  cookie_consents: "Cookie Consent",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "เพิ่ม",
  update: "แก้ไข",
  delete: "ลบ",
  upload: "อัปโหลดไฟล์",
  login_success: "เข้าสู่ระบบ",
  login_failed: "เข้าสู่ระบบไม่สำเร็จ",
  logout: "ออกจากระบบ",
  change_password: "เปลี่ยนรหัสผ่าน",
  reset_password: "รีเซ็ตรหัสผ่าน",
  unlock: "ปลดล็อกบัญชี",
};
