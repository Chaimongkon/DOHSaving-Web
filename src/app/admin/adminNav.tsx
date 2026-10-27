/**
 * เมนูหลังบ้าน — ใช้ร่วมกันระหว่างแถบเมนูซ้าย (AdminShell) และหน้ากำหนดสิทธิ์ (/admin/users)
 * เพิ่มเมนูใหม่ที่นี่ที่เดียว แล้วเมนูจะขึ้นทั้งในแถบเมนูและในรายการสิทธิ์ให้ติ๊กอัตโนมัติ
 */
import React from "react";
import {
  DashboardOutlined,
  PictureOutlined,
  NotificationOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  DollarOutlined,
  CalculatorOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  HistoryOutlined,
  EyeOutlined,
  AuditOutlined,
  SolutionOutlined,
  BankOutlined,
  CrownOutlined,
  SearchOutlined,
  MessageOutlined,
  PhoneOutlined,
  CustomerServiceOutlined,
  FormOutlined,
  BookOutlined,
  GiftOutlined,
  DownloadOutlined,
  HeartOutlined,
} from "@ant-design/icons";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

export const navItems: (AdminNavItem | AdminNavGroup)[] = [
  { label: "แดชบอร์ด", href: "/admin", icon: <DashboardOutlined /> },
  {
    group: "จัดการเนื้อหา",
    items: [
      { label: "ข่าวประชาสัมพันธ์", href: "/admin/news", icon: <FileTextOutlined /> },
      { label: "วิดีโอ", href: "/admin/videos", icon: <VideoCameraOutlined /> },
      { label: "อัลบั้มภาพ", href: "/admin/photo-albums", icon: <CameraOutlined /> },
      { label: "สื่อสำหรับสมาชิก", href: "/admin/member-media", icon: <BookOutlined /> },
    ],
  },
  {
    group: "จัดการหน้าเว็บ",
    items: [
      { label: "สไลด์หน้าแรก", href: "/admin/slides", icon: <PictureOutlined /> },
      { label: "ป๊อปอัพแจ้งเตือน", href: "/admin/notifications", icon: <NotificationOutlined /> },
      { label: "หน้าบริการ", href: "/admin/service-pages", icon: <PictureOutlined /> },
      { label: "วิธีใช้งาน App", href: "/admin/app-guide", icon: <FileTextOutlined /> },
      { label: "ดาวน์โหลดแอป", href: "/admin/download-app", icon: <DownloadOutlined /> },
    ],
  },
  {
    group: "หน้าเพจ",
    items: [
      { label: "ประวัติสหกรณ์", href: "/admin/pages/history", icon: <HistoryOutlined /> },
      { label: "สารจากประธานฯ", href: "/admin/chairman-message", icon: <CrownOutlined /> },
      { label: "วิสัยทัศน์และพันธกิจ", href: "/admin/vision-data", icon: <EyeOutlined /> },
      { label: "นโยบายสหกรณ์", href: "/admin/policy-items", icon: <SafetyCertificateOutlined /> },
      { label: "จรรยาบรรณคณะกรรมการ", href: "/admin/ethics-board-items", icon: <AuditOutlined /> },
      { label: "จรรยาบรรณเจ้าหน้าที่", href: "/admin/ethics-staff-items", icon: <SolutionOutlined /> },
      { label: "คณะกรรมการ", href: "/admin/board-members", icon: <TeamOutlined /> },
      { label: "ผู้ตรวจสอบ", href: "/admin/auditors", icon: <SearchOutlined /> },
      { label: "บุคลากร/ฝ่ายต่างๆ", href: "/admin/department-staff", icon: <TeamOutlined /> },
      { label: "โครงสร้างองค์กร", href: "/admin/pages/organization/images", icon: <BankOutlined /> },
    ],
  },
  {
    group: "การเงิน",
    items: [
      { label: "อัตราดอกเบี้ย", href: "/admin/interest-rates", icon: <DollarOutlined /> },
      { label: "ประเภทเงินกู้", href: "/admin/loan-types", icon: <CalculatorOutlined /> },
      { label: "สินทรัพย์และหนี้สิน", href: "/admin/financial-summary", icon: <BankOutlined /> },
    ],
  },
  {
    group: "เอกสาร",
    items: [
      { label: "ข้อบังคับ ระเบียบ ประกาศ", href: "/admin/regulations", icon: <AuditOutlined /> },
      { label: "แบบฟอร์มต่างๆ", href: "/admin/forms", icon: <FormOutlined /> },
      { label: "รายงานประจำปี", href: "/admin/annual-reports", icon: <BookOutlined /> },
      { label: "เอกสารประกอบการประชุม", href: "/admin/meeting-documents", icon: <FileTextOutlined /> },
    ],
  },
  {
    group: "สื่อสาร",
    items: [
      { label: "กระดานถาม-ตอบ", href: "/admin/qna", icon: <MessageOutlined /> },
      { label: "ร้องเรียน/เสนอแนะ", href: "/admin/complaints", icon: <FileTextOutlined /> },
    ],
  },
  {
    group: "ข้อมูลติดต่อ",
    items: [
      { label: "ข้อมูลสหกรณ์", href: "/admin/contact-info", icon: <PhoneOutlined /> },
      { label: "ฝ่ายงาน/เบอร์โทร", href: "/admin/departments", icon: <CustomerServiceOutlined /> },
      { label: "LINE ฝ่ายต่างๆ", href: "/admin/line-contacts", icon: <MessageOutlined /> },
      { label: "บัญชีธนาคาร", href: "/admin/bank-accounts", icon: <BankOutlined /> },
    ],
  },
  {
    group: "ระบบ",
    items: [
      { label: "ยอดนิยมเดือนนี้", href: "/admin/page-analytics", icon: <EyeOutlined /> },
      { label: "สมาชิกค้นหา/ดาวน์โหลด", href: "/admin/search-insights", icon: <SearchOutlined /> },
      { label: "รูปเมนูหลัก", href: "/admin/mega-images", icon: <PictureOutlined /> },
      { label: "Festival Theme", href: "/admin/festivals", icon: <GiftOutlined /> },
      { label: "โหมดไว้อาลัย", href: "/admin/mourning", icon: <HeartOutlined /> },
      { label: "ผู้ใช้งาน", href: "/admin/users", icon: <TeamOutlined /> },
      { label: "Cookie Consent", href: "/admin/cookie-consent", icon: <SafetyCertificateOutlined /> },
      { label: "ตั้งค่าแสดงชื่อ URL", href: "/admin/url-mappings", icon: <SettingOutlined /> },
      { label: "ตั้งค่า", href: "/admin/settings", icon: <SettingOutlined /> },
    ],
  },
];

/** เมนูที่ให้สิทธิ์เจ้าหน้าที่ได้ — ไม่รวมแดชบอร์ด (เห็นเสมอ) และเมนูที่เฉพาะผู้ดูแลระบบ (API ล็อกไว้) */
export const ADMIN_ONLY_MENUS = new Set(["/admin/users", "/admin/settings"]);

export const permissionGroups: { group: string; items: { label: string; href: string }[] }[] = navItems
  .filter((s): s is AdminNavGroup => "group" in s)
  .map((s) => ({ group: s.group, items: s.items.filter((i) => !ADMIN_ONLY_MENUS.has(i.href)).map(({ label, href }) => ({ label, href })) }))
  .filter((g) => g.items.length > 0);
