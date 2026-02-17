"use client";

import React, { useState, useEffect } from "react";
import {
  CloseOutlined,
  DownloadOutlined,
  AppleFilled,
  AndroidFilled,
  QrcodeOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import css from "./PromoDialog.module.css";

export default function PromoDialog() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // แสดง popup ทุกครั้งที่เปิดหน้าเว็บ/refresh — delay 1.5 วินาที
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={css.overlay} onClick={handleClose}>
      <div className={css.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Close X */}
        <button className={css.closeBtn} onClick={handleClose} aria-label="ปิด">
          <CloseOutlined />
        </button>

        {/* Header */}
        <div className={css.header}>
          <div className={css.headerLogo}>
            <Image src="/logo.svg" alt="Logo" width={36} height={36} />
            <h3 className={css.headerTitle}>สหกรณ์ออมทรัพย์ กรมทางหลวง จำกัด</h3>
          </div>
          <span className={css.headerSub}>
            DEPARTMENT OF HIGHWAY SAVING AND CREDIT CO-OPERATIVE, LTD.
          </span>
        </div>

        {/* Body */}
        <div className={css.body}>
          {/* Announcement card */}
          <div className={css.announcement}>
            <h4 className={css.announcementTitle}>
              เรียน สมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง ทุกท่าน
            </h4>
            <p className={css.announcementText}>
              บัดนี้ สหกรณ์ฯ ได้พัฒนา <span className={css.highlight}>แอปพลิเคชั่น ใหม่</span>{" "}
              ซึ่งจะทำให้สมาชิกสะดวกในการติดตามความเคลื่อนไหวทางการเงิน
              รวมถึงธุรกรรมต่างๆ โดยแอปพลิเคชั่นจะแสดงผลแบบทันที
            </p>
            <p className={css.announcementText} style={{ marginTop: 8 }}>
              จึงขอประชาสัมพันธ์ให้สมาชิกทุกท่าน{" "}
              <span className={css.highlight}>ดาวน์โหลดแอปพลิเคชั่น ใหม่</span>{" "}
              ได้ตั้งแต่บัดนี้เป็นต้นไป
            </p>
          </div>

          {/* QR Codes */}
          <div className={css.qrSection}>
            <p className={css.qrLabel}>สแกน QR Code เพื่อดาวน์โหลด</p>
            <div className={css.qrRow}>
              <div className={css.qrItem}>
                <div className={css.qrPlaceholder}>
                  <QrcodeOutlined />
                </div>
                <span className={css.qrStoreBadge}>
                  <AppleFilled /> <span>App Store</span>
                </span>
              </div>
              <div className={css.qrItem}>
                <div className={css.qrPlaceholder}>
                  <QrcodeOutlined />
                </div>
                <span className={css.qrStoreBadge}>
                  <AndroidFilled /> <span>Google Play</span>
                </span>
              </div>
              <div className={css.qrItem}>
                <div className={css.qrPlaceholder}>
                  <QrcodeOutlined />
                </div>
                <span className={css.qrStoreBadge}>
                  <span>AppGallery</span>
                </span>
              </div>
            </div>
          </div>

          {/* Download button */}
          <a href="#download-app" className={css.downloadBtn}>
            <DownloadOutlined /> DOWNLOAD NOW
          </a>
        </div>

        {/* Footer close */}
        <div className={css.footer}>
          <button className={css.footerClose} onClick={handleClose}>
            <CloseOutlined /> ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
