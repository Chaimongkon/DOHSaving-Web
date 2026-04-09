"use client";

import React, { useEffect, useState } from "react";
import styles from "./FestivalBanner.module.css";

interface BannerData {
  bannerText: string | null;
  bannerEmoji: string | null;
  bannerBg: string | null;
  bannerTextColor: string | null;
}

const STORAGE_KEY = "festival-banner-dismissed";

export default function FestivalBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already dismissed today
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    fetch("/api/festival/active")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.bannerText) {
          setBanner(data);
          // Small delay for entrance animation
          requestAnimationFrame(() => setVisible(true));
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setBanner(null), 400);
  };

  if (!banner) return null;

  const bg = banner.bannerBg || "#00bcd4";
  const textColor = banner.bannerTextColor || "#ffffff";
  const bgDark = adjustBrightness(bg, -20);
  const bgLight = adjustBrightness(bg, 12);

  return (
    <div
      className={`${styles.banner} ${visible ? styles.visible : ""}`}
      style={{
        background: `linear-gradient(135deg, ${bgLight} 0%, ${bg} 40%, ${bgDark} 100%)`,
        color: textColor,
      }}
    >
      <div className={styles.inner}>
        {banner.bannerEmoji && (
          <span className={styles.emoji}>{banner.bannerEmoji}</span>
        )}
        <span className={styles.text}>{banner.bannerText}</span>
        {banner.bannerEmoji && (
          <span className={styles.emoji}>{banner.bannerEmoji}</span>
        )}
      </div>
      <button
        className={styles.close}
        onClick={handleDismiss}
        style={{ color: textColor }}
        aria-label="ปิด"
      >
        ✕
      </button>
    </div>
  );
}

/** Darken/lighten a hex color by percent */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
