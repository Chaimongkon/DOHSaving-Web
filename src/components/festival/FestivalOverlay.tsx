"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { resolveFestival } from "@/lib/festivalClient";
import { parseEffectUrl, sizeFromScale } from "@/lib/lottieEffectOptions";
import { useCalm, useFestivalMotionOff, useIsMobile, usePrefersReducedMotion } from "@/lib/festivalMotion";

// โหลดเครื่องมือเคลื่อนไหว (tsparticles / lottie) เฉพาะเมื่อมีธีมที่ใช้จริง — วันปกติไม่โหลดเลย
const FestivalParticles = dynamic(() => import("./FestivalParticles"), { ssr: false });
const CustomAnimation = dynamic(() => import("./CustomAnimation"), { ssr: false });
const LottieEffect = dynamic(() => import("./LottieEffect"), { ssr: false });
const IconEffect = dynamic(() => import("./IconEffect"), { ssr: false });

interface FestivalData {
  id: number;
  themeKey: string;
  isActive: boolean;
  effect: string;
  effectUrl: string | null;
  intensity: number;
  effectScale: number;
  effectColor: string | null;
  effectCount: number;
  effectDelay: number;
  animation: string;
  animationUrl: string | null;
  animationScale: number;
  iconUrls: string | null;
  iconMode: string;
  iconSize: number;
  iconCount: number;
  iconSpeed: number;
}

export default function FestivalOverlay() {
  const pathname = usePathname();
  const [festival, setFestival] = useState<FestivalData | null>(null);
  const [preview, setPreview] = useState(false);
  const motionOff = useFestivalMotionOff();
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const calm = useCalm();

  // ธีมที่ควรแสดง (ดูตัวอย่างของเจ้าหน้าที่ / ธีมที่เปิดอยู่ · ไว้อาลัย = ไม่มี)
  useEffect(() => {
    resolveFestival()
      .then(({ festival: data, preview: isPreview }) => {
        if (data && data.isActive) setFestival(data as unknown as FestivalData);
        setPreview(isPreview);
      })
      .catch(() => {});
  }, []);

  // รายการไอคอน — ต้องเป็นค่าเดิมระหว่าง render ไม่อย่างนั้นไอคอนจะเริ่มใหม่ทุกครั้ง (เช่นตอนสงบลง)
  const icons = useMemo(() => {
    if (!festival || festival.iconMode === "none" || !festival.iconUrls) return [] as string[];
    try {
      const v = JSON.parse(festival.iconUrls);
      return Array.isArray(v) ? (v as string[]) : [];
    } catch {
      return [];
    }
  }, [festival]);

  // Effect แบบ Lottie + ค่าปรับที่เก็บต่อท้ายลิงก์ (ขนาด บริเวณ ขนาดสุ่ม ขนาดบนมือถือ)
  const lottieFx = useMemo(() => (festival?.effectUrl ? parseEffectUrl(festival.effectUrl) : null), [festival]);

  // ของที่ขยับ: เฉพาะหน้าแรก · ผู้ชมปิดไว้/เครื่องตั้งลดการเคลื่อนไหว = ไม่แสดง
  // ยกเว้นเจ้าหน้าที่ดูตัวอย่าง — แสดงแม้เครื่องตั้งลดการเคลื่อนไหว เพื่อเห็นแบบที่สมาชิกทั่วไปเห็น
  if (!festival || pathname !== "/" || motionOff || (reduced && !preview)) return null;

  const hasEffect = festival.effect !== "none";
  const hasAnimation = (festival.animation !== "none" || !!festival.animationUrl) && !mobile;
  // มือถือ: อนุภาคครึ่งเดียว · หลังเปิดหน้าไประยะหนึ่ง: เหลือราว 1 ใน 3
  const intensity = Math.max(5, Math.round(festival.intensity * (mobile ? 0.5 : 1) * (calm ? 0.35 : 1)));

  return (
    <>
      {/* Effect แบบ Lottie (เช่น พลุ) — แสดงเมื่ออัปโหลดไฟล์แล้ว ไม่ขึ้นกับช่อง "รูปแบบ Effect" · มือถือเล็กลง · สงบลงแล้วจุดห่างขึ้น */}
      {lottieFx && (
        <LottieEffect
          effectUrl={lottieFx.src}
          sizePx={Math.round((lottieFx.fx.size ?? sizeFromScale(festival.effectScale)) * (mobile ? lottieFx.fx.mobile / 100 : 1))}
          area={lottieFx.fx.area}
          vary={lottieFx.fx.vary}
          count={calm || mobile ? 1 : festival.effectCount}
          delay={festival.effectDelay * (calm ? 4 : 1)}
        />
      )}
      {hasEffect && !festival.effectUrl && <FestivalParticles effect={festival.effect} intensity={intensity} color={festival.effectColor} />}
      {hasAnimation && (
        <CustomAnimation
          animation={festival.animation}
          animationUrl={festival.animationUrl}
          scale={festival.animationScale}
          // ดูตัวอย่าง: ผ่านจอบ่อยขึ้น (ทุก ~8 วินาที) ไม่ต้องรอ 1–2 นาที
          gapMs={preview ? 8000 : undefined}
          force={preview}
          themeKey={festival.themeKey}
        />
      )}
      {icons.length > 0 && (
        <IconEffect
          iconUrls={icons}
          mode={festival.iconMode as "falling" | "bouncing"}
          size={mobile ? Math.round(festival.iconSize * 0.8) : festival.iconSize}
          count={mobile ? Math.max(3, Math.ceil(festival.iconCount / 2)) : festival.iconCount}
          speed={festival.iconSpeed}
          calm={calm}
          narrow={mobile}
        />
      )}
    </>
  );
}
