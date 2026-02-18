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
} from "@ant-design/icons";
import css from "./BoardContent.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "สารจากประธานฯ", href: "/about/chairman-message", icon: <CrownOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface BoardMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const TIER_LABELS: Record<number, string> = {
  1: "ประธานกรรมการดำเนินการ",
  2: "รองประธานกรรมการ",
  3: "เหรัญญิก / เลขานุการ",
  4: "กรรมการ",
};

const TIER_COLORS: Record<number, { gradient: string; shadow: string }> = {
  1: { gradient: "linear-gradient(135deg, #E8652B, #f59e0b)", shadow: "rgba(232,101,43,0.3)" },
  2: { gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)", shadow: "rgba(59,130,246,0.25)" },
  3: { gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", shadow: "rgba(139,92,246,0.25)" },
  4: { gradient: "linear-gradient(135deg, #0d9488, #14b8a6)", shadow: "rgba(13,148,136,0.25)" },
};

export default function BoardContent() {
  const pathname = usePathname();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const tiersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/board-members")
      .then((res) => res.json())
      .then((data) => setMembers(data.members || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll animation
  useEffect(() => {
    if (members.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.tierVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    tiersRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [members]);

  const handlePrint = () => window.print();

  // Group by tier and sort
  const tiers = [1, 2, 3, 4]
    .map((tier) => ({
      tier,
      label: TIER_LABELS[tier],
      color: TIER_COLORS[tier],
      members: members
        .filter((m) => m.tier === tier)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((t) => t.members.length > 0);

  return (
    <>
      {/* Breadcrumb bar */}
      <div className={css.breadcrumbBar}>
        <div className={css.breadcrumbInner}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbLink}>เกี่ยวกับสหกรณ์ฯ</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>คณะกรรมการดำเนินการ</span>

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
            <div className={css.titleBadge}><TeamOutlined /></div>
            <h1 className={css.pageTitle}>คณะกรรมการดำเนินการ</h1>
            <p className={css.pageSubtitle}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            {members.length > 0 && (
              <span className={css.countBadge}>ทั้งหมด {members.length} ท่าน</span>
            )}
          </div>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : tiers.length > 0 ? (
            <div className={css.orgChart}>
              {tiers.map((tierGroup, idx) => (
                <div
                  key={tierGroup.tier}
                  ref={(el) => { tiersRef.current[idx] = el; }}
                  className={css.tierSection}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Tier label */}
                  <div className={css.tierLabel}>
                    <span
                      className={css.tierLabelText}
                      style={{ background: tierGroup.color.gradient }}
                    >
                      {tierGroup.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {idx > 0 && <div className={css.connector} />}

                  {/* Members row */}
                  <div className={css.membersRow}>
                    {tierGroup.members.map((member) => (
                      <div key={member.id} className={css.memberCard}>
                        <div
                          className={css.memberImageRing}
                          style={{
                            background: tierGroup.color.gradient,
                            boxShadow: `0 6px 20px ${tierGroup.color.shadow}`,
                          }}
                        >
                          <div className={css.memberImageInner}>
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                className={css.memberImg}
                              />
                            ) : (
                              <div className={css.memberImgPlaceholder}>
                                <TeamOutlined />
                              </div>
                            )}
                          </div>
                        </div>
                        <h3 className={css.memberName}>{member.name}</h3>
                        <p className={css.memberPosition}>{member.position}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><TeamOutlined /></div>
              <p className={css.emptyText}>ยังไม่มีข้อมูลกรรมการ — กรุณาเพิ่มผ่านระบบ Admin</p>
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
