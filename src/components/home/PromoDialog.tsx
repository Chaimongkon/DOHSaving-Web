"use client";

import React, { useState, useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";
import css from "./PromoDialog.module.css";

interface NotificationData {
  id: number;
  imagePath: string | null;
  urlLink: string | null;
}

export default function PromoDialog() {
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // ดึงข้อมูล popup จาก API
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: NotificationData[]) => {
        if (data.length > 0) {
          setNotifications(data);
          // แสดง popup หลังโหลดข้อมูลเสร็จ — delay 1 วินาที
          setTimeout(() => setVisible(true), 1000);
        }
      })
      .catch(() => {
        // ถ้า API error ไม่แสดง popup
      });
  }, []);

  const handleClose = () => {
    // ถ้ามีหลาย notification — แสดงตัวถัดไป
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setVisible(false);
    }
  };

  if (!visible || notifications.length === 0) return null;

  const current = notifications[currentIndex];

  // Content ภาพ — ถ้ามี urlLink ให้คลิกได้
  const imageContent = current.imagePath ? (
    <img
      src={current.imagePath}
      alt="ประชาสัมพันธ์"
      className={css.promoImage}
      draggable={false}
    />
  ) : null;

  return (
    <div className={css.overlay} onClick={handleClose}>
      <div className={css.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Close X */}
        <button className={css.closeBtn} onClick={handleClose} aria-label="ปิด">
          <CloseOutlined />
        </button>

        {/* Image content */}
        <div className={css.imageBody}>
          {current.urlLink ? (
            <a
              href={current.urlLink}
              target="_blank"
              rel="noopener noreferrer"
              className={css.imageLink}
            >
              {imageContent}
            </a>
          ) : (
            imageContent
          )}
        </div>

        {/* Footer — counter + close */}
        <div className={css.footer}>
          {notifications.length > 1 && (
            <span className={css.counter}>
              {currentIndex + 1} / {notifications.length}
            </span>
          )}
          <button className={css.footerClose} onClick={handleClose}>
            <CloseOutlined />
            {currentIndex < notifications.length - 1 ? "ถัดไป" : "ปิด"}
          </button>
        </div>
      </div>
    </div>
  );
}
