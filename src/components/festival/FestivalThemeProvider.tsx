"use client";

import { useEffect } from "react";

// Default brand colors — must match globals.css :root
const DEFAULTS = {
  "--color-primary": "#E8652B",
  "--color-primary-hover": "#D4551D",
  "--color-primary-light": "#f09060",
  "--color-topbar-bg": "#0a1628",
  "--color-navbar-bg": "#0f1d36",
  "--color-navbar-bg-end": "#162544",
  "--color-footer-bg": "#0c1829",
  "--color-footer-bg-end": "#0f1d36",
} as const;

/**
 * FestivalThemeProvider
 * Fetches the active festival and overrides CSS custom properties on :root
 * so the entire site changes color. Resets to defaults when no festival.
 */
export default function FestivalThemeProvider() {
  useEffect(() => {
    fetch("/api/festival/active")
      .then((res) => res.json())
      .then((data) => {
        const root = document.documentElement;

        // No active festival → reset to defaults
        if (!data) {
          resetToDefaults(root);
          return;
        }

        const primary = data.colorPrimary;
        const bg = data.colorBg;

        // No custom colors set → reset to defaults
        if (!primary && !bg) {
          resetToDefaults(root);
          return;
        }

        // Apply festival colors
        if (primary) {
          root.style.setProperty("--color-primary", primary);
          root.style.setProperty("--color-primary-hover", darken(primary, 12));
          root.style.setProperty("--color-primary-light", lighten(primary, 20));
        } else {
          // Reset primary to brand defaults
          root.style.setProperty("--color-primary", DEFAULTS["--color-primary"]);
          root.style.setProperty("--color-primary-hover", DEFAULTS["--color-primary-hover"]);
          root.style.setProperty("--color-primary-light", DEFAULTS["--color-primary-light"]);
        }

        if (bg) {
          root.style.setProperty("--color-topbar-bg", darken(bg, 10));
          root.style.setProperty("--color-navbar-bg", bg);
          root.style.setProperty("--color-navbar-bg-end", lighten(bg, 8));
          root.style.setProperty("--color-footer-bg", darken(bg, 5));
          root.style.setProperty("--color-footer-bg-end", bg);
        } else {
          // Reset layout to brand defaults
          root.style.setProperty("--color-topbar-bg", DEFAULTS["--color-topbar-bg"]);
          root.style.setProperty("--color-navbar-bg", DEFAULTS["--color-navbar-bg"]);
          root.style.setProperty("--color-navbar-bg-end", DEFAULTS["--color-navbar-bg-end"]);
          root.style.setProperty("--color-footer-bg", DEFAULTS["--color-footer-bg"]);
          root.style.setProperty("--color-footer-bg-end", DEFAULTS["--color-footer-bg-end"]);
        }
      })
      .catch(() => {
        // On error, ensure defaults are applied
        resetToDefaults(document.documentElement);
      });

    return () => {
      resetToDefaults(document.documentElement);
    };
  }, []);

  return null;
}

function resetToDefaults(root: HTMLElement) {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    root.style.setProperty(key, value);
  }
}

// ── Color helpers ──

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function clamp(v: number) {
  return Math.min(255, Math.max(0, Math.round(v)));
}

function darken(hex: string, pct: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - pct / 100;
  return rgbToHex(clamp(r * f), clamp(g * f), clamp(b * f));
}

function lighten(hex: string, pct: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = pct / 100;
  return rgbToHex(clamp(r + (255 - r) * f), clamp(g + (255 - g) * f), clamp(b + (255 - b) * f));
}
