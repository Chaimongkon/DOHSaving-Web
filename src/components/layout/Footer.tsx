"use client";

import React from "react";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  PrinterOutlined,
  MailOutlined,
  FacebookFilled,
  MessageFilled,
  DownloadOutlined,
  RightOutlined,
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
  return (
    <footer className={css.footer}>
      <div className={css.top}>
        {/* Column 1 — Brand + Contact */}
        <div>
          <div className={css.brand}>
            <Image
              src="/logo.svg"
              alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
              width={48}
              height={48}
            />
            <h3 className={css.brandName}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</h3>
          </div>
          <p className={css.brandDesc}>
            บริการเงินฝาก สินเชื่อ และสวัสดิการสมาชิก
            ด้วยระบบที่ทันสมัยและโปร่งใส ให้บริการมากว่า 50 ปี
          </p>
          <div className={css.contactList}>
            <div className={css.contactItem}>
              <EnvironmentOutlined className={css.contactIcon} />
              <span>ถนนศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กทม. 10400</span>
            </div>
            <div className={css.contactItem}>
              <PhoneOutlined className={css.contactIcon} />
              <span>02-354-6827</span>
            </div>
            <div className={css.contactItem}>
              <PrinterOutlined className={css.contactIcon} />
              <span>02-354-6833</span>
            </div>
            <div className={css.contactItem}>
              <MailOutlined className={css.contactIcon} />
              <span>dohsaving@gmail.com</span>
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
          </div>

          <h4 className={css.socialTitle}>ดาวน์โหลดแอป</h4>
          <a href="#download-app" className={css.appCard}>
            <div className={css.appIcon}>D</div>
            <div className={css.appText}>
              <span className={css.appTextTitle}>
                <DownloadOutlined /> DOH Saving App
              </span>
              ตรวจยอด ทำธุรกรรม ได้ทุกที่ 24 ชม.
            </div>
          </a>
        </div>
      </div>

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
