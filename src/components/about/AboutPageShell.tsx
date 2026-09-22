"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HistoryOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SolutionOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import css from "./AboutPageShell.module.css";

const sidebarLinks = [
  { label: "ประวัติสหกรณ์", href: "/about/history", icon: <HistoryOutlined /> },
  { label: "วิสัยทัศน์และพันธกิจ", href: "/about/vision", icon: <EyeOutlined /> },
  { label: "จรรยาบรรณคณะกรรมการ", href: "/about/ethics-board", icon: <AuditOutlined /> },
  { label: "จรรยาบรรณเจ้าหน้าที่", href: "/about/ethics-staff", icon: <SolutionOutlined /> },
  { label: "นโยบายสหกรณ์", href: "/about/policy", icon: <SafetyCertificateOutlined /> },
  { label: "คณะกรรมการ", href: "/about/board", icon: <TeamOutlined /> },
  { label: "โครงสร้างองค์กร", href: "/about/organization", icon: <BankOutlined /> },
];

export interface AboutPageShellProps {
  breadcrumbLabel: string;
  /** ข้อความภาษาอังกฤษตัวเล็กเหนือหัวเรื่อง เช่น "CODE OF CONDUCT" */
  eyebrow: string;
  title: string;
  /** ย่อหน้านำใน hero — อธิบายว่าหน้านี้คืออะไร ทำไมสมาชิกต้องอ่าน */
  lead: string;
  /** ป้ายใต้ย่อหน้านำ เช่น จำนวนข้อ — ไม่ส่งก็ไม่แสดง */
  badge?: React.ReactNode;
  /** ภาพ hero ใน public/ — ถ้าไม่มีไฟล์จะ fallback ไปใช้ emblem */
  heroImage: string;
  heroImageAlt: string;
  /** ตราสัญลักษณ์ SVG สำรอง ใช้เมื่อยังไม่มีไฟล์ภาพ */
  emblem: React.ReactNode;
  children: React.ReactNode;
}

/** โครงร่วมของหมวด "เกี่ยวกับสหกรณ์ฯ": breadcrumb · hero · เนื้อหา · sidebar */
export default function AboutPageShell({
  breadcrumbLabel,
  eyebrow,
  title,
  lead,
  badge,
  heroImage,
  heroImageAlt,
  emblem,
  children,
}: AboutPageShellProps) {
  const pathname = usePathname();
  const [heroImageOk, setHeroImageOk] = useState(false);

  /* เช็คว่ามีไฟล์ภาพ hero จริงไหมก่อนค่อยแสดง — ใช้ preload แทน onError
     เพราะ <img> ถูก SSR มาก่อน React hydrate ทำให้ event error หลุดไปแล้ว */
  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => setHeroImageOk(true);
    probe.src = heroImage;
    return () => { probe.onload = null; };
  }, [heroImage]);

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

          <button className={css.printBtn} onClick={() => window.print()} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className={css.hero}>
        <div className={css.heroGlowGold} />
        <div className={css.heroGlowOrange} />
        <div className={css.heroGrid} />

        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <p className={css.heroEyebrow}>
              <span className={css.heroEyebrowRule} />
              {eyebrow}
            </p>
            <h1 className={css.heroTitle}>{title}</h1>
            <p className={css.heroOrg}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
            <p className={css.heroLead}>{lead}</p>
            {badge && <span className={css.heroBadge}>{badge}</span>}
          </div>

          <div className={css.heroArt}>
            <div className={css.heroArtFrame}>
              {heroImageOk ? (
                <Image
                  src={heroImage}
                  alt={heroImageAlt}
                  width={520}
                  height={520}
                  className={css.heroArtImg}
                  sizes="(max-width: 860px) 190px, 360px"
                  priority
                />
              ) : (
                emblem
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className={css.wrapper}>
        <div className={css.main}>{children}</div>

        <aside className={css.sidebar}>
          <nav className={css.sidebarCard} aria-label="เกี่ยวกับสหกรณ์ฯ">
            <h2 className={css.sidebarTitle}>เกี่ยวกับสหกรณ์ฯ</h2>
            <ul className={css.sidebarNav}>
              {sidebarLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${css.sidebarLink} ${active ? css.sidebarLinkActive : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={css.sidebarLinkIcon} aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}

/** หัวข้อ section พร้อมเส้นส้ม-ทองด้านล่าง */
export function AboutSectionHead({ title, id }: { title: string; id?: string }) {
  return (
    <div className={css.sectionHead}>
      <h2 className={css.sectionTitle} id={id}>{title}</h2>
      <span className={css.sectionRule} />
    </div>
  );
}

export function AboutLoading() {
  return <div className={css.loading}>กำลังโหลด...</div>;
}

export function AboutEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className={css.empty}>
      <div className={css.emptyIcon}>{icon}</div>
      <p className={css.emptyText}>{text}</p>
    </div>
  );
}
