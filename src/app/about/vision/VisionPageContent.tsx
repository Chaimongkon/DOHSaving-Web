"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartOutlined,
  EyeOutlined,
  CompassOutlined,
  HistoryOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SolutionOutlined,
  PrinterOutlined,
  DollarOutlined,
  LaptopOutlined,
  GiftOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import css from "./VisionPageContent.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface MissionItem {
  id: string;
  text: string;
}

interface VisionData {
  coreValues: string;
  vision: string;
  missions: MissionItem[];
}

const MISSION_COLORS = [
  "linear-gradient(135deg, #E8652B, #f59e0b)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #10b981, #34d399)",
  "linear-gradient(135deg, #8b5cf6, #a855f7)",
  "linear-gradient(135deg, #f43f5e, #fb7185)",
  "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
];

const MISSION_ICONS = [
  <TeamOutlined key="m1" />,
  <DollarOutlined key="m2" />,
  <LaptopOutlined key="m3" />,
  <GiftOutlined key="m4" />,
  <GlobalOutlined key="m5" />,
  <SafetyCertificateOutlined key="m6" />,
  <CompassOutlined key="m7" />,
];

export default function VisionPageContent() {
  const pathname = usePathname();
  const [data, setData] = useState<VisionData>({ coreValues: "", vision: "", missions: [] });
  const [loading, setLoading] = useState(true);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/vision-data")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll animation for sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.sectionVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    sectionsRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [data]);

  // Scroll animation for mission cards
  useEffect(() => {
    if (data.missions.length === 0) return;

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
  }, [data.missions]);

  const handlePrint = () => window.print();

  const coreValueLines = data.coreValues
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hasData = data.coreValues || data.vision || data.missions.length > 0;

  return (
    <>
      {/* Breadcrumb bar */}
      <div className={css.breadcrumbBar}>
        <div className={css.breadcrumbInner}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbLink}>เกี่ยวกับสหกรณ์ฯ</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>วิสัยทัศน์และพันธกิจ</span>

          <button className={css.printBtn} onClick={handlePrint} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={css.wrapper}>
        {/* Main content */}
        <div className={css.main}>
          <div className={css.pageHeader}>
            <h1 className={css.pageTitle}>ค่านิยม วิสัยทัศน์ พันธกิจ</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : hasData ? (
            <div className={css.sections}>
              {/* ค่านิยม */}
              {coreValueLines.length > 0 && (
                <div
                  ref={(el) => { sectionsRef.current[0] = el; }}
                  className={css.coreValuesSection}
                >
                  <div className={css.sectionHeader}>
                    <div className={css.coreValuesIconLg}><HeartOutlined /></div>
                    <p className={css.sectionLabel}>CORE VALUES</p>
                    <h2 className={css.sectionTitlePink}>ค่านิยม</h2>
                  </div>
                  <div className={css.coreValuesGrid}>
                    {coreValueLines.map((line, i) => (
                      <div key={i} className={css.coreValueCard}>
                        <div className={css.coreValueCardBg} />
                        <div className={css.coreValueCardInner}>
                          <div className={css.coreValueNum}>{i + 1}</div>
                          <div className={css.coreValueText}>{line}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* วิสัยทัศน์ */}
              {data.vision && (
                <div
                  ref={(el) => { sectionsRef.current[1] = el; }}
                  className={css.visionCard}
                >
                  <div className={css.visionBgCircle1} />
                  <div className={css.visionBgCircle2} />
                  <div className={css.visionBgCircle3} />
                  <div className={css.visionContent}>
                    <div className={css.visionIconLg}><EyeOutlined /></div>
                    <p className={css.visionLabel}>VISION</p>
                    <h2 className={css.visionTitle}>วิสัยทัศน์</h2>
                    <div className={css.visionQuote}>
                      <span className={css.quoteOpen}>&ldquo;</span>
                      <p className={css.visionText}>{data.vision}</p>
                      <span className={css.quoteClose}>&rdquo;</span>
                    </div>
                  </div>
                </div>
              )}

              {/* พันธกิจ */}
              {data.missions.length > 0 && (
                <div
                  ref={(el) => { sectionsRef.current[2] = el; }}
                  className={css.missionSection}
                >
                  <div className={css.missionHeader}>
                    <div className={css.missionIcon}><CompassOutlined /></div>
                    <p className={css.missionLabel}>MISSION</p>
                    <h2 className={css.missionTitle}>พันธกิจ</h2>
                  </div>
                  <div className={css.missionGrid}>
                    {data.missions.map((m, i) => {
                      const gradient = MISSION_COLORS[i % MISSION_COLORS.length];
                      const icon = MISSION_ICONS[i % MISSION_ICONS.length];
                      const isLast = data.missions.length % 2 === 1 && i === data.missions.length - 1;
                      return (
                        <div
                          key={m.id}
                          ref={(el) => { cardsRef.current[i] = el; }}
                          className={`${css.missionCard} ${isLast ? css.missionCardFull : ""}`}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className={css.missionNum} style={{ background: gradient }}>
                            {i + 1}
                          </div>
                          <div className={css.missionCardText}>
                            {m.text}
                          </div>
                          <div className={css.missionCardIcon} style={{ color: "#d1d5db" }}>
                            {icon}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><EyeOutlined /></div>
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
