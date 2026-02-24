"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import { FESTIVAL_THEMES, EFFECT_TO_THEME_KEY } from "./themes";
import CustomAnimation from "./CustomAnimation";
import LottieEffect from "./LottieEffect";

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
}

export default function FestivalOverlay() {
  const [festival, setFestival] = useState<FestivalData | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  // Init particles engine once
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadHeartShape(engine);
    }).then(() => setEngineReady(true));
  }, []);

  // Fetch active festival
  useEffect(() => {
    fetch("/api/festival/active")
      .then((res) => res.json())
      .then((data) => {
        console.log("[FestivalOverlay] API response:", data);
        if (data && data.isActive) {
          setFestival(data);
        }
      })
      .catch((err) => {
        console.error("[FestivalOverlay] fetch error:", err);
      });
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  // Build particle options
  const particleOptions = useMemo(() => {
    if (!festival || festival.effect === "none") return null;

    const themeKey = EFFECT_TO_THEME_KEY[festival.effect];
    if (!themeKey) return null;

    const config = FESTIVAL_THEMES[themeKey];
    if (!config) return null;

    return config.particles(festival.intensity, festival.effectColor);
  }, [festival]);

  if (!festival) return null;
  const hasEffect = festival.effect !== "none";
  const hasLottieEffect = hasEffect && !!festival.effectUrl;
  const hasParticleEffect = hasEffect && !festival.effectUrl && engineReady;
  const hasAnimation = festival.animation !== "none";
  if (!hasEffect && !hasAnimation) return null;

  return (
    <>
      {hasLottieEffect && (
        <LottieEffect
          effectUrl={festival.effectUrl!}
          scale={festival.effectScale}
          count={festival.effectCount}
          delay={festival.effectDelay}
        />
      )}
      {hasParticleEffect && particleOptions && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <Particles
            id="festival-particles"
            options={particleOptions}
            particlesLoaded={particlesLoaded}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}
      {hasAnimation && (
        <CustomAnimation
          animation={festival.animation}
          animationUrl={festival.animationUrl}
          scale={festival.animationScale}
        />
      )}
    </>
  );
}
