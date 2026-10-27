/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import styles from "./CustomAnimation.module.css";
import { FESTIVAL_KITS } from "./kits";
import { REAL_ART } from "./realArt.generated";

interface Props {
  animation: string;
  animationUrl?: string | null;
  scale?: number;
  /** เวลารอระหว่างรอบ (ms) — ปกติ 60–120 วินาที · โหมดดูตัวอย่างสั้นกว่า ให้เจ้าหน้าที่เห็นเร็ว */
  gapMs?: number;
  /** แสดงแม้เครื่องตั้ง "ลดการเคลื่อนไหว" (โหมดดูตัวอย่างของเจ้าหน้าที่) */
  force?: boolean;
  /** ประเภทเทศกาล — ถ้ามีตัวการ์ตูนจากภาพจริง (public/festival/<key>/character.webp) ใช้แทนภาพวาดของ Animation ประจำเทศกาล */
  themeKey?: string;
}

const BUILTIN_ANIMATIONS: Record<string, { src: string; type: "lottie" | "image"; rtlClass: string; ltrClass: string; water?: boolean; size?: [number, number] }> = {
  // ช้างพ่นน้ำเดินผ่านแนวล่างของจอ (สงกรานต์)
  "elephant-splash": {
    src: "/festival/animations/elephant-splash.svg",
    type: "image",
    rtlClass: styles.waterLtr, // ภาพหันขวา — เดินซ้ายไปขวาเสมอ
    ltrClass: styles.waterLtr,
    water: true,
    size: [120, 300],
  },
  // กระปุกออมสินเดินผ่านแนวล่างของจอ (วันออม)
  "piggy-walk": {
    src: "/festival/savings/character.webp",
    type: "image",
    rtlClass: styles.waterLtr, // ภาพหันขวา — เดินซ้ายไปขวาเสมอ
    ltrClass: styles.waterLtr,
    water: true,
    size: [90, 220],
  },
  // ผีน้อยลอยผ่าน (ฮาโลวีน) — ลอยโยกขึ้นลงข้ามจอแบบกามเทพ
  "ghost-float": {
    src: "/festival/animations/ghost-float.svg",
    type: "image",
    rtlClass: styles.floatAcross,
    ltrClass: styles.floatAcrossLtr,
    size: [90, 220],
  },
  // ลูกโป่งลอยขึ้น (ฉลองทั่วไป)
  "balloons-up": {
    src: "/festival/animations/balloons-up.svg",
    type: "image",
    rtlClass: styles.launchUp,
    ltrClass: styles.launchUp,
    size: [80, 200],
  },
  // กระทงลอยผ่านแนวล่างของจอ ช้า ๆ โยกตามคลื่น
  "krathong-float": {
    src: "/festival/loy-krathong/krathong.svg",
    type: "image",
    rtlClass: styles.waterRtl,
    ltrClass: styles.waterLtr,
    water: true,
  },
  "santa-sleigh": {
    src: "/lottie/santa sleigh.json",
    type: "lottie",
    rtlClass: styles.flyAcross,
    ltrClass: styles.flyAcrossLtr,
    size: [200, 460], // ภาพยาว (เลื่อน + กวาง 3 ตัว) — กว้างกว่าตัวอื่นเพื่อให้ซานต้าไม่เล็กเกิน
  },
  cupid: {
    src: "/images/festival/cupid.svg",
    type: "image",
    rtlClass: styles.floatAcross,
    ltrClass: styles.floatAcrossLtr,
    size: [100, 280],
  },
  rocket: {
    src: "/images/festival/rocket.svg",
    type: "image",
    rtlClass: styles.launchUp,
    ltrClass: styles.launchUp,
    size: [70, 220],
  },
};

/** ตัวการ์ตูนจากภาพจริง — ใช้เมื่อ Animation ที่เลือกเป็นตัวประจำเทศกาลนั้น (เช่น ลอยกระทง + กระทงลอยผ่าน) */
const realCharacter = (themeKey: string | undefined, animation: string) =>
  themeKey && REAL_ART[themeKey]?.character && FESTIVAL_KITS[themeKey]?.defaults.animation === animation
    ? `/festival/${themeKey}/character.webp`
    : null;

/** ไฟล์ Lottie หรือไม่ — ดูจากไฟล์ที่ใช้จริง: ภาพจริง (.webp) ของ Animation ที่เดิมเป็น Lottie (ซานต้า) ต้องแสดงเป็นภาพ */
const isLottieSrc = (src: string | null | undefined, animation: string, hasUrl: boolean) =>
  Boolean(src?.endsWith(".json")) || (!hasUrl && BUILTIN_ANIMATIONS[animation]?.type === "lottie");

export default function CustomAnimation({ animation, animationUrl: customUrl, scale: scalePct = 50, gapMs, force = false, themeKey }: Props) {
  const real = customUrl ? null : realCharacter(themeKey, animation);
  const animationUrl = customUrl || real;
  const builtinSize = BUILTIN_ANIMATIONS[animation]?.size;
  const onWater = Boolean(BUILTIN_ANIMATIONS[animation]?.water);
  // scale 10-100 maps to pixel width: 200px - 800px (desktop) · ของลอยน้ำเล็กกว่า: 70px - 230px (หรือตามที่กำหนด)
  const [minW, maxW] = builtinSize ?? (onWater ? [70, 230] : [200, 800]);
  const widthPx = Math.round(minW + (scalePct / 100) * (maxW - minW));
  const [lottieData, setLottieData] = useState<unknown>(null);
  
  // Randomization states
  const [key, setKey] = useState(0); // Used to force re-render and restart animation
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");
  const [topPercent, setTopPercent] = useState(5);
  const [duration, setDuration] = useState(15);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animation === "none" && !animationUrl) return;

    const builtin = BUILTIN_ANIMATIONS[animation];
    const src = animationUrl || builtin?.src;
    const isLottie = isLottieSrc(src, animation, Boolean(animationUrl));

    if (isLottie && src) {
      fetch(src)
        .then((res) => res.json())
        .then((data) => setLottieData(data))
        .catch((err) => console.error("Failed to load Lottie animation:", err));
    } else {
      setLottieData(null);
    }
  }, [animation, animationUrl]);

  // Initial random properties
  useEffect(() => {
    if (animation === "none" && !animationUrl) return;

    // Random direction: 50% chance left-to-right, 50% right-to-left
    const isLtr = Math.random() > 0.5;
    setDirection(isLtr ? "ltr" : "rtl");
    
    if (BUILTIN_ANIMATIONS[animation]?.water) {
      // ลอยบนน้ำ/เดินผ่าน: ชิดขอบล่างของจอ (ไม่ผ่านกลางเนื้อหา) ช้ากว่า (26–38 วินาที) · ตัวใหญ่ (ช้าง/กระปุก) ยกขึ้นนิดเดียวไม่ให้ขาหลุดขอบจอ
      const tall = Boolean(BUILTIN_ANIMATIONS[animation]?.size);
      setTopPercent(Math.floor(Math.random() * 4) + (tall ? 76 : 82));
      setDuration(Math.floor(Math.random() * 13) + 26);
      return;
    }

    // Random height between 5% and 40% of screen
    setTopPercent(Math.floor(Math.random() * 35) + 5);
    
    // Random duration between 12s and 25s
    setDuration(Math.floor(Math.random() * 13) + 12);
  }, [animation, animationUrl, key]);

  // Setup listener for animation end
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer = 0;
    const handleAnimationEnd = () => {
      // ผ่านจอเป็นครั้งคราว ไม่วนตลอด — รอ 60–120 วินาทีก่อนรอบถัดไป
      timer = window.setTimeout(() => {
        setKey((prev) => prev + 1); // Triggers the properties effect above
      }, gapMs ?? Math.floor(Math.random() * 60000) + 60000);
    };

    const animatedEl = el.firstElementChild as HTMLElement;
    if (animatedEl) {
      animatedEl.addEventListener("animationend", handleAnimationEnd);
      return () => {
        animatedEl.removeEventListener("animationend", handleAnimationEnd);
        window.clearTimeout(timer);
      };
    }
  }, [key, lottieData, gapMs]);

  if (animation === "none" && !animationUrl) return null;

  const builtin = BUILTIN_ANIMATIONS[animation];
  const src = animationUrl || builtin?.src;
  const isLottie = isLottieSrc(src, animation, Boolean(animationUrl));

  if (!src) return null;

  // ภาพจริงทุกตัวหันขวา แต่ท่าบินข้ามจอ (ซานต้า/กามเทพ) เดิมทำไว้สำหรับภาพที่หันซ้าย — ใช้ท่าบินชุดสำหรับภาพหันขวาแทน
  const faceRight: Record<string, [string, string]> = {
    [styles.flyAcross]: [styles.flyAcrossFaceL, styles.flyAcrossLtrFaceR],
    [styles.floatAcross]: [styles.floatAcrossFaceL, styles.floatAcrossLtrFaceR],
  };
  const realFlight = real && builtin ? faceRight[builtin.rtlClass] : undefined;
  // Pick the correct directional class
  const directional = realFlight
    ? realFlight[direction === "ltr" ? 1 : 0]
    : direction === "ltr"
      ? (builtin?.ltrClass || styles.flyAcrossLtr)
      : (builtin?.rtlClass || styles.flyAcross);
  const finalClass = `${directional}${force ? ` ${styles.force}` : ""}`;

  return (
    <div className={styles.container} ref={containerRef}>
      {isLottie ? (
        lottieData ? (
          <div 
            key={key}
            className={`${styles.animatedWrapper} ${finalClass}`}
            style={{ 
              top: `${topPercent}%`, 
              animationDuration: `${duration}s`,
              width: `${widthPx}px`,
            }}
          >
            <Lottie 
              animationData={lottieData} 
              loop={true} 
              style={{ background: "transparent" }}
            />
          </div>
        ) : null
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={key}
          src={src}
          alt="Festival Animation"
          className={`${styles.animatedWrapper} ${finalClass}`}
          style={{ 
            top: `${topPercent}%`, 
            animationDuration: `${duration}s`,
            width: `${widthPx}px`,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
