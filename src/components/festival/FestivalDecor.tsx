"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Eye, Sparkles, X } from "lucide-react";
import { exitFestivalPreview, previewLabel, resolveFestival } from "@/lib/festivalClient";
import { hasFestivalMotion, setFestivalMotionOff, useFestivalMotionOff, useIsMobile, usePrefersReducedMotion } from "@/lib/festivalMotion";
import { FESTIVAL_KITS, type FestivalKit } from "./kits";
import css from "./FestivalDecor.module.css";

/**
 * ของตกแต่งเทศกาลแบบเต็มหน้า — ทุกประเภทเทศกาลใช้ระบบเดียวกัน (ชุดของแต่ละเทศกาลอยู่ใน kits.ts)
 *
 * - เปิดเองเมื่อธีมที่ใช้อยู่ (ตั้งในเมนู Festival Theme) และโหมดไว้อาลัยไม่ได้เปิด
 * - เจ้าหน้าที่ที่ล็อกอินอยู่ดูตัวอย่างได้ (ปุ่ม "ดูตัวอย่างบนเว็บ" ในหน้า admin) — ป้ายมุมจอมีปุ่มออก
 * - ไม่แก้ดีไซน์จริง: ใส่ data-festival ที่ <html> + สลับชุดสี (design tokens) + วางภาพตกแต่งทับ
 *   ปิดธีม/หมดช่วงวันที่ → เอาออกหมด เว็บกลับเป็นแบบเดิม
 */

/** ประเภทที่มีชุดตกแต่ง (ใช้ในหน้า admin) */
export const DECOR_THEMES = Object.keys(FESTIVAL_KITS);

/** ตำแหน่งบนหน้า (px จากบนสุดของเอกสาร) ที่วัดได้จริง — ของตกแต่งอยู่ในชั้นของตัวเอง ไม่ฝังเข้าไปในเนื้อหาของหน้า
 *  (ฝังเข้าไปในส่วนที่ React ยังประกอบไม่เสร็จจะทำให้ hydration ล้มและของตกแต่งหายไป) */
type Layout = { mainTop: number; seams: number[] };

/** ของลอยบนรอยต่อแต่ละช่วงของหน้าแรก (ส่วนที่ 2 เป็นต้นไป) — สลับซ้ายขวา อยู่ที่ขอบ ไม่ทับเนื้อหา */
const SEAM_ITEMS: { side: "left" | "right"; at: string; size: number; delay: number; wideOnly?: boolean }[][] = [
  [], // ส่วนแรก (บริการ) — ไม่มีรอยต่อด้านบน
  [
    { side: "right", at: "3.5%", size: 92, delay: 0 },
    { side: "right", at: "10.5%", size: 60, delay: -2.4, wideOnly: true },
    { side: "left", at: "4%", size: 54, delay: -1.6, wideOnly: true },
  ],
  [
    { side: "left", at: "3%", size: 90, delay: -1.2 },
    { side: "left", at: "10%", size: 58, delay: -3.1, wideOnly: true },
    { side: "right", at: "5%", size: 52, delay: -0.4, wideOnly: true },
  ],
  [
    { side: "right", at: "4%", size: 90, delay: -0.6 },
    { side: "left", at: "3.5%", size: 64, delay: -2, wideOnly: true },
    { side: "right", at: "11%", size: 54, delay: -3.4, wideOnly: true },
  ],
];

/** ตัวแปร CSS ของชุดตกแต่ง (ภาพขอบจอ ฉากส่วนท้าย สีพื้นแต่ละช่วง) — CSS ใช้ร่วมกันทุกเทศกาล */
const kitVars = (kit: FestivalKit): Record<string, string> => ({
  ...kit.palette,
  "--festival-edge-left": `url("${kit.art.edgeLeft}")`,
  "--festival-edge-right": `url("${kit.art.edgeRight}")`,
  "--festival-footer": `url("${kit.art.footer}")`,
  "--festival-footer-tint": kit.footerTint,
  // ไอคอน/ของประจำเทศกาล — ลายจาง ๆ ในเมนู และของตกแต่งในแถบดาวน์โหลดแอป
  "--festival-icon-a": `url("${kit.icons[0]}")`,
  "--festival-icon-b": `url("${kit.icons[1] ?? kit.icons[0]}")`,
  "--festival-icon-c": `url("${kit.icons[2] ?? kit.icons[0]}")`,
  "--festival-seam-img": `url("${kit.art.seam}")`,
  "--festival-footer-y": kit.footerShift ? `calc(100% + ${kit.footerShift}px)` : "bottom",
  "--festival-section-a": kit.sectionBg[0],
  "--festival-section-b": kit.sectionBg[1],
});

export default function FestivalDecor() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<{ key: string; preview: boolean; label: string; motion: boolean } | null>(null);
  const motionOff = useFestivalMotionOff();
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [navbar, setNavbar] = useState<HTMLElement | null>(null);

  // ธีมที่ควรแสดง (ดูตัวอย่างของเจ้าหน้าที่ / ธีมที่เปิดอยู่ · ไว้อาลัย = ไม่มี) — ค่าเดียวกับเอฟเฟกต์ แบนเนอร์ และสี
  useEffect(() => {
    let cancelled = false;
    resolveFestival().then(({ festival, preview }) => {
      if (cancelled || !festival) return;
      setTheme({ key: festival.themeKey, preview, label: previewLabel(festival), motion: hasFestivalMotion(festival as unknown as Record<string, unknown>) });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const kit = theme ? FESTIVAL_KITS[theme.key] : undefined;

  // วัดตำแหน่งเนื้อหา + รอยต่อแต่ละช่วงของหน้าแรก — วัดใหม่เมื่อเปลี่ยนหน้า ย่อขยายจอ หรือเนื้อหาโหลดเสร็จ
  useEffect(() => {
    if (!kit) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const main = document.querySelector<HTMLElement>("main.main-content");
        setNavbar(document.querySelector<HTMLElement>(".navbar"));
        if (!main) return;
        const y = window.scrollY;
        const seams =
          pathname === "/"
            ? [...main.querySelectorAll<HTMLElement>(":scope > section")].map((s) => s.getBoundingClientRect().top + y)
            : [];
        setLayout({ mainTop: main.getBoundingClientRect().top + y, seams });
      });
    };
    measure();
    const late = window.setTimeout(measure, 900);
    const main = document.querySelector<HTMLElement>("main.main-content");
    const ro = main ? new ResizeObserver(measure) : null;
    if (main) ro!.observe(main);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [kit, pathname]);

  // ใส่/ถอด data-festival + ชุดสี/ภาพ ที่ <html>
  useEffect(() => {
    if (!kit) return;
    const root = document.documentElement;
    const vars = kitVars(kit);
    root.dataset.festival = kit.key;
    root.dataset.festivalTrim = kit.navTrim ?? "lights"; // ของประดับใต้เมนู: ไฟประดับ / ธงราว / ไม่มี
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => {
      delete root.dataset.festival;
      delete root.dataset.festivalTrim;
      for (const k of Object.keys(vars)) root.style.removeProperty(k);
    };
  }, [kit]);

  if (!theme) return null;

  return (
    <>
      {kit && (
        <>
          {/* ลายทองกลางใต้เมนู (เมนูเป็นส่วนของ layout ใส่เข้าไปได้ปลอดภัย) */}
          {navbar && createPortal(<span className={css.navOrnament} aria-hidden="true" />, navbar)}

          {layout && (
            <div className={css.layer} aria-hidden="true">
              {/* ของตกแต่งมุมขวาบน + ของลอยด้านซ้าย — หน้าแรกอยู่ที่หัวช่วง "บริการ" (พ้นป้ายภาพใหญ่ ไม่ทับตรา/ข้อความบนป้าย) */}
              <div className={css.sky} style={{ top: (layout.seams[0] ?? layout.mainTop) + (layout.seams.length ? 8 : 0) }}>
                <span className={css.skyMain} style={{ backgroundImage: `url("${kit.art.sky}")` }} />
                {kit.art.floaters.map((src, i) => (
                  <span key={i} className={`${css.floater} ${css[`f${i + 1}`]}`} style={{ backgroundImage: `url("${src}")` }} />
                ))}
              </div>

              {/* หน้าแรก: ของลอยบนเส้นน้ำระหว่างช่วง บริการ → ข่าว → วิดีโอ/ดอกเบี้ย → ภาพกิจกรรม */}
              {layout.seams.map((top, i) =>
                (SEAM_ITEMS[i] ?? []).map((k, j) => (
                  <span
                    key={`${i}-${j}`}
                    className={`${css.seamItem} ${k.wideOnly ? css.wideOnly : ""}`}
                    style={{
                      top: top - k.size * (110 / 120) + 14,
                      [k.side]: k.at,
                      width: k.size,
                      height: k.size * (110 / 120),
                      animationDelay: `${k.delay}s`,
                      backgroundImage: `url("${kit.art.seam}")`,
                    }}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ผู้ชมปิด/เปิดของที่ขยับได้เอง (จำไว้ในเครื่อง) — มีเฉพาะหน้าแรกที่มีของขยับ */}
      {theme.motion && pathname === "/" && (!reduced || theme.preview) && (
        <button
          type="button"
          className={`${css.motionToggle} ${motionOff ? css.motionOff : ""}`}
          onClick={() => setFestivalMotionOff(!motionOff)}
          aria-pressed={motionOff}
          title={motionOff ? "เปิดเอฟเฟกต์เทศกาล" : "ปิดเอฟเฟกต์เทศกาล (ของที่ขยับบนจอ)"}
        >
          <Sparkles size={15} />
          <span>{motionOff ? "เปิดเอฟเฟกต์" : "ปิดเอฟเฟกต์"}</span>
        </button>
      )}

      {/* ป้ายโหมดดูตัวอย่าง — เพื่อให้รู้ว่ากำลังดูตัวอย่าง และออกได้ */}
      {theme.preview && (
        <div className={css.previewChip} role="status">
          <Eye size={15} />
          <span className={css.previewText}>
            กำลังดูตัวอย่าง: {theme.label || kit?.label || theme.key}
            {/* บอกเหตุผลเมื่อของที่ขยับไม่แสดง — เจ้าหน้าที่จะได้ไม่เข้าใจว่าระบบเสีย */}
            {theme.motion && (() => {
              const why =
                motionOff ? "กดปิดเอฟเฟกต์ไว้ในเครื่องนี้ (ปุ่มมุมขวาล่าง)"
                : pathname !== "/" ? "ของที่ขยับแสดงเฉพาะหน้าแรก"
                : mobile ? "มือถือ/จอแคบ ไม่แสดงตัวการ์ตูนเดินผ่าน"
                : reduced ? "เครื่องนี้ตั้งลดการเคลื่อนไหว สมาชิกที่ตั้งแบบนี้จะไม่เห็นของที่ขยับ"
                : "";
              return why ? <small>{why}</small> : null;
            })()}
          </span>
          <button type="button" onClick={exitFestivalPreview}>
            <X size={14} /> ออกจากตัวอย่าง
          </button>
        </div>
      )}
    </>
  );
}
