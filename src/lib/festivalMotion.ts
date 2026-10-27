"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * การเคลื่อนไหวของธีมเทศกาล — กติกาเดียวกันทุกส่วน (ไอคอนตก, Animation, Effect, ของตกแต่งที่ขยับ)
 *
 *   - ผู้ชมกด "ปิดเอฟเฟกต์" ได้ (จำไว้ในเครื่องนั้น) · เครื่องที่ตั้ง "ลดการเคลื่อนไหว" ไว้ = ปิดเอง
 *   - ของที่ขยับแสดงเฉพาะหน้าแรก — หน้าอื่นเหลือสี/ฉาก ไม่รบกวนการอ่านหรือกรอกข้อมูล
 *   - เปิดหน้ามาเต็มที่ช่วงแรก แล้วสงบลงเอง (CALM_AFTER_MS)
 *   - มือถือ: ไม่มีตัวการ์ตูนวิ่งผ่าน ไอคอนน้อยลงและอยู่ที่ขอบจอ
 */
export const CALM_AFTER_MS = 25_000;
const OFF_KEY = "festival-motion-off";

/** ธีมนี้มีของที่ขยับหรือไม่ (ใช้ตัดสินว่าจะแสดงปุ่ม "ปิดเอฟเฟกต์") */
export const hasFestivalMotion = (f: Record<string, unknown> | null | undefined) =>
  Boolean(
    f &&
      ((f.effect && f.effect !== "none") ||
        f.effectUrl ||
        (f.animation && f.animation !== "none") ||
        f.animationUrl ||
        (f.iconMode && f.iconMode !== "none" && f.iconUrls))
  );

const listeners = new Set<() => void>();

function readOff(): boolean {
  try {
    return window.localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

/** ผู้ชมปิด/เปิดเอฟเฟกต์ — ใส่ data-festival-motion="off" ที่ <html> ให้ CSS หยุดของตกแต่งที่ขยับด้วย */
export function setFestivalMotionOff(off: boolean) {
  try {
    if (off) window.localStorage.setItem(OFF_KEY, "1");
    else window.localStorage.removeItem(OFF_KEY);
  } catch {
    /* โหมดส่วนตัว — ใช้ได้เฉพาะหน้านี้ */
  }
  syncMotionAttr(off);
  listeners.forEach((l) => l());
}

function syncMotionAttr(off: boolean) {
  if (off) document.documentElement.dataset.festivalMotion = "off";
  else delete document.documentElement.dataset.festivalMotion;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === OFF_KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

/** ผู้ชมปิดเอฟเฟกต์ไว้หรือไม่ */
export function useFestivalMotionOff(): boolean {
  const off = useSyncExternalStore(subscribe, readOff, () => false);
  useEffect(() => {
    syncMotionAttr(off);
  }, [off]);
  return off;
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (l) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", l);
      return () => m.removeEventListener("change", l);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const useIsMobile = () => useMedia("(max-width: 768px)");
export const usePrefersReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

/** true หลังเปิดหน้าไปแล้ว CALM_AFTER_MS — ใช้ลดจำนวน/ความถี่ของที่ขยับ */
export function useCalm(): boolean {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setCalm(true), CALM_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);
  return calm;
}
