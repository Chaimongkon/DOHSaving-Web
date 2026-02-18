"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import css from "./PromoDialog.module.css";

interface NotificationData {
  id: number;
  imagePath: string | null;
  urlLink: string | null;
}

const DISMISS_KEY = "promo_dismiss_date";

function isDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(DISMISS_KEY);
  if (!saved) return false;
  const today = new Date().toISOString().slice(0, 10);
  return saved === today;
}

function dismissToday() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DISMISS_KEY, today);
}

export default function PromoDialog() {
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isDismissedToday()) return;

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: NotificationData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
          setTimeout(() => setVisible(true), 1000);
        }
      })
      .catch(() => {});
  }, []);

  const goTo = useCallback((idx: number, dir: "next" | "prev") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setAnimating(false);
    }, 250);
  }, [animating]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, "prev");
  }, [currentIndex, goTo]);

  const handleNext = useCallback(() => {
    if (currentIndex < notifications.length - 1) goTo(currentIndex + 1, "next");
  }, [currentIndex, notifications.length, goTo]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleDismissToday = useCallback(() => {
    dismissToday();
    setVisible(false);
  }, []);

  const trackClick = useCallback((id: number) => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  if (!visible || notifications.length === 0) return null;

  const current = notifications[currentIndex];
  const hasMultiple = notifications.length > 1;

  const imageContent = current.imagePath ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current.imagePath}
      alt="ประชาสัมพันธ์"
      className={`${css.promoImage} ${animating ? (direction === "next" ? css.slideOutLeft : css.slideOutRight) : css.slideIn}`}
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
              onClick={() => trackClick(current.id)}
            >
              {imageContent}
            </a>
          ) : (
            imageContent
          )}
        </div>

        {/* Nav arrows (if multiple) */}
        {hasMultiple && (
          <>
            <button
              className={`${css.navArrow} ${css.navPrev}`}
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="ก่อนหน้า"
            >
              <LeftOutlined />
            </button>
            <button
              className={`${css.navArrow} ${css.navNext}`}
              onClick={handleNext}
              disabled={currentIndex === notifications.length - 1}
              aria-label="ถัดไป"
            >
              <RightOutlined />
            </button>
          </>
        )}

        {/* Footer — dots + dismiss */}
        <div className={css.footer}>
          {hasMultiple && (
            <div className={css.dots}>
              {notifications.map((_, i) => (
                <button
                  key={i}
                  className={`${css.dot} ${i === currentIndex ? css.dotActive : ""}`}
                  onClick={() => goTo(i, i > currentIndex ? "next" : "prev")}
                  aria-label={`ภาพ ${i + 1}`}
                />
              ))}
            </div>
          )}
          <button className={css.footerClose} onClick={handleDismissToday}>
            ไม่แสดงอีกวันนี้
          </button>
        </div>
      </div>
    </div>
  );
}
