"use client";

import React, { useState, useEffect } from "react";
import {
  DashboardOutlined,
  PictureOutlined,
  NotificationOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  DollarOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
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
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import css from "./layout.module.css";

interface UserData {
  fullName: string;
  userRole: string;
  avatarPath: string | null;
}

const navItems = [
  { label: "แดชบอร์ด", href: "/admin", icon: <DashboardOutlined /> },
  {
    group: "จัดการเนื้อหา",
    items: [
      { label: "สไลด์หน้าแรก", href: "/admin/slides", icon: <PictureOutlined /> },
      { label: "ข่าวประชาสัมพันธ์", href: "/admin/news", icon: <FileTextOutlined /> },
      { label: "ป๊อปอัพแจ้งเตือน", href: "/admin/notifications", icon: <NotificationOutlined /> },
      { label: "วิดีโอ", href: "/admin/videos", icon: <VideoCameraOutlined /> },
      { label: "อัลบั้มภาพ", href: "/admin/photo-albums", icon: <CameraOutlined /> },
      { label: "สื่อสำหรับสมาชิก", href: "/admin/member-media", icon: <BookOutlined /> },
      { label: "หน้าบริการ", href: "/admin/service-pages", icon: <PictureOutlined /> },
      { label: "วิธีใช้งาน App", href: "/admin/app-guide", icon: <FileTextOutlined /> },
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
      { label: "โครงสร้างองค์กร", href: "/admin/pages/organization", icon: <BankOutlined /> },
    ],
  },
  {
    group: "การเงิน",
    items: [
      { label: "อัตราดอกเบี้ย", href: "/admin/interest-rates", icon: <DollarOutlined /> },
      { label: "สินทรัพย์และหนี้สิน", href: "/admin/financial-summary", icon: <BankOutlined /> },
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
      { label: "Festival Theme", href: "/admin/festivals", icon: <GiftOutlined /> },
      { label: "ผู้ใช้งาน", href: "/admin/users", icon: <TeamOutlined /> },
      { label: "Cookie Consent", href: "/admin/cookie-consent", icon: <SafetyCertificateOutlined /> },
      { label: "ตั้งค่า", href: "/admin/settings", icon: <SettingOutlined /> },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        // ไม่ redirect เพราะ middleware จะจัดการ
      });
  }, [isLoginPage]);

  // ถ้าอยู่หน้า login ไม่แสดง layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className={css.layout}>
      {/* Sidebar */}
      <aside className={`${css.sidebar} ${sidebarOpen ? css.sidebarOpen : ""}`}>
        <div className={css.brand}>
          <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={36}
            height={36}
          />
          <h2 className={css.brandName}>
            DOH Saving
            <span className={css.brandSub}>Admin Panel</span>
          </h2>
        </div>

        <nav className={css.nav}>
          {navItems.map((section, i) => {
            if ("href" in section && section.href) {
              const href = section.href;
              return (
                <Link
                  key={i}
                  href={href}
                  className={`${css.navItem} ${isActive(href) ? css.navItemActive : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={css.navIcon}>{section.icon}</span>
                  {section.label}
                </Link>
              );
            }
            if ("group" in section) {
              return (
                <div key={i}>
                  <p className={css.navLabel}>{section.group}</p>
                  {section.items?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${css.navItem} ${isActive(item.href) ? css.navItemActive : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={css.navIcon}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </nav>

        {/* User section */}
        <div className={css.userSection}>
          <div className={css.userInfo}>
            <div className={css.avatar}>
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <p className={css.userName}>
              {user?.fullName || "Admin"}
              <span className={css.userRole}>{user?.userRole || "admin"}</span>
            </p>
          </div>
          <button className={css.logoutBtn} onClick={handleLogout}>
            <LogoutOutlined /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={css.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={css.main}>
        <header className={css.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className={css.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuOutlined />
            </button>
          </div>
          <div className={css.topbarRight} />
        </header>

        <main className={css.content}>{children}</main>
      </div>
    </div>
  );
}
