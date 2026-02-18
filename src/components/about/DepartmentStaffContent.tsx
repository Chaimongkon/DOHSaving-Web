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
  order: number;
}

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
        setStaff((data.staff || []).sort((a: StaffMember, b: StaffMember) => a.order - b.order))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deptKey]);

  // Scroll animation
  useEffect(() => {
    if (staff.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.cardVisible);
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
            <div className={css.staffGrid}>
              {staff.map((member, i) => (
                <div
                  key={member.id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={css.staffCard}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={css.cardRing}>
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
