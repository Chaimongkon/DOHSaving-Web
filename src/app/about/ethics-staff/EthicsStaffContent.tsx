"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SolutionOutlined,
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import css from "./EthicsStaffContent.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface EthicsItem {
  id: string;
  text: string;
}

// Gradient ribbon colors — warm earthy/jewel tones
const RIBBON_COLORS = [
  "linear-gradient(135deg, #0d9488, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #8b5cf6)",
  "linear-gradient(135deg, #b45309, #d97706)",
  "linear-gradient(135deg, #dc2626, #ef4444)",
  "linear-gradient(135deg, #2563eb, #3b82f6)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #9333ea, #a855f7)",
  "linear-gradient(135deg, #0284c7, #0ea5e9)",
  "linear-gradient(135deg, #c2410c, #ea580c)",
  "linear-gradient(135deg, #4f46e5, #6366f1)",
  "linear-gradient(135deg, #0891b2, #06b6d4)",
  "linear-gradient(135deg, #be123c, #e11d48)",
];

export default function EthicsStaffContent() {
  const pathname = usePathname();
  const [items, setItems] = useState<EthicsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ribbonsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/ethics-staff-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll animation — alternate slide from left/right
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.ribbonVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -30px 0px" }
    );

    ribbonsRef.current.forEach((el) => {
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
          <span className={css.breadcrumbCurrent}>จรรยาบรรณเจ้าหน้าที่</span>

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
            <div className={css.titleBadge}><SolutionOutlined /></div>
            <h1 className={css.pageTitle}>จรรยาบรรณเจ้าหน้าที่</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            {items.length > 0 && (
              <span className={css.countBadge}>จรรยาบรรณ {items.length} ประการ</span>
            )}
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : items.length > 0 ? (
            <div className={css.ribbonList}>
              {items.map((item, i) => {
                const gradient = RIBBON_COLORS[i % RIBBON_COLORS.length];
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={item.id}
                    ref={(el) => { ribbonsRef.current[i] = el; }}
                    className={`${css.ribbon} ${isEven ? css.ribbonLeft : css.ribbonRight}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={css.ribbonInner} style={{ background: gradient }}>
                      <div className={css.ribbonNumber}>{i + 1}</div>
                      <div className={css.ribbonText}>{item.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><SolutionOutlined /></div>
              <p className={css.emptyText}>ยังไม่มีจรรยาบรรณ — กรุณาเพิ่มผ่านระบบ Admin</p>
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
