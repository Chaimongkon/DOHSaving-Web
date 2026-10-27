"use client";

import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import { FESTIVAL_THEMES, EFFECT_TO_THEME_KEY } from "./themes";

/** อนุภาคทั่วจอ — แยกไฟล์เพื่อโหลดเครื่องมือ (tsparticles) เฉพาะตอนมีธีมที่ใช้ Effect จริง */
export default function FestivalParticles({ effect, intensity, color }: { effect: string; intensity: number; color: string | null }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadHeartShape(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(() => {
    const config = FESTIVAL_THEMES[EFFECT_TO_THEME_KEY[effect]];
    if (!config) return null;
    // หยุดเองเมื่อสลับไปแท็บอื่น/อนุภาคไม่อยู่ในจอ — ประหยัดแบตมือถือ
    return { ...config.particles(intensity, color), pauseOnBlur: true, pauseOnOutsideViewport: true, fpsLimit: 45 };
  }, [effect, intensity, color]);

  if (!ready || !options) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", transition: "opacity 1.2s" }}>
      <Particles id="festival-particles" options={options} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
