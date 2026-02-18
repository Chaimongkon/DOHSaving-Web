"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Drawer, Menu } from "antd";
import {
  MenuOutlined,
  DownOutlined,
  RightOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  CustomerServiceOutlined,
  FileProtectOutlined,
  PhoneOutlined,
  BankOutlined,
  NotificationOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import Link from "next/link";
import Image from "next/image";

// ─── Menu data structure ─────────────────────────────────────

interface MegaColumn {
  title: string;
  links: { label: string; href: string }[];
}

interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  megaColumns?: MegaColumn[];
  megaImage?: string;
  wide?: boolean; // full-width grid layout for menus with many columns
}

const navItems: NavItem[] = [
  // ─── 1. เกี่ยวกับสหกรณ์ฯ ───
  {
    key: "about",
    label: "เกี่ยวกับสหกรณ์ฯ",
    icon: <InfoCircleOutlined />,
    megaImage: "/mega-about.svg",
    megaColumns: [
      {
        title: "รู้จักสหกรณ์ฯ",
        links: [
          { label: "ประวัติสหกรณ์", href: "/about/history" },
          { label: "คำนิยม วิสัยทัศน์และพันธกิจ", href: "/about/vision" },
          { label: "จรรยาบรรณคณะกรรมการดำเนินการ", href: "/about/ethics-board" },
          { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff" },
          { label: "นโยบายสหกรณ์", href: "/about/policy" },
          { label: "สารจากประธาน สอ.กส.", href: "/about/chairman-message" },
        ],
      },
      {
        title: "ผู้บริหารและฝ่ายจัดการ",
        links: [
          { label: "คณะกรรมการดำเนินการ", href: "/about/board" },
          { label: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ", href: "/about/auditors" },
          { label: "ผู้จัดการใหญ่และรองผู้จัดการฯ", href: "/about/managers" },
          { label: "ฝ่ายสินเชื่อ", href: "/about/dept-credit" },
          { label: "ฝ่ายการเงินและการลงทุน", href: "/about/dept-finance" },
          { label: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", href: "/about/dept-welfare" },
          { label: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน", href: "/about/dept-shares" },
          { label: "ฝ่ายบริหารทั่วไป", href: "/about/dept-general" },
          { label: "ฝ่ายบัญชี", href: "/about/dept-accounting" },
          { label: "ฝ่ายสารสนเทศ", href: "/about/dept-it" },
        ],
      },
    ],
  },
  // ─── 2. บริการ ───
  {
    key: "services",
    label: "บริการ",
    icon: <CustomerServiceOutlined />,
    wide: true,
    megaImage: "/mega-services.svg",
    megaColumns: [
      {
        title: "สมัครสมาชิก",
        links: [
          { label: "สมาชิกสามัญประเภท ก", href: "/services/member-type-a" },
          { label: "สมาชิกสามัญประเภท ข", href: "/services/member-type-b" },
          { label: "สมาชิกสมทบ", href: "/services/member-associate" },
        ],
      },
      {
        title: "สวัสดิการ",
        links: [
          { label: "สวัสดิการสมาชิกสามัญประเภท ก", href: "/services/welfare-a" },
          { label: "สวัสดิการสมาชิกสามัญประเภท ข", href: "/services/welfare-b" },
          { label: "สวัสดิการสมาชิกสมทบ", href: "/services/welfare-associate" },
        ],
      },
      {
        title: "บริการเงินฝาก",
        links: [
          { label: "ถอนเงิน ผ่านช่องทาง ONLINE", href: "/services/online-withdraw" },
          { label: "เงินฝากออมทรัพย์", href: "/services/savings" },
          { label: "เงินฝากออมทรัพย์ยั่งยืน", href: "/services/sustainable-savings" },
          { label: "เงินฝากออมทรัพย์พิเศษ", href: "/services/special-savings" },
          { label: "เงินฝากออมทรัพย์พิเศษเกษียณสุข", href: "/services/retirement-savings" },
          { label: "เงินฝากประจำ 24 เดือน", href: "/services/fixed-deposit-24" },
        ],
      },
      {
        title: "บริการเงินกู้",
        links: [
          { label: "เงินกู้ฉุกเฉิน", href: "/services/emergency-loan" },
          { label: "เงินกู้สามัญ", href: "/services/general-loan" },
          { label: "เงินกู้พิเศษ", href: "/services/special-loan" },
        ],
      },
      {
        title: "บริการอื่นๆ",
        links: [
          { label: "ประกันภัยรถยนต์", href: "/services/car-insurance" },
          { label: "พ.ร.บ. รถยนต์", href: "/services/car-act" },
          { label: "APP DOHSAVING", href: "/services/app-dohsaving" },
        ],
      },
    ],
  },
  // ─── 3. อัตราดอกเบี้ย ───
  {
    key: "interest-rates",
    label: "อัตราดอกเบี้ย",
    icon: <BankOutlined />,
    href: "/interest-rates",
  },
  // ─── 4. ข่าวสาร ───
  {
    key: "news",
    label: "ข่าวสาร",
    icon: <NotificationOutlined />,
    href: "/news",
  },
  // ─── 5. เอกสาร (รวม ผลการดำเนินการ + ข้อบังคับ + ดาวน์โหลด) ───
  {
    key: "documents",
    label: "เอกสาร",
    icon: <FileProtectOutlined />,
    wide: true,
    megaImage: "/mega-reports.svg",
    megaColumns: [
      {
        title: "งบการเงิน",
        links: [
          { label: "รายการย่อแสดงสินทรัพย์และหนี้สิน", href: "/reports/financial-summary" },
        ],
      },
      {
        title: "รายงานกิจการประจำปี",
        links: [
          { label: "เอกสารประกอบการประชุมใหญ่", href: "/reports/annual-meeting" },
        ],
      },
      {
        title: "ข้อบังคับ ระเบียบ ประกาศ",
        links: [
          { label: "ข้อบังคับ", href: "/regulations/statute" },
          { label: "ระเบียบ", href: "/regulations/rules" },
          { label: "ประกาศ", href: "/regulations/announcements" },
        ],
      },
      {
        title: "แบบฟอร์มบริการ",
        links: [
          { label: "แบบฟอร์มสมัครสมาชิก", href: "/downloads/member-forms" },
          { label: "แบบฟอร์มเงินฝาก-ถอน", href: "/downloads/deposit-forms" },
          { label: "แบบฟอร์มเกี่ยวกับเงินกู้", href: "/downloads/loan-forms" },
          { label: "แบบฟอร์มขอสวัสดิการ", href: "/downloads/welfare-forms" },
        ],
      },
      {
        title: "แบบฟอร์มอื่นๆ",
        links: [
          { label: "แบบฟอร์มหนังสือร้องทุกข์", href: "/downloads/complaint-forms" },
          { label: "หนังสือแต่งตั้งผู้รับโอนประโยชน์", href: "/downloads/beneficiary-forms" },
          { label: "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์", href: "/downloads/insurance-forms" },
          { label: "แบบฟอร์มอื่น ๆ", href: "/downloads/other-forms" },
        ],
      },
    ],
  },
  // ─── 6. ติดต่อเรา ───
  {
    key: "contact",
    label: "ติดต่อเรา",
    icon: <PhoneOutlined />,
    megaColumns: [
      {
        title: "ช่องทางติดต่อ",
        links: [
          { label: "ข้อมูลติดต่อสหกรณ์", href: "/contact" },
          { label: "แผนที่ / เส้นทาง", href: "/contact/map" },
        ],
      },
      {
        title: "สอบถามและร้องเรียน",
        links: [
          { label: "ถาม-ตอบ (Q&A)", href: "/qna" },
          { label: "ร้องเรียน / ร้องทุกข์", href: "/complaints" },
        ],
      },
    ],
  },
];

// Mobile menu items for Drawer
const mobileMenuItems: MenuProps["items"] = [
  { key: "home", icon: <HomeOutlined />, label: <Link href="/">หน้าแรก</Link> },
  ...navItems.map((item) => {
    if (item.href) {
      return { key: item.key, icon: item.icon, label: <Link href={item.href}>{item.label}</Link> };
    }
    return {
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.megaColumns?.flatMap((col) =>
        [
          { key: `${item.key}-title-${col.title}`, label: col.title, type: "group" as const },
          ...col.links.map((link) => ({
            key: `${item.key}-${link.href}-${link.label}`,
            label: <Link href={link.href}>{link.label}</Link>,
          })),
        ]
      ),
    };
  }),
];

// ─── MegaDropdown Component ──────────────────────────────────

function MegaDropdown({
  item,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: {
  item: NavItem;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const hasMega = !!item.megaColumns;
  const isWide = item.wide;

  return (
    <div
      className="nav-item-wrapper"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Trigger button */}
      {item.href ? (
        <Link href={item.href} className="nav-pill">
          <span>{item.label}</span>
        </Link>
      ) : (
        <button className={`nav-pill ${isOpen ? "nav-pill--active" : ""}`}>
          <span>{item.label}</span>
          {hasMega && <DownOutlined className="nav-pill-arrow" />}
        </button>
      )}

      {/* Mega dropdown panel */}
      {hasMega && (
        <div
          className={`mega-panel ${isOpen ? "mega-panel--open" : ""} ${isWide ? "mega-panel--wide" : ""}`}
        >
          <div className={`mega-panel-inner ${isWide ? "mega-panel-inner--wide" : ""}`}>
            {/* Left image */}
            {item.megaImage && (
              <div className="mega-panel-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.megaImage}
                  alt={item.label}
                  style={{ width: "100%", height: "auto", objectFit: "contain" }}
                />
              </div>
            )}

            {/* Columns */}
            <div className={`mega-panel-columns ${isWide ? "mega-panel-columns--wide" : ""}`}>
              {item.megaColumns?.map((col) => (
                <div key={col.title} className="mega-column">
                  <h4 className="mega-column-title">{col.title}</h4>
                  <ul className="mega-column-list">
                    {col.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <Link href={link.href} className="mega-link">
                          <RightOutlined className="mega-link-icon" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenKey(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenKey(null), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={52}
            height={52}
          />
          <div className="navbar-logo-text">
            <span className="navbar-title">สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</span>
            <span className="navbar-subtitle">
              DEPARTMENT OF HIGHWAY SAVING AND CREDIT COOPERATIVE, LTD.
            </span>
          </div>
        </Link>

        {/* Desktop Menu — Pill buttons with mega dropdowns */}
        <div className="navbar-menu-desktop">
          {navItems.map((item) => (
            <MegaDropdown
              key={item.key}
              item={item}
              isOpen={openKey === item.key}
              onMouseEnter={() => handleMouseEnter(item.key)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>

        {/* Login button */}
        <Link href="/login" className="navbar-login-btn">
          <LoginOutlined />
          <span>เข้าสู่ระบบ</span>
        </Link>

        {/* Mobile Hamburger */}
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 22, color: "#fff" }} />}
          className="navbar-hamburger"
          onClick={() => setDrawerOpen(true)}
        />

        {/* Mobile Drawer */}
        <Drawer
          title="เมนู"
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          styles={{ wrapper: { width: 300 } }}
        >
          <Menu
            mode="inline"
            items={mobileMenuItems}
            onClick={() => setDrawerOpen(false)}
            style={{ border: "none" }}
          />
        </Drawer>
      </div>
    </nav>
  );
}
