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
    // Target a wrapper, NOT body, because CSS `filter` makes its element a
    // containing block for fixed-position descendants — applying it to body
    // would break modal/popup centering. Portaled dialogs live outside this
    // wrapper, so they keep their viewport-anchored positioning.
    const target = document.getElementById("mourning-target");
    if (!target) return;
    const intensity = Math.min(100, Math.max(0, data.intensity));
    const filterValue = `grayscale(${intensity}%)`;
    const previousFilter = target.style.filter;
    target.style.filter = filterValue;
    // Also expose the filter as a CSS var so portaled popups can opt in
    // without re-creating the containing-block bug on body/html.
    document.documentElement.style.setProperty("--mourning-filter", filterValue);
    return () => {
      target.style.filter = previousFilter;
      document.documentElement.style.removeProperty("--mourning-filter");
    };
  }, [data?.active, data?.intensity]);

  if (!data?.active || !data.bannerText) return null;

  return (
    <div className={styles.banner} role="status" aria-label="ประกาศไว้อาลัย">
      <span className={styles.text}>{data.bannerText}</span>
    </div>
  );
}
