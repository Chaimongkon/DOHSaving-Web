"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import lottie, { type AnimationItem } from "lottie-web";

interface Props {
  effectUrl: string;
  scale?: number;  // 10-100 → controls size of each pop
  count?: number;  // 1-5 → how many pops at once
  delay?: number;  // ms stagger between pops
}

function randomPos() {
  return {
    x: Math.random() * 80 + 5,  // 5%-85% from left
    y: Math.random() * 70 + 5,  // 5%-75% from top
  };
}

export default function LottieEffect({
  effectUrl,
  scale: scalePct = 50,
  count = 2,
  delay = 1500,
}: Props) {
  // size: scale 10→120px, 50→250px, 100→450px
  const sizePx = Math.round(120 + ((450 - 120) * scalePct) / 100);
  const pops = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pops.map((i) => (
        <RandomPop key={i} path={effectUrl} sizePx={sizePx} delay={delay * i} />
      ))}
    </div>
  );
}

// Single pop: plays once at random position → fades → moves → replays
function RandomPop({ path, sizePx, delay }: { path: string; sizePx: number; delay: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [pos, setPos] = useState(randomPos);
  const [visible, setVisible] = useState(false);

  const moveToNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setPos(randomPos());
      setVisible(true);
      animRef.current?.goToAndPlay(0);
    }, 300);
  }, []);

  useEffect(() => {
    if (!path || !containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "canvas",
      loop: false,
      autoplay: false,
      path,
    });

    animRef.current = anim;
    anim.addEventListener("DOMLoaded", () => {
      // stagger start
      setTimeout(() => {
        setVisible(true);
        anim.play();
      }, delay);
    });
    anim.addEventListener("complete", moveToNext);

    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [path, delay, moveToNext]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: sizePx,
        height: sizePx,
        transform: "translate(-50%, -50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
