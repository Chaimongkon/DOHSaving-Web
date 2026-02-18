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
  UserOutlined,
} from "@ant-design/icons";
import css from "./DepartmentStaffContent.module.css";

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

interface StaffMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const TIER_LABELS: Record<number, string> = {
  1: "ผู้จัดการ / หัวหน้า",
  2: "อาวุโส",
  3: "เจ้าหน้าที่",
};

const TIER_COLORS: Record<number, { bg: string; shadow: string }> = {
  1: { bg: "linear-gradient(135deg, #0d9488, #0f766e)", shadow: "rgba(13,148,136,0.25)" },
  2: { bg: "linear-gradient(135deg, #0891b2, #0e7490)", shadow: "rgba(8,145,178,0.25)" },
  3: { bg: "linear-gradient(135deg, #6366f1, #4f46e5)", shadow: "rgba(99,102,241,0.25)" },
};

interface Props {
  deptKey: string;
  title: string;
  breadcrumbLabel: string;
}

export default function DepartmentStaffContent({ deptKey, title, breadcrumbLabel }: Props) {
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch(`/api/department-staff?dept=${deptKey}`)
      .then((res) => res.json())
      .then((data) =>
        setStaff(
          (data.staff || []).sort(
            (a: StaffMember, b: StaffMember) => a.tier - b.tier || a.order - b.order
          )
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deptKey]);

  // Group by tier
  const tiers = staff.reduce<Record<number, StaffMember[]>>((acc, m) => {
    const t = m.tier || 3;
    if (!acc[t]) acc[t] = [];
    acc[t].push(m);
    return acc;
  }, {});
  const tierKeys = Object.keys(tiers).map(Number).sort((a, b) => a - b);

  // Scroll animation
  useEffect(() => {
    if (staff.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.tierVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );

    cardsRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [staff]);

  const handlePrint = () => window.print();

  return (
    <>
      {/* Breadcrumb */}
      <div className={css.breadcrumbBar}>
        <div className={css.breadcrumbInner}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbLink}>เกี่ยวกับสหกรณ์ฯ</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>{breadcrumbLabel}</span>

          <button className={css.printBtn} onClick={handlePrint} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className={css.wrapper}>
        <div className={css.main}>
          <div className={css.titleSection}>
            <h1 className={css.pageTitle}>{title}</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            {staff.length > 0 && (
              <span className={css.countBadge}>ทั้งหมด {staff.length} ท่าน</span>
            )}
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : staff.length > 0 ? (
            <div className={css.orgChart}>
              {tierKeys.map((tierNum, tierIdx) => {
                const members = tiers[tierNum];
                const colors = TIER_COLORS[tierNum] || TIER_COLORS[3];
                return (
                  <React.Fragment key={tierNum}>
                    {tierIdx > 0 && <div className={css.connector} />}
                    <div
                      ref={(el) => { cardsRef.current[tierIdx] = el; }}
                      className={css.tierSection}
                    >
                      <div className={css.tierLabel}>
                        <span
                          className={css.tierLabelText}
                          style={{ background: colors.bg }}
                        >
                          {TIER_LABELS[tierNum] || `ระดับ ${tierNum}`}
                        </span>
                      </div>
                      <div className={css.membersRow}>
                        {members.map((member) => (
                          <div key={member.id} className={css.staffCard}>
                            <div
                              className={css.cardRing}
                              style={{
                                background: colors.bg,
                                boxShadow: `0 4px 16px ${colors.shadow}`,
                              }}
                            >
                              <div className={css.cardImageInner}>
                                {member.imageUrl ? (
                                  <img
                                    src={member.imageUrl}
                                    alt={member.name}
                                    className={css.cardImg}
                                  />
                                ) : (
                                  <div className={css.cardImgPlaceholder}>
                                    <UserOutlined />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={css.cardInfo}>
                              <h3 className={css.cardName}>{member.name}</h3>
                              <span className={css.cardPosition}>{member.position}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><TeamOutlined /></div>
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
