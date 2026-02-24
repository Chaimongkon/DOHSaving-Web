"use client";

import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import styles from "./CustomAnimation.module.css";

interface Props {
  animation: string;
  animationUrl?: string | null;
  scale?: number;
}

const BUILTIN_ANIMATIONS: Record<string, { src: string; type: "lottie" | "image"; rtlClass: string; ltrClass: string }> = {
  "santa-sleigh": {
    src: "/lottie/santa sleigh.json",
    type: "lottie",
    rtlClass: styles.flyAcross,
    ltrClass: styles.flyAcrossLtr,
  },
  cupid: {
    src: "/images/festival/cupid.svg",
    type: "image",
    rtlClass: styles.floatAcross,
    ltrClass: styles.floatAcrossLtr,
  },
  rocket: {
    src: "/images/festival/rocket.svg",
    type: "image",
    rtlClass: styles.launchUp,
    ltrClass: styles.launchUp,
  },
};

export default function CustomAnimation({ animation, animationUrl, scale: scalePct = 50 }: Props) {
  // scale 10-100 maps to pixel width: 200px - 800px (desktop)
  const widthPx = Math.round(200 + (scalePct / 100) * 600);
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
    const isLottie = src?.endsWith(".json") || builtin?.type === "lottie";

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
    
    // Random height between 5% and 40% of screen
    setTopPercent(Math.floor(Math.random() * 35) + 5);
    
    // Random duration between 12s and 25s
    setDuration(Math.floor(Math.random() * 13) + 12);
  }, [animation, animationUrl, key]);

  // Setup listener for animation end
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleAnimationEnd = () => {
      // Wait a bit before next run (random 1-5 seconds)
      setTimeout(() => {
        setKey((prev) => prev + 1); // Triggers the properties effect above
      }, Math.floor(Math.random() * 4000) + 1000);
    };
    
    const animatedEl = el.firstElementChild as HTMLElement;
    if (animatedEl) {
      animatedEl.addEventListener("animationend", handleAnimationEnd);
      return () => animatedEl.removeEventListener("animationend", handleAnimationEnd);
    }
  }, [key]);

  if (animation === "none" && !animationUrl) return null;

  const builtin = BUILTIN_ANIMATIONS[animation];
  const src = animationUrl || builtin?.src;
  const isLottie = src?.endsWith(".json") || builtin?.type === "lottie";

  if (!src) return null;

  // Pick the correct directional class
  const finalClass = direction === "ltr"
    ? (builtin?.ltrClass || styles.flyAcrossLtr)
    : (builtin?.rtlClass || styles.flyAcross);

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
