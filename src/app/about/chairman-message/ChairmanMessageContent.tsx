"use client";

import React, { useState, useEffect } from "react";
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
import css from "./ChairmanMessageContent.module.css";

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

interface ChairmanData {
  portraitUrl: string;
  messageUrl: string;
  name: string;
  title: string;
}

export default function ChairmanMessageContent() {
  const pathname = usePathname();
  const [data, setData] = useState<ChairmanData>({
    portraitUrl: "",
    messageUrl: "",
    name: "",
    title: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chairman-message")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  const hasData = data.portraitUrl || data.messageUrl;

  return (
    <>
      {/* Breadcrumb bar */}
      <div className={css.breadcrumbBar}>
        <div className={css.breadcrumbInner}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbLink}>เกี่ยวกับสหกรณ์ฯ</span>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>สารจากประธานฯ</span>

          <button className={css.printBtn} onClick={handlePrint} title="พิมพ์หน้านี้">
            <PrinterOutlined /> พิมพ์
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={css.wrapper}>
        {/* Main content */}
        <div className={css.main}>
          {loading ? (
            <div className={css.loading}>กำลังโหลด...</div>
          ) : hasData ? (
            <div className={css.content}>
              {/* Portrait Hero */}
              {data.portraitUrl && (
                <div className={css.portraitSection}>
                  <div className={css.portraitBg} />
                  <div className={css.portraitBg2} />
                  <div className={css.portraitInner}>
                    <div className={css.portraitFrame}>
                      <img
                        src={data.portraitUrl}
                        alt={data.name || "ประธานกรรมการ"}
                        className={css.portraitImg}
                      />
                    </div>
                    <div className={css.portraitInfo}>
                      <div className={css.portraitBadge}>
                        <CrownOutlined /> สารจากประธานกรรมการดำเนินการ
                      </div>
                      {data.name && (
                        <h1 className={css.portraitName}>{data.name}</h1>
                      )}
                      {data.title && (
                        <p className={css.portraitTitle}>{data.title}</p>
                      )}
                      <p className={css.portraitOrg}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Letter */}
              {data.messageUrl && (
                <div className={css.messageSection}>
                  <div className={css.messageCard}>
                    <div className={css.messageHeader}>
                      <div className={css.messageDivider} />
                      <span className={css.messageLabel}>สารจากประธานกรรมการดำเนินการ</span>
                      <div className={css.messageDivider} />
                    </div>
                    <div className={css.messageImageWrap}>
                      <img
                        src={data.messageUrl}
                        alt="สารจากประธาน"
                        className={css.messageImg}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={css.empty}>
              <div className={css.emptyIcon}><CrownOutlined /></div>
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
