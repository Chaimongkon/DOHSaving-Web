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

// สีไล่ระดับสำหรับแต่ละข้อ
const CARD_COLORS = [
  { bg: "linear-gradient(135deg, #E8652B, #f59e0b)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #3b82f6, #06b6d4)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #8b5cf6, #a855f7)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #10b981, #34d399)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #f43f5e, #fb7185)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #0ea5e9, #38bdf8)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #f59e0b, #fbbf24)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #6366f1, #818cf8)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #14b8a6, #2dd4bf)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #ec4899, #f472b6)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #84cc16, #a3e635)", text: "#ffffff" },
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
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : items.length > 0 ? (
            <div className={css.grid}>
              {items.map((item, i) => {
                const color = CARD_COLORS[i % CARD_COLORS.length];
                return (
                  <div
                    key={item.id}
                    ref={(el) => { cardsRef.current[i] = el; }}
                    className={css.card}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div
                      className={css.cardNumber}
                      style={{ background: color.bg, color: color.text }}
                    >
                      {i + 1}
                    </div>
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
