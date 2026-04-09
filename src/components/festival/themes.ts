// Festival Theme Definitions — particle configs per themeKey
import type { ISourceOptions } from "@tsparticles/engine";

export interface FestivalThemeConfig {
  label: string;
  emoji: string;
  defaultColor: string;
  defaultBg: string;
  particles: (intensity: number, colorOverride?: string | null) => ISourceOptions;
}

// ────── helpers ──────
const scale = (intensity: number, min: number, max: number) =>
  Math.round(min + ((max - min) * intensity) / 100);

// ────── Valentine: falling hearts ──────
const valentineParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 10, 60) },
    shape: { type: "heart" },
    color: { value: colorOverride || ["#e91e63", "#f06292", "#ff80ab", "#ff4081"] },
    opacity: { value: { min: 0.3, max: 0.8 } },
    size: { value: { min: 8, max: 20 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 1, max: 3 },
      outModes: { default: "out" },
      straight: false,
    },
    wobble: { enable: true, distance: 20, speed: 10 },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 5 },
    },
  },
  detectRetina: true,
});

// ────── New Year: fireworks / sparkle burst ──────
const newyearParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 30, 120) },
    shape: { type: ["star", "circle"] },
    color: {
      value: colorOverride
        ? [colorOverride]
        : ["#ffd700", "#ff6b35", "#ff1744", "#00e5ff", "#76ff03", "#e040fb", "#ff4081", "#ffffff"],
    },
    opacity: {
      value: { min: 0.3, max: 1 },
      animation: { enable: true, speed: 0.6 },
    },
    size: {
      value: { min: 1, max: 6 },
      animation: { enable: true, speed: 3, startValue: "random" },
    },
    move: {
      enable: true,
      direction: "none",
      speed: { min: 0.5, max: 3 },
      outModes: { default: "bounce" },
      random: true,
    },
    twinkle: {
      particles: { enable: true, frequency: 0.15, color: { value: "#ffffff" } },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 10 },
    },
    wobble: { enable: true, distance: 20, speed: 8 },
  },
  detectRetina: true,
});

// ────── Songkran: water drops ──────
const songkranParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 10, 50) },
    shape: { type: "circle" },
    color: { value: colorOverride || ["#00bcd4", "#4dd0e1", "#80deea", "#b2ebf2"] },
    opacity: { value: { min: 0.2, max: 0.6 } },
    size: { value: { min: 4, max: 12 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 2, max: 6 },
      outModes: { default: "out" },
    },
    wobble: { enable: true, distance: 15, speed: 8 },
  },
  detectRetina: true,
});

// ────── Christmas: snow ──────
const christmasParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 20, 100) },
    shape: { type: "circle" },
    color: { value: colorOverride || "#ffffff" },
    opacity: { value: { min: 0.3, max: 0.9 } },
    size: { value: { min: 2, max: 6 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 0.5, max: 2 },
      outModes: { default: "out" },
      straight: false,
    },
    wobble: { enable: true, distance: 30, speed: 5 },
  },
  detectRetina: true,
});

// ────── Loy Krathong: floating lanterns ──────
const loyKrathongParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 8, 35) },
    shape: { type: "circle" },
    color: { value: colorOverride || ["#ffab00", "#ff8f00", "#ffca28", "#ffe082"] },
    opacity: {
      value: { min: 0.3, max: 0.8 },
      animation: { enable: true, speed: 0.3 },
    },
    size: { value: { min: 6, max: 16 } },
    move: {
      enable: true,
      direction: "top",
      speed: { min: 0.5, max: 1.5 },
      outModes: { default: "out" },
    },
    wobble: { enable: true, distance: 25, speed: 3 },
  },
  detectRetina: true,
});

// ────── Confetti (generic celebration) ──────
const confettiParticles = (intensity: number, colorOverride?: string | null): ISourceOptions => ({
  fullScreen: { enable: false },
  particles: {
    number: { value: scale(intensity, 20, 80) },
    shape: { type: ["square", "circle"] },
    color: {
      value: colorOverride || ["#ff1744", "#ff9100", "#ffea00", "#00e676", "#2979ff", "#d500f9"],
    },
    opacity: { value: { min: 0.5, max: 1 } },
    size: { value: { min: 3, max: 7 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 1, max: 4 },
      outModes: { default: "out" },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 15 },
    },
    tilt: {
      enable: true,
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 30 },
    },
  },
  detectRetina: true,
});

// ────── Registry ──────
export const FESTIVAL_THEMES: Record<string, FestivalThemeConfig> = {
  valentine: {
    label: "วาเลนไทน์",
    emoji: "💕",
    defaultColor: "#e91e63",
    defaultBg: "#fff0f5",
    particles: valentineParticles,
  },
  newyear: {
    label: "ปีใหม่",
    emoji: "🎆",
    defaultColor: "#ffd700",
    defaultBg: "#1a1a2e",
    particles: newyearParticles,
  },
  songkran: {
    label: "สงกรานต์",
    emoji: "💧",
    defaultColor: "#00bcd4",
    defaultBg: "#e0f7fa",
    particles: songkranParticles,
  },
  christmas: {
    label: "คริสต์มาส",
    emoji: "🎄",
    defaultColor: "#c62828",
    defaultBg: "#1b5e20",
    particles: christmasParticles,
  },
  "loy-krathong": {
    label: "ลอยกระทง",
    emoji: "🏮",
    defaultColor: "#ff8f00",
    defaultBg: "#1a1a2e",
    particles: loyKrathongParticles,
  },
  confetti: {
    label: "Confetti",
    emoji: "🎉",
    defaultColor: "#E8652B",
    defaultBg: "#f5f5f5",
    particles: confettiParticles,
  },
  "labor-day": {
    label: "วันแรงงาน",
    emoji: "⚒️",
    defaultColor: "#d32f2f",
    defaultBg: "#ffebee",
    particles: confettiParticles,
  },
  coronation: {
    label: "วันฉัตรมงคล",
    emoji: "👑",
    defaultColor: "#f9a825",
    defaultBg: "#fff8e1",
    particles: confettiParticles,
  },
  ploughing: {
    label: "วันพืชมงคล",
    emoji: "🌾",
    defaultColor: "#43a047",
    defaultBg: "#e8f5e9",
    particles: confettiParticles,
  },
};

export const EFFECT_OPTIONS = [
  { value: "none", label: "ไม่มี effect" },
  { value: "falling-hearts", label: "💕 หัวใจตก" },
  { value: "fireworks", label: "🎆 พลุ/ดาวกระจาย" },
  { value: "snow", label: "❄️ หิมะตก" },
  { value: "confetti", label: "🎉 Confetti" },
  { value: "water-drops", label: "💧 หยดน้ำ" },
  { value: "lanterns", label: "🏮 โคมลอย" },
];

export const THEME_KEY_OPTIONS = [
  { value: "songkran", label: "💧 สงกรานต์" },
  { value: "labor-day", label: "⚒️ วันแรงงาน" },
  { value: "coronation", label: "👑 วันฉัตรมงคล" },
  { value: "ploughing", label: "🌾 วันพืชมงคล" },
  { value: "valentine", label: "💕 วาเลนไทน์" },
  { value: "newyear", label: "🎆 ปีใหม่" },
  { value: "christmas", label: "🎄 คริสต์มาส" },
  { value: "loy-krathong", label: "🏮 ลอยกระทง" },
  { value: "confetti", label: "🎉 Confetti / ฉลองทั่วไป" },
];

// ────── Preset colors per themeKey ──────
// Auto-fills banner + web theme colors when admin selects a themeKey
export interface ThemePreset {
  bannerBg: string;
  bannerTextColor: string;
  bannerEmoji: string;
  colorPrimary: string;
  colorBg: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  songkran: {
    bannerBg: "#0097a7",
    bannerTextColor: "#ffffff",
    bannerEmoji: "💧",
    colorPrimary: "#00bcd4",
    colorBg: "#0a3d5c",
  },
  "labor-day": {
    bannerBg: "#c62828",
    bannerTextColor: "#ffffff",
    bannerEmoji: "⚒️",
    colorPrimary: "#d32f2f",
    colorBg: "#3e1a1a",
  },
  coronation: {
    bannerBg: "#f9a825",
    bannerTextColor: "#3e2723",
    bannerEmoji: "👑",
    colorPrimary: "#f9a825",
    colorBg: "#1a237e",
  },
  ploughing: {
    bannerBg: "#2e7d32",
    bannerTextColor: "#ffffff",
    bannerEmoji: "🌾",
    colorPrimary: "#43a047",
    colorBg: "#1b3a1b",
  },
  valentine: {
    bannerBg: "#c2185b",
    bannerTextColor: "#ffffff",
    bannerEmoji: "💕",
    colorPrimary: "#e91e63",
    colorBg: "#3e1a2e",
  },
  newyear: {
    bannerBg: "#f57f17",
    bannerTextColor: "#ffffff",
    bannerEmoji: "🎆",
    colorPrimary: "#ffd700",
    colorBg: "#1a1a2e",
  },
  christmas: {
    bannerBg: "#b71c1c",
    bannerTextColor: "#ffffff",
    bannerEmoji: "🎄",
    colorPrimary: "#c62828",
    colorBg: "#1b3a20",
  },
  "loy-krathong": {
    bannerBg: "#e65100",
    bannerTextColor: "#ffffff",
    bannerEmoji: "🏮",
    colorPrimary: "#ff8f00",
    colorBg: "#1a1a2e",
  },
  confetti: {
    bannerBg: "#E8652B",
    bannerTextColor: "#ffffff",
    bannerEmoji: "🎉",
    colorPrimary: "#E8652B",
    colorBg: "#0f1d36",
  },
};

export const ANIMATION_OPTIONS = [
  { value: "none", label: "ไม่มี animation" },
  { value: "santa-sleigh", label: "🎅 ซานต้าขี่กวาง" },
  { value: "cupid", label: "💘 กามเทพยิงธนู" },
  { value: "rocket", label: "🚀 จรวดพลุ" },
];

// Map effect string → themeKey for particle lookup
export const EFFECT_TO_THEME_KEY: Record<string, string> = {
  "falling-hearts": "valentine",
  fireworks: "newyear",
  snow: "christmas",
  confetti: "confetti",
  "water-drops": "songkran",
  lanterns: "loy-krathong",
};
