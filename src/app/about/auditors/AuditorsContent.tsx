"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CrownOutlined,
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SolutionOutlined,
  PrinterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import css from "./AuditorsContent.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "สารจากประธานฯ", href: "/about/chairman-message", icon: <CrownOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "ผู้ตรวจสอบ", href: "/about/auditors", icon: <SearchOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface Auditor {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  order: number;
}

export default function AuditorsContent() {
  const pathname = usePathname();
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/auditors")
      .then((res) => res.json())
      .then((data) => setAuditors((data.auditors || []).sort((a: Auditor, b: Auditor) => a.order - b.order)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll animation
  useEffect(() => {
    if (auditors.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.cardVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
    );

    cardsRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [auditors]);

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
          <span className={css.breadcrumbCurrent}>ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ</span>

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
            <h1 className={css.pageTitle}>ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : auditors.length > 0 ? (
            <div className={css.cardsGrid}>
              {auditors.map((auditor, i) => (
                <div
                  key={auditor.id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={css.card}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className={css.cardGlow} />
                  <div className={css.cardImageWrap}>
                    <div className={css.cardRing}>
                      <div className={css.cardImageInner}>
                        {auditor.imageUrl ? (
                          <img
                            src={auditor.imageUrl}
                            alt={auditor.name}
                            className={css.cardImg}
                          />
                        ) : (
                          <div className={css.cardImgPlaceholder}>
                            <TeamOutlined />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={css.cardInfo}>
                    <h3 className={css.cardName}>{auditor.name}</h3>
                    <span className={css.cardPosition}>{auditor.position}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><SearchOutlined /></div>
              <p className={css.emptyText}>ยังไม่มีข้อมูล — กรุณาเพิ่มผ่านระบบ Admin</p>
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
