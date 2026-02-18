"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PictureOutlined,
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SolutionOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import css from "./InfographicPageLayout.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

interface InfographicPageLayoutProps {
  pageKey: string;
  breadcrumbLabel: string;
  pageTitle: string;
}

export default function InfographicPageLayout({
  pageKey,
  breadcrumbLabel,
  pageTitle,
}: InfographicPageLayoutProps) {
  const pathname = usePathname();
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${pageKey}/images`)
      .then((res) => res.json())
      .then((data) => setImage(data.image || ""))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageKey]);

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
          <span className={css.breadcrumbCurrent}>{breadcrumbLabel}</span>

          <button className={css.printBtn} onClick={handlePrint} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={css.wrapper}>
        {/* Main content */}
        <div className={css.main}>
          <h1 className={css.pageTitle}>{pageTitle}</h1>

          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : image ? (
            <div className={css.imageWrap}>
              <img src={image} alt={pageTitle} className={css.image} />
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><PictureOutlined /></div>
              <p className={css.emptyText}>ยังไม่มีรูป Infographic — กรุณาเพิ่มผ่านระบบ Admin</p>
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
