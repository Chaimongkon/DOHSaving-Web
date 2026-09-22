import type { LucideIcon } from "lucide-react";
import {
  History,
  Eye,
  Scale,
  BadgeCheck,
  ShieldCheck,
  MessageSquareQuote,
  Network,
  Users,
  SearchCheck,
  Briefcase,
  HandCoins,
  Landmark,
  HeartHandshake,
  ClipboardList,
  Building2,
  Calculator,
  MonitorSmartphone,
} from "lucide-react";

export interface AboutNavLink {
  /** ชื่อเต็ม ใช้ในเมนูหลัก (mega menu) */
  label: string;
  /** ชื่อสั้นสำหรับ sidebar ที่แคบกว่า — ไม่ใส่ก็ใช้ label */
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
}

export interface AboutNavGroup {
  title: string;
  links: AboutNavLink[];
}

/**
 * รายการหน้าในหมวด "เกี่ยวกับสหกรณ์ฯ" — แหล่งเดียวที่ทั้งเมนูหลัก (Navbar)
 * และ sidebar ของทุกหน้าในหมวดนี้ใช้ร่วมกัน เพิ่ม/ลบหน้าแก้ที่นี่ที่เดียว
 */
export const ABOUT_NAV_GROUPS: AboutNavGroup[] = [
  {
    title: "รู้จักสหกรณ์ฯ",
    links: [
      { label: "ประวัติสหกรณ์", href: "/about/history", icon: History },
      { label: "ค่านิยม วิสัยทัศน์และพันธกิจ", shortLabel: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: Eye },
      { label: "จรรยาบรรณคณะกรรมการดำเนินการ", shortLabel: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: Scale },
      { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: BadgeCheck },
      { label: "นโยบายสหกรณ์", href: "/about/policy", icon: ShieldCheck },
      { label: "สารจากประธาน สอ.ทล.", shortLabel: "สารจากประธานฯ", href: "/about/chairman-message", icon: MessageSquareQuote },
    ],
  },
  {
    title: "ผู้บริหารและฝ่ายจัดการ",
    links: [
      { label: "โครงสร้างองค์กร", href: "/about/organization", icon: Network },
      { label: "คณะกรรมการดำเนินการ", href: "/about/board", icon: Users },
      { label: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ", shortLabel: "ผู้ตรวจสอบบัญชีและกิจการ", href: "/about/auditors", icon: SearchCheck },
      { label: "ผู้จัดการใหญ่และรองผู้จัดการฯ", href: "/about/managers", icon: Briefcase },
      { label: "ฝ่ายสินเชื่อ", href: "/about/dept-credit", icon: HandCoins },
      { label: "ฝ่ายการเงินและการลงทุน", href: "/about/dept-finance", icon: Landmark },
      { label: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", href: "/about/dept-welfare", icon: HeartHandshake },
      { label: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน", href: "/about/dept-shares", icon: ClipboardList },
      { label: "ฝ่ายบริหารทั่วไป", href: "/about/dept-general", icon: Building2 },
      { label: "ฝ่ายบัญชี", href: "/about/dept-accounting", icon: Calculator },
      { label: "งานสารสนเทศ", href: "/about/dept-it", icon: MonitorSmartphone },
    ],
  },
];
