"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UnorderedListOutlined,
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SolutionOutlined,
  PrinterOutlined,
  RiseOutlined,
  FileSearchOutlined,
  ReconciliationOutlined,
  AlertOutlined,
  CommentOutlined,
  GlobalOutlined,
  UserSwitchOutlined,
  LaptopOutlined,
  SmileOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import css from "./PolicyPageContent.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface PolicyItem {
  id: string;
  text: string;
}

// สี + icon สำหรับแต่ละข้อ
const CARD_THEMES = [
  { gradient: "linear-gradient(135deg, #E8652B, #f59e0b)", light: "rgba(232,101,43,0.08)", border: "#E8652B", icon: <RiseOutlined /> },
  { gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)", light: "rgba(59,130,246,0.08)", border: "#3b82f6", icon: <FileSearchOutlined /> },
  { gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", light: "rgba(139,92,246,0.08)", border: "#8b5cf6", icon: <ReconciliationOutlined /> },
  { gradient: "linear-gradient(135deg, #10b981, #34d399)", light: "rgba(16,185,129,0.08)", border: "#10b981", icon: <AlertOutlined /> },
  { gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)", light: "rgba(14,165,233,0.08)", border: "#0ea5e9", icon: <CommentOutlined /> },
  { gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", light: "rgba(245,158,11,0.08)", border: "#f59e0b", icon: <GlobalOutlined /> },
  { gradient: "linear-gradient(135deg, #f43f5e, #fb7185)", light: "rgba(244,63,94,0.08)", border: "#f43f5e", icon: <SafetyCertificateOutlined /> },
  { gradient: "linear-gradient(135deg, #6366f1, #818cf8)", light: "rgba(99,102,241,0.08)", border: "#6366f1", icon: <UserSwitchOutlined /> },
  { gradient: "linear-gradient(135deg, #14b8a6, #2dd4bf)", light: "rgba(20,184,166,0.08)", border: "#14b8a6", icon: <LaptopOutlined /> },
  { gradient: "linear-gradient(135deg, #ec4899, #f472b6)", light: "rgba(236,72,153,0.08)", border: "#ec4899", icon: <SmileOutlined /> },
  { gradient: "linear-gradient(135deg, #84cc16, #a3e635)", light: "rgba(132,204,22,0.08)", border: "#84cc16", icon: <TrophyOutlined /> },
];

export default function PolicyPageContent() {
  const pathname = usePathname();
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/policy-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Intersection Observer for scroll animation
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.cardVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    cardsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handlePrint = () => window.print();

  return (
    <>
      {/* Breadcrumb bar */}
      <div className={css.breadcrumbBar}>
        <div className={css.breadcrumbInner}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbLink}>เกี่ยวกับสหกรณ์ฯ</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>นโยบายสหกรณ์</span>

          <button className={css.printBtn} onClick={handlePrint} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={css.wrapper}>
        {/* Main content */}
        <div className={css.main}>
          <div className={css.titleSection}>
            <h1 className={css.pageTitle}>นโยบายสหกรณ์</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            {items.length > 0 && (
              <span className={css.countBadge}>ทั้งหมด {items.length} ข้อ</span>
            )}
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : items.length > 0 ? (
            <div className={css.grid}>
              {items.map((item, i) => {
                const theme = CARD_THEMES[i % CARD_THEMES.length];
                return (
                  <div
                    key={item.id}
                    ref={(el) => { cardsRef.current[i] = el; }}
                    className={`${css.card} ${items.length % 2 === 1 && i === items.length - 1 ? css.cardFull : ""}`}
                    style={{
                      animationDelay: `${i * 80}ms`,
                      borderLeftColor: theme.border,
                    }}
                  >
                    {/* Background glow */}
                    <div
                      className={css.cardGlow}
                      style={{ background: theme.light }}
                    />
                    {/* Number + Icon */}
                    <div className={css.cardBadge}>
                      <div
                        className={css.cardNumber}
                        style={{ background: theme.gradient }}
                      >
                        {i + 1}
                      </div>
                      <div
                        className={css.cardIcon}
                        style={{ color: theme.border }}
                      >
                        {theme.icon}
                      </div>
                    </div>
                    {/* Text */}
                    <div className={css.cardText}>
                      {item.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><UnorderedListOutlined /></div>
              <p className={css.emptyText}>ยังไม่มีนโยบาย — กรุณาเพิ่มผ่านระบบ Admin</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className={css.sidebar}>
          <div className={css.sidebarCard}>
            <h3 className={css.sidebarTitle}>เกี่ยวกับสหกรณ์ฯ</h3>
            <ul className={css.sidebarNav}>
              {sidebarLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${css.sidebarLink} ${pathname === item.href ? css.sidebarLinkActive : ""}`}
                  >
                    <span className={css.sidebarLinkIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
