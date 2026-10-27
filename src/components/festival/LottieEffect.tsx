"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import lottie, { type AnimationItem } from "lottie-web";

/**
 * Effect แบบ Lottie (เช่น พลุ ดอกไม้ไฟ) — ระเบิดทีละลูกตามจุดสุ่ม เล่นจบแล้วเว้นช่วงสั้น ๆ ก่อนจุดลูกถัดไปที่ตำแหน่งใหม่
 * - จุดระเบิดอยู่ช่วงบนของจอ (เหมือนพลุบนฟ้า) ไม่ลงมากลางเนื้อหา และไม่ซ้ำที่เดิม
 * - แต่ละลูกขนาด/ความเร็วต่างกันเล็กน้อย ไม่ดูเป็นจังหวะเครื่องจักร
 */
interface Props {
  effectUrl: string; // ลิงก์ไฟล์ (ไม่มีส่วนค่าปรับหลัง #)
  sizePx: number; // ความกว้างของแต่ละลูก (px)
  count?: number; // 1-5 → จำนวนลูกที่จุดสลับกัน
  delay?: number; // ms — ระยะห่างเฉลี่ยระหว่างลูก
  area?: number; // ระเบิดได้ลงมาถึงกี่ % ของจอ
  vary?: number; // ขนาดแต่ละลูกต่างกัน ± กี่ %
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/** ตำแหน่งบนจอ: กว้างทั้งจอ สูงไม่เกิน area% (ค่าเริ่มต้น 40% = ฟ้าด้านบน) — ห่างจากจุดเดิมพอสมควร */
function skyPos(area: number, prev?: { x: number; y: number }) {
  for (let i = 0; i < 6; i++) {
    const p = { x: rand(6, 94), y: rand(8, area) };
    if (!prev || Math.abs(p.x - prev.x) > 18) return p;
  }
  return { x: rand(6, 94), y: rand(8, area) };
}

export default function LottieEffect({ effectUrl, sizePx, count = 2, delay = 1500, area = 40, vary = 20 }: Props) {
  const pops = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", overflow: "hidden" }}>
      {pops.map((i) => (
        // ลูกแรก ๆ ทยอยจุด ไม่พร้อมกัน
        <RandomPop key={i} path={effectUrl} sizePx={sizePx} startDelay={i * (delay * 0.6 + 400)} gap={delay} area={area} vary={vary} />
      ))}
    </div>
  );
}

/** กรอบของ "ตัวพลุจริง" ในไฟล์ Lottie (หน่วยของไฟล์) — ไฟล์ที่ออกแบบสำหรับทั้งจอมือถือมีที่ว่างรอบ ๆ เยอะ */
type Fit = { W: number; H: number; x: number; y: number; w: number; h: number };

function RandomPop({ path, sizePx, startDelay, gap, area, vary }: { path: string; sizePx: number; startDelay: number; gap: number; area: number; vary: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => skyPos(area));
  const [size, setSize] = useState(sizePx);
  const [visible, setVisible] = useState(false);
  const [fit, setFit] = useState<Fit | null>(null);

  useEffect(() => {
    if (!path || !containerRef.current) return;
    let timer = 0;
    let alive = true;
    const container = containerRef.current;
    const anim: AnimationItem = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path,
    });

    // วัดกรอบของตัวพลุจริง (รวมหลายจังหวะของภาพ) → ขยายให้ตัวพลุมีขนาดตามที่ตั้ง ไม่ใช่ทั้งกรอบไฟล์
    const measure = () => {
      const data = (anim as unknown as { animationData?: { w: number; h: number } }).animationData;
      const g = container.querySelector("svg > g") as SVGGraphicsElement | null;
      if (!data || !g) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const t of [0.25, 0.4, 0.55, 0.7, 0.85]) {
        anim.goToAndStop(Math.floor(anim.totalFrames * t), true);
        try {
          const b = g.getBBox();
          if (b.width > 0 && b.height > 0) {
            x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
            x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
          }
        } catch {
          /* วัดไม่ได้ — ใช้ทั้งกรอบไฟล์ */
        }
      }
      anim.goToAndStop(0, true);
      // ปรับเฉพาะเมื่อตัวพลุเล็กกว่ากรอบไฟล์ชัดเจน (มีที่ว่างรอบ ๆ)
      if (x1 > x0 && (x1 - x0 < data.w * 0.85 || y1 - y0 < data.h * 0.85)) {
        const pad = Math.max(x1 - x0, y1 - y0) * 0.04;
        setFit({ W: data.w, H: data.h, x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 });
      }
    };

    const fire = () => {
      if (!alive) return;
      anim.setSpeed(rand(0.85, 1.15));
      anim.goToAndPlay(0);
      setVisible(true);
    };
    // จบหนึ่งลูก → ซ่อน → เว้นช่วงแบบสุ่ม → ย้ายไปจุดใหม่ ขนาดใหม่ → จุดอีกครั้ง
    const next = () => {
      setVisible(false);
      timer = window.setTimeout(() => {
        setPos((prev) => skyPos(area, prev));
        setSize(Math.round(sizePx * rand(1 - vary / 100, 1 + vary / 100)));
        timer = window.setTimeout(fire, 60);
      }, rand(0.5, 1.5) * gap + 250);
    };

    anim.addEventListener("DOMLoaded", () => {
      measure();
      timer = window.setTimeout(fire, startDelay);
    });
    anim.addEventListener("complete", next);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      anim.destroy();
    };
  }, [path, sizePx, startDelay, gap, area, vary]);

  // ตัวพลุจริงกว้าง = size px · ไฟล์ทั้งกรอบขยายตาม แล้วเลื่อนให้ตัวพลุอยู่กลางจุดที่สุ่มได้ (ส่วนที่เกินเป็นพื้นโปร่งใส)
  const k = fit ? size / fit.w : 0;
  const outerH = fit ? fit.h * k : size;
  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: size,
        height: outerH,
        transform: "translate(-50%, -50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s",
      }}
    >
      <div
        ref={containerRef}
        style={
          fit
            ? { position: "absolute", left: -fit.x * k, top: -fit.y * k, width: fit.W * k, height: fit.H * k }
            : { width: "100%", height: "100%" }
        }
      />
    </div>
  );
}
