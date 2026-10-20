"use client";

import { useEffect } from "react";
import { SEARCH_MIN_LENGTH, normalizeSearchTerm, type SiteEventType } from "@/lib/siteEventTypes";

/**
 * ส่งเหตุการณ์ไปนับที่ /api/events
 * ใช้ sendBeacon เพราะการดาวน์โหลด/เปิดแท็บใหม่อาจทำให้ fetch ปกติถูกยกเลิกกลางทาง
 */
export function trackEvent(type: SiteEventType, target: string | number, meta?: string) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ type, target: String(target), meta });
    const sent = navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* นับไม่ได้ก็ไม่เป็นไร */
  }
}

/** ไม่นับคำเดิมซ้ำในการเปิดหน้าเว็บครั้งเดียว (พิมพ์ลบไปมา) */
const reportedMisses = new Set<string>();

/**
 * นับคำค้นที่ไม่พบผลลัพธ์ — รอให้หยุดพิมพ์ก่อน จะได้ไม่เก็บคำที่พิมพ์ค้างครึ่งคำ
 * resultCount = null ระหว่างกำลังโหลด (ยังไม่รู้ผล)
 */
export function useSearchMiss(page: string, query: string, resultCount: number | null, delayMs = 1500) {
  useEffect(() => {
    const term = normalizeSearchTerm(query);
    if (resultCount !== 0 || term.length < SEARCH_MIN_LENGTH) return;
    const key = `${page}|${term}`;
    if (reportedMisses.has(key)) return;
    const timer = window.setTimeout(() => {
      reportedMisses.add(key);
      trackEvent("search_miss", term, page);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [page, query, resultCount, delayMs]);
}

/** ครั้งเดียวต่อการเปิดหน้าเว็บ ต่อค่า (เช่น หมวดแบบฟอร์มที่เปิด) */
const reportedOnce = new Set<string>();

export function trackOnce(type: SiteEventType, target: string) {
  const key = `${type}|${target}`;
  if (reportedOnce.has(key)) return;
  reportedOnce.add(key);
  trackEvent(type, target);
}
