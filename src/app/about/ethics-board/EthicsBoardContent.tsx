"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AuditOutlined,
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import css from "./EthicsBoardContent.module.css";

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

// สลับ 2 สี สำหรับ timeline
const TIMELINE_COLORS = [
  { bg: "#fef3c7", border: "#f59e0b", numBg: "linear-gradient(135deg, #f59e0b, #d97706)", text: "#92400e" },
  { bg: "#e0f2fe", border: "#0ea5e9", numBg: "linear-gradient(135deg, #0ea5e9, #0284c7)", text: "#075985" },
];

export default function EthicsBoardContent() {
  const pathname = usePathname();
  const [items, setItems] = useState<EthicsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const timelineRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/ethics-board-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll animation
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.timelineItemVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    timelineRef.current.forEach((el) => {
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
          <span className={css.breadcrumbCurrent}>จรรยาบรรณคณะกรรมการ</span>

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
            <div className={css.titleBadge}><AuditOutlined /></div>
            <h1 className={css.pageTitle}>จรรยาบรรณคณะกรรมการ</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            {items.length > 0 && (
              <span className={css.countBadge}>จรรยาบรรณ {items.length} ประการ</span>
            )}
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : items.length > 0 ? (
            <div className={css.timeline}>
              <div className={css.timelineLine} />
              {items.map((item, i) => {
                const isLeft = i % 2 === 0;
                const color = TIMELINE_COLORS[i % 2];
                return (
                  <div
                    key={item.id}
                    ref={(el) => { timelineRef.current[i] = el; }}
                    className={`${css.timelineItem} ${isLeft ? css.timelineLeft : css.timelineRight}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Number circle on the line */}
                    <div className={css.timelineNum} style={{ background: color.numBg }}>
                      {i + 1}
                    </div>
                    {/* Card */}
                    <div
                      className={css.timelineCard}
                      style={{
                        background: color.bg,
                        borderColor: color.border,
                      }}
                    >
                      <div className={css.timelineArrow} style={{ borderColor: `transparent ${isLeft ? color.bg : "transparent"} transparent ${isLeft ? "transparent" : color.bg}` }} />
                      <p className={css.timelineText} style={{ color: color.text }}>
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><AuditOutlined /></div>
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
