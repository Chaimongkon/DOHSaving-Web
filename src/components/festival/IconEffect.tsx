"use client";

import React, { useEffect, useRef, useCallback } from "react";
import styles from "./IconEffect.module.css";

interface Props {
  iconUrls: string[];
  mode: "falling" | "bouncing";
  size?: number;   // px per icon (20-120)
  count?: number;  // total icons on screen
  speed?: number;  // 10-100, maps to velocity
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

export default function IconEffect({
  iconUrls,
  mode,
  size = 50,
  count = 15,
  speed = 50,
}: Props) {
  if (!iconUrls || iconUrls.length === 0) return null;

  if (mode === "falling") {
    return <FallingMode iconUrls={iconUrls} size={size} count={count} speed={speed} />;
  }

  return <BouncingMode iconUrls={iconUrls} size={size} count={count} speed={speed} />;
}

// ════════════════════════════════════════════════════
//  Falling Mode — multiple fall patterns via rAF
// ════════════════════════════════════════════════════

type FallPattern = "straight" | "sway" | "zigzag" | "spiral" | "drift" | "flutter";
const FALL_PATTERNS: FallPattern[] = ["straight", "sway", "zigzag", "spiral", "drift", "flutter"];

interface FallingItem {
  el: HTMLDivElement;
  x: number;
  y: number;
  baseX: number;
  size: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  pattern: FallPattern;
  phase: number;
  amplitude: number;
  frequency: number;
  opacity: number;
  // stacking state
  landed: boolean;
  landedY: number;       // final Y when landed
  landedRotation: number;
  bouncePhase: number;   // settling bounce progress (0→1)
  fadeTimer: number;      // frames since landed (for fade-out)
}

function FallingMode({ iconUrls, size, count, speed }: Omit<Props, "mode"> & { iconUrls: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Speed: 10→0.4px/frame, 50→1.2px/frame, 100→2.5px/frame
  const baseSpeed = 0.4 + (speed! / 100) * 2.1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Height map: tracks ground level per column ──
    const COL_WIDTH = 20; // px per column
    const numCols = Math.ceil(vw / COL_WIDTH);
    const heightMap = new Float32Array(numCols); // stores how high the pile is from the bottom (px)

    // Time (frames) a landed icon stays before fading; fade to recycle
    const LAND_STAY = 300;  // ~5s at 60fps
    const FADE_DURATION = 90; // ~1.5s fade out
    // Max pile height before we start forcing faster fades
    const MAX_PILE_RATIO = 0.45; // 45% of screen height

    function getGroundY(x: number, iconSize: number): number {
      // Get the lowest ground level across columns this icon spans
      const colStart = Math.max(0, Math.floor(x / COL_WIDTH));
      const colEnd = Math.min(numCols - 1, Math.floor((x + iconSize) / COL_WIDTH));
      let maxH = 0;
      for (let c = colStart; c <= colEnd; c++) {
        maxH = Math.max(maxH, heightMap[c]);
      }
      return vh - maxH - iconSize;
    }

    function addToHeightMap(x: number, iconSize: number) {
      const colStart = Math.max(0, Math.floor(x / COL_WIDTH));
      const colEnd = Math.min(numCols - 1, Math.floor((x + iconSize) / COL_WIDTH));
      for (let c = colStart; c <= colEnd; c++) {
        heightMap[c] += iconSize * rand(0.5, 0.75); // partial overlap for natural stacking
      }
    }

    function removeFromHeightMap(x: number, iconSize: number) {
      const colStart = Math.max(0, Math.floor(x / COL_WIDTH));
      const colEnd = Math.min(numCols - 1, Math.floor((x + iconSize) / COL_WIDTH));
      for (let c = colStart; c <= colEnd; c++) {
        heightMap[c] = Math.max(0, heightMap[c] - iconSize * rand(0.5, 0.75));
      }
    }

    function ampForPattern(pattern: FallPattern) {
      return pattern === "sway" ? rand(40, 100) :
             pattern === "zigzag" ? rand(60, 120) :
             pattern === "spiral" ? rand(30, 70) :
             pattern === "drift" ? rand(20, 50) :
             pattern === "flutter" ? rand(15, 40) : 0;
    }

    function freqForPattern(pattern: FallPattern) {
      return pattern === "zigzag" ? rand(0.008, 0.015) :
             pattern === "sway" ? rand(0.003, 0.007) :
             pattern === "spiral" ? rand(0.01, 0.02) :
             pattern === "flutter" ? rand(0.02, 0.04) :
             rand(0.004, 0.008);
    }

    function initItem(el: HTMLDivElement, stagger: boolean): FallingItem {
      const sizeVar = size! * rand(0.7, 1.3);
      el.style.width = `${sizeVar}px`;
      el.style.height = `${sizeVar}px`;
      const pattern = FALL_PATTERNS[randInt(0, FALL_PATTERNS.length - 1)];
      const baseX = rand(10, vw - sizeVar - 10);
      return {
        el, size: sizeVar,
        x: baseX,
        y: stagger ? rand(-vh, -sizeVar) : rand(-sizeVar * 2, -sizeVar),
        baseX,
        speedY: baseSpeed * rand(0.6, 1.5),
        rotation: rand(0, 360),
        rotationSpeed: rand(-2, 2),
        pattern,
        phase: rand(0, Math.PI * 2),
        amplitude: ampForPattern(pattern),
        frequency: freqForPattern(pattern),
        opacity: 1,
        landed: false, landedY: 0, landedRotation: 0,
        bouncePhase: 0, fadeTimer: 0,
      };
    }

    function resetItem(item: FallingItem) {
      // Remove height contribution
      if (item.landed) {
        removeFromHeightMap(item.x, item.size);
      }
      const imgEl = item.el.querySelector("img");
      if (imgEl) imgEl.src = iconUrls[randInt(0, iconUrls.length - 1)];

      const sizeVar = size! * rand(0.7, 1.3);
      item.size = sizeVar;
      item.el.style.width = `${sizeVar}px`;
      item.el.style.height = `${sizeVar}px`;
      const pattern = FALL_PATTERNS[randInt(0, FALL_PATTERNS.length - 1)];
      item.baseX = rand(10, vw - sizeVar - 10);
      item.x = item.baseX;
      item.y = rand(-sizeVar * 2, -sizeVar);
      item.speedY = baseSpeed * rand(0.6, 1.5);
      item.rotation = rand(0, 360);
      item.rotationSpeed = rand(-2, 2);
      item.pattern = pattern;
      item.phase = rand(0, Math.PI * 2);
      item.amplitude = ampForPattern(pattern);
      item.frequency = freqForPattern(pattern);
      item.opacity = 1;
      item.landed = false;
      item.landedY = 0;
      item.landedRotation = 0;
      item.bouncePhase = 0;
      item.fadeTimer = 0;
    }

    // Create items
    const items: FallingItem[] = [];
    for (let i = 0; i < count!; i++) {
      const el = document.createElement("div");
      el.className = styles.fallingIcon;
      const img = document.createElement("img");
      img.src = iconUrls[randInt(0, iconUrls.length - 1)];
      img.alt = "";
      img.className = styles.iconImg;
      img.draggable = false;
      el.appendChild(img);
      container.appendChild(el);
      items.push(initItem(el, true));
    }

    let tick = 0;
    const animate = () => {
      tick++;
      const currentVh = window.innerHeight;

      // Check if pile is getting too high → accelerate fading
      let maxPile = 0;
      for (let c = 0; c < numCols; c++) {
        maxPile = Math.max(maxPile, heightMap[c]);
      }
      const pileRatio = maxPile / currentVh;
      const fadeSpeedMultiplier = pileRatio > MAX_PILE_RATIO
        ? 1 + (pileRatio - MAX_PILE_RATIO) / (1 - MAX_PILE_RATIO) * 4
        : 1;

      for (const item of items) {
        if (item.landed) {
          // ── Landed: settling bounce then idle, then fade ──
          item.fadeTimer += fadeSpeedMultiplier;

          if (item.bouncePhase < 1) {
            // Settling bounce (small vertical oscillation)
            item.bouncePhase = Math.min(1, item.bouncePhase + 0.04);
            const bounce = Math.sin(item.bouncePhase * Math.PI * 3) * (1 - item.bouncePhase) * item.size * 0.15;
            item.el.style.transform = `translate(${item.x}px, ${item.landedY + bounce}px) rotate(${item.landedRotation}deg)`;
          }

          // Fade out after staying
          if (item.fadeTimer > LAND_STAY) {
            const fadeProgress = Math.min(1, (item.fadeTimer - LAND_STAY) / FADE_DURATION);
            item.opacity = 1 - fadeProgress;
            item.el.style.opacity = String(item.opacity);
            if (fadeProgress >= 1) {
              resetItem(item);
            }
          }
          continue;
        }

        // ── Falling: move down with pattern ──
        item.y += item.speedY;
        item.rotation += item.rotationSpeed;

        const t = tick + item.phase * 100;
        switch (item.pattern) {
          case "straight":
            item.x = item.baseX;
            break;
          case "sway":
            item.x = item.baseX + Math.sin(t * item.frequency) * item.amplitude;
            break;
          case "zigzag":
            item.x = item.baseX + item.amplitude * (2 * Math.abs(2 * ((t * item.frequency / Math.PI) % 1) - 1) - 1);
            break;
          case "spiral":
            item.x = item.baseX + Math.sin(t * item.frequency) * item.amplitude * (1 + item.y / currentVh * 0.5);
            item.rotationSpeed = Math.cos(t * item.frequency) * 3;
            break;
          case "drift":
            item.x = item.baseX + Math.sin(t * item.frequency * 0.5) * item.amplitude + t * 0.1;
            item.y += Math.sin(t * 0.02) * 0.3;
            break;
          case "flutter":
            item.x = item.baseX + Math.sin(t * item.frequency) * item.amplitude * Math.cos(t * item.frequency * 0.3);
            item.speedY += Math.sin(t * 0.03) * 0.02;
            item.speedY = Math.max(baseSpeed * 0.3, Math.min(baseSpeed * 2, item.speedY));
            break;
        }

        // Clamp X within screen
        item.x = Math.max(0, Math.min(window.innerWidth - item.size, item.x));

        // Check if reached ground / pile
        const groundY = getGroundY(item.x, item.size);
        if (item.y >= groundY) {
          // Land!
          item.landed = true;
          item.landedY = groundY;
          item.y = groundY;
          item.landedRotation = item.rotation;
          item.bouncePhase = 0;
          item.fadeTimer = 0;
          item.opacity = 1;
          addToHeightMap(item.x, item.size);
        }

        item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
        item.el.style.opacity = String(item.opacity);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      items.forEach((item) => item.el.remove());
    };
  }, [count, iconUrls, size, baseSpeed]);

  return <div ref={containerRef} className={styles.container} />;
}

// ════════════════════════════════════════════════════
//  Bouncing Mode — physics-based edge bouncing
// ════════════════════════════════════════════════════

interface BouncingItem {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

function BouncingMode({ iconUrls, size, count, speed }: Omit<Props, "mode"> & { iconUrls: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<BouncingItem[]>([]);
  const rafRef = useRef<number>(0);

  // Speed: 10→0.5px/frame, 50→1.5px/frame, 100→3px/frame
  const baseVelocity = 0.5 + (speed! / 100) * 2.5;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const items: BouncingItem[] = [];
    for (let i = 0; i < count!; i++) {
      const el = document.createElement("div");
      el.className = styles.bouncingIcon;
      const sizeVar = size! * rand(0.7, 1.3);
      el.style.width = `${sizeVar}px`;
      el.style.height = `${sizeVar}px`;

      const img = document.createElement("img");
      img.src = iconUrls[randInt(0, iconUrls.length - 1)];
      img.alt = "";
      img.className = styles.iconImg;
      img.draggable = false;
      el.appendChild(img);
      container.appendChild(el);

      // Random direction angle
      const angle = rand(0, Math.PI * 2);
      const v = baseVelocity * rand(0.6, 1.4);

      items.push({
        el,
        x: rand(10, vw - sizeVar - 10),
        y: rand(10, vh - sizeVar - 10),
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        size: sizeVar,
        rotation: rand(0, 360),
        rotationSpeed: rand(-1.5, 1.5),
      });
    }
    itemsRef.current = items;

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const item of items) {
        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.rotationSpeed;

        // Bounce off left/right edges
        if (item.x <= 0) {
          item.x = 0;
          item.vx = Math.abs(item.vx) * rand(0.9, 1.1);
          item.rotationSpeed = rand(-2, 2);
        } else if (item.x + item.size >= w) {
          item.x = w - item.size;
          item.vx = -Math.abs(item.vx) * rand(0.9, 1.1);
          item.rotationSpeed = rand(-2, 2);
        }

        // Bounce off top/bottom edges
        if (item.y <= 0) {
          item.y = 0;
          item.vy = Math.abs(item.vy) * rand(0.9, 1.1);
          item.rotationSpeed = rand(-2, 2);
        } else if (item.y + item.size >= h) {
          item.y = h - item.size;
          item.vy = -Math.abs(item.vy) * rand(0.9, 1.1);
          item.rotationSpeed = rand(-2, 2);
        }

        // Clamp velocity to avoid runaway acceleration
        const maxV = baseVelocity * 1.8;
        const currentSpeed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
        if (currentSpeed > maxV) {
          const scale = maxV / currentSpeed;
          item.vx *= scale;
          item.vy *= scale;
        }
        // Also prevent going too slow
        const minV = baseVelocity * 0.4;
        if (currentSpeed < minV) {
          const scale = minV / currentSpeed;
          item.vx *= scale;
          item.vy *= scale;
        }

        item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      items.forEach((item) => item.el.remove());
      itemsRef.current = [];
    };
  }, [count, iconUrls, size, baseVelocity]);

  return <div ref={containerRef} className={styles.container} />;
}
