"use client";

import React, { useState, useEffect } from "react";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  PrinterOutlined,
  MailOutlined,
  FacebookFilled,
  MessageFilled,
  DownloadOutlined,
  RightOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import css from "./Footer.module.css";

const quickLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "ข่าวประชาสัมพันธ์", href: "/news" },
  { label: "อัตราดอกเบี้ย", href: "/interest-rates" },
  { label: "แบบฟอร์มดาวน์โหลด", href: "/downloads/forms" },
  { label: "ข้อบังคับ/ระเบียบ", href: "/downloads/regulations" },
  { label: "ถาม-ตอบ", href: "/qna" },
];

const serviceLinks = [
  { label: "บริการเงินฝาก", href: "/services/deposit" },
  { label: "บริการเงินกู้", href: "/services/loan" },
  { label: "สวัสดิการสมาชิก", href: "/services/welfare" },
  { label: "สมัครสมาชิก", href: "/services/application" },
  { label: "ร้องเรียน", href: "/complaints" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Footer() {
  const [stats, setStats] = useState<{ total: number; today: number } | null>(null);

  useEffect(() => {
    fetch("/api/visitor-stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <footer className={css.footer}>
      <div className={css.top}>
        {/* Column 1 — Brand + Contact */}
        <div>
          <div className={css.brand}>
          <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={52}
            height={52}
          />
            <h3 className={css.brandName}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</h3>
          </div>
          <p className={css.brandDesc}>
            เป็นสหกรณ์ที่มั่นคง ดำรงหลักธรรมาภิบาล จัดการด้วยเทคโนโลยีทันสมัย ใส่ใจสมาชิกและสังคม
          </p>
          <div className={css.contactList}>
            <div className={css.contactItem}>
              <EnvironmentOutlined className={css.contactIcon} />
              <span>2/486 อาคาร 26 ถนนศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กทม. 10400</span>
            </div>
            <div className={css.contactItem}>
              <PhoneOutlined className={css.contactIcon} />
              <span>02-644-4633 ต่อ 205</span>
            </div>
            <div className={css.contactItem}>
              <PrinterOutlined className={css.contactIcon} />
              <span>02-354-5717</span>
            </div>
            <div className={css.contactItem}>
              <MailOutlined className={css.contactIcon} />
              <span>dohcoop@hotmail.com</span>
            </div>
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div>
          <h4 className={css.colTitle}>ลิงก์ด่วน</h4>
          <div className={css.linkList}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={css.link}>
                <RightOutlined className={css.linkArrow} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3 — Services */}
        <div>
          <h4 className={css.colTitle}>บริการ</h4>
          <div className={css.linkList}>
            {serviceLinks.map((link) => (
              <Link key={link.href} href={link.href} className={css.link}>
                <RightOutlined className={css.linkArrow} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 4 — Social + App */}
        <div>
          <h4 className={css.colTitle}>ติดตามเรา</h4>
          <div className={css.socialRow}>
            <a
              href="https://www.facebook.com/DOHSaving"
              target="_blank"
              rel="noopener noreferrer"
              className={`${css.socialBtn} ${css.socialFb}`}
              aria-label="Facebook"
            >
              <FacebookFilled />
            </a>
            <a
              href="https://line.me/R/ti/p/@dohsaving"
              target="_blank"
              rel="noopener noreferrer"
              className={`${css.socialBtn} ${css.socialLine}`}
              aria-label="LINE"
            >
              <MessageFilled />
            </a>
                        <a
              href="https://line.me/R/ti/p/@dohsaving"
              target="_blank"
              rel="noopener noreferrer"
              className={`${css.socialBtn} ${css.socialLine}`}
              aria-label="LINE"
            >
              <MessageFilled />
            </a>
                        <a
              href="https://line.me/R/ti/p/@dohsaving"
              target="_blank"
              rel="noopener noreferrer"
              className={`${css.socialBtn} ${css.socialLine}`}
              aria-label="LINE"
            >
              <MessageFilled />
            </a>
          </div>

          <h4 className={css.socialTitle}>ดาวน์โหลดแอป</h4>
          <a href="#download-app" className={css.appCard}>
            <div className={css.appIcon}>          
              <img
              src="/images/logo/logoapp.png"
              alt="DOH Saving App"
              className={css.iconImg}
            /></div>
            <div className={css.appText}>
              <span className={css.appTextTitle}>
                <DownloadOutlined /> DOH Saving App
              </span>
              ตรวจยอด ทำธุรกรรม ได้ 24 ชม.
            </div>
          </a>
        </div>
      </div>

      {/* Visitor stats bar */}
      {stats && (
        <div className={css.visitorBar}>
          <div className={css.visitorInner}>
            <div className={css.visitorItem}>
              <EyeOutlined className={css.visitorIcon} />
              <span>เข้าชมวันนี้</span>
              <strong className={css.visitorCount}>{stats.today.toLocaleString()}</strong>
            </div>
            <div className={css.visitorDivider} />
            <div className={css.visitorItem}>
              <TeamOutlined className={css.visitorIcon} />
              <span>ผู้เข้าชมทั้งหมด</span>
              <strong className={css.visitorCount}>{stats.total.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className={css.bottom}>
        <div className={css.bottomInner}>
          <span className={css.copyright}>
            © {new Date().getFullYear()} สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — สงวนลิขสิทธิ์
          </span>
          <div className={css.bottomLinks}>
            <Link href="/privacy-policy" className={css.bottomLink}>
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className={css.bottomLink}>
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
