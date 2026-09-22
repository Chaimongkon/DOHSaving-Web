"use client";

import { useEffect, useState } from "react";
import styles from "./MourningMode.module.css";

interface MourningModeData {
  active: boolean;
  intensity: number;
  bannerText: string;
}

export default function MourningMode() {
  const [data, setData] = useState<MourningModeData | null>(null);

  useEffect(() => {
    fetch("/api/mourning-mode")
      .then((res) => res.json())
      .then((d: MourningModeData) => setData(d))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (!data?.active) return;
    // Apply to <html>, not body or a wrapper: a CSS `filter` normally makes its
    // element the containing block for position:fixed descendants, which drags
    // every modal/lightbox/mega-menu off the viewport. The spec exempts the
    // root element from that rule, so on <html> fixed elements stay
    // viewport-anchored and portaled dialogs are desaturated too — no per-
    // component opt-in needed.
    const root = document.documentElement;
    const intensity = Math.min(100, Math.max(0, data.intensity));
    const previousFilter = root.style.filter;
    root.style.filter = `grayscale(${intensity}%)`;
    return () => {
      root.style.filter = previousFilter;
    };
  }, [data?.active, data?.intensity]);

  if (!data?.active || !data.bannerText) return null;

  return (
    <div className={styles.banner} role="status" aria-label="ประกาศไว้อาลัย">
      <span className={styles.text}>{data.bannerText}</span>
    </div>
  );
}
