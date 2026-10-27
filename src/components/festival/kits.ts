/**
 * ชุดเทศกาล (festival kits) — ทุกอย่างที่เลือกประเภทเทศกาลแล้วได้ทันที
 *
 *   palette   สีที่ทับชุดสีกลางของเว็บ (design tokens) ระหว่างเทศกาล
 *   art       ภาพตกแต่งทั้งเว็บ: มุมขวาบน · ของลอยด้านซ้าย · ขอบจอ · รอยต่อช่วงหน้าแรก · ฉากส่วนท้าย
 *   icons     ไอคอนชุดเทศกาล (ใช้กับ "ไอคอนตก/เด้ง")
 *   defaults  Effect / Animation / Icons ที่เติมให้ตอนเลือกประเภท
 *
 * ภาพอยู่ที่ public/festival/<key>/ — สร้างด้วย scripts/festival-art.mjs (ลอยกระทงมีภาพวาดมือเพิ่ม)
 * ไฟล์นี้ใช้ได้ทั้งหน้าเว็บและหน้า admin (ห้าม import โค้ดฝั่งเซิร์ฟเวอร์)
 */
import { REAL_ART } from "./realArt.generated";

export interface FestivalKit {
  key: string;
  label: string;
  emoji: string;
  /** คำอธิบายสั้นในหน้า admin */
  tagline: string;
  /** วันสำคัญเกี่ยวกับสถาบัน — ไม่ใส่ตัวการ์ตูนวิ่งผ่าน */
  formal?: boolean;
  palette: Record<string, string>;
  /** สีพื้นช่วงต่าง ๆ ของหน้าแรก (สลับ 2 ระดับ) */
  sectionBg: [string, string];
  /** สีเงาทับฉากส่วนท้าย (rgb) ให้ตัวหนังสืออ่านง่าย */
  footerTint: string;
  /** ของประดับห้อยใต้เมนูหลัก: ไฟประดับ (เทศกาลกลางคืน) · ธงราว (งานรื่นเริง/กลางวัน) · ไม่มี (วันสำคัญ ต้องการความสุภาพ) — ค่าเริ่มต้น ไฟประดับ */
  navTrim?: "lights" | "pennants" | "none";
  /** เลื่อนฉากส่วนท้ายลง (px) ให้ของในฉากอยู่ใต้ตัวหนังสือแถวล่างสุด — ใช้กับภาพจริงที่ของอยู่สูงกว่าแบบที่วาดไว้ */
  footerShift?: number;
  art: {
    sky: string;
    floaters: string[];
    edgeLeft: string;
    edgeRight: string;
    seam: string;
    footer: string;
  };
  icons: string[];
  defaults: {
    effect: string;
    intensity: number;
    animation: string;
    animationScale: number;
    iconMode: "none" | "falling" | "bouncing";
    iconCount: number;
    iconSize: number;
    iconSpeed: number;
  };
}

const art = (key: string, edge: [string, string] = ["edge-left", "edge-right"]) => ({
  sky: `/festival/${key}/sky.svg`,
  floaters: [`/festival/${key}/icon-1.svg`, `/festival/${key}/icon-2.svg`, `/festival/${key}/icon-1.svg`, `/festival/${key}/icon-3.svg`],
  edgeLeft: `/festival/${key}/${edge[0]}.svg`,
  edgeRight: `/festival/${key}/${edge[1]}.svg`,
  seam: `/festival/${key}/seam.svg`,
  footer: `/festival/${key}/footer-scene.svg`,
});
const icons = (key: string) => [1, 2, 3].map((i) => `/festival/${key}/icon-${i}.svg`);
/** ของลอยด้านซ้ายบน (ใต้เมนู) ใช้ไอคอนไหน — ค่าเริ่มต้นสลับ 1,2,1,3 · ลอยกระทงใช้โคมลอย (icon-2) ทั้งหมด */
const PHOTO_FLOATERS: Record<string, number[]> = { "loy-krathong": [2, 2, 2, 2] };
/** ชุดภาพจริงจากฝ่ายประชาสัมพันธ์ (แปลงด้วย scripts/festival-images.mjs) — WebP โปร่งใส + ฉากส่วนท้าย JPG */
const photoArt = (key: string) => ({
  sky: `/festival/${key}/sky.webp`,
  floaters: (PHOTO_FLOATERS[key] ?? [1, 2, 1, 3]).map((i) => `/festival/${key}/icon-${i}.webp`),
  edgeLeft: `/festival/${key}/edge-left.webp`,
  edgeRight: `/festival/${key}/edge-right.webp`,
  seam: `/festival/${key}/seam.webp`,
  footer: `/festival/${key}/footer-scene.jpg`,
});
/** ไอคอนตกลงมา/เด้งไปมา ใช้ไฟล์ไหน — ลอยกระทง: โคมลอย (icon-2) เป็น Effect และของลอยใต้เมนูอยู่แล้ว จึงใช้กลีบบัว (icon-4) แทน */
const PHOTO_ICONS: Record<string, number[]> = { "loy-krathong": [1, 3, 4] };
const photoIcons = (key: string) => (PHOTO_ICONS[key] ?? [1, 2, 3]).map((i) => `/festival/${key}/icon-${i}.webp`);
const gold = (hex: string, rgb: string) => ({ "--brand-gold-400": hex, "--brand-gold-400-rgb": rgb });
const accent = (hex: string, rgb: string) => ({ "--brand-orange-500": hex, "--brand-orange-500-rgb": rgb });

export const FESTIVAL_KITS: Record<string, FestivalKit> = {
  "loy-krathong": {
    key: "loy-krathong",
    label: "ลอยกระทง",
    emoji: "🏮",
    tagline: "พระจันทร์ โคมลอย ดอกบัว แม่น้ำยามค่ำ",
    palette: {
      "--color-background": "#fbf5ea",
      ...gold("#e0b44a", "224 180 74"),
      "--brand-gold-200": "#fbe8b0",
      "--brand-gold-200-rgb": "251 232 176",
    },
    sectionBg: ["#fbf4e6", "#fffaf2"],
    footerTint: "6 16 38",
    art: {
      ...art("loy-krathong", ["lotus-left", "lotus-right"]),
      floaters: ["/festival/loy-krathong/icon-3.svg", "/festival/loy-krathong/icon-3.svg", "/festival/loy-krathong/icon-3.svg", "/festival/loy-krathong/icon-3.svg"],
    },
    icons: icons("loy-krathong"),
    defaults: { effect: "lanterns", intensity: 25, animation: "krathong-float", animationScale: 50, iconMode: "none", iconCount: 12, iconSize: 40, iconSpeed: 35 },
  },
  songkran: {
    navTrim: "pennants",
    key: "songkran",
    label: "สงกรานต์",
    emoji: "💧",
    tagline: "ดอกมะลิ ขันน้ำ ฟ้าใส สายน้ำ",
    palette: { "--color-background": "#effafc", ...gold("#e0b44a", "224 180 74") },
    sectionBg: ["#eef9fb", "#f8fdfe"],
    footerTint: "3 37 54",
    art: art("songkran"),
    icons: icons("songkran"),
    defaults: { effect: "water-drops", intensity: 30, animation: "elephant-splash", animationScale: 45, iconMode: "falling", iconCount: 10, iconSize: 36, iconSpeed: 35 },
  },
  newyear: {
    key: "newyear",
    label: "ปีใหม่",
    emoji: "🎆",
    tagline: "พลุ ดาว เมืองยามค่ำ ของขวัญ",
    palette: { "--color-background": "#fbf7ef", ...gold("#e8b923", "232 185 35") },
    sectionBg: ["#fbf6ec", "#fffcf6"],
    footerTint: "7 11 31",
    art: art("newyear"),
    icons: icons("newyear"),
    defaults: { effect: "fireworks", intensity: 35, animation: "rocket", animationScale: 45, iconMode: "falling", iconCount: 10, iconSize: 34, iconSpeed: 40 },
  },
  christmas: {
    key: "christmas",
    label: "คริสต์มาส",
    emoji: "🎄",
    tagline: "หิมะ ต้นสน ดาว ของขวัญ",
    palette: { "--color-background": "#f4f9f6", ...accent("#c62828", "198 40 40") },
    sectionBg: ["#f2f8f4", "#fbfdfc"],
    footerTint: "6 19 31",
    footerShift: 36, // ภาพฉากจริง: ยอดต้นคริสต์มาสแตะแถวลิขสิทธิ์ — เลื่อนลงเล็กน้อย
    art: art("christmas"),
    icons: icons("christmas"),
    defaults: { effect: "snow", intensity: 35, animation: "santa-sleigh", animationScale: 40, iconMode: "falling", iconCount: 10, iconSize: 32, iconSpeed: 30 },
  },
  valentine: {
    key: "valentine",
    label: "วาเลนไทน์",
    emoji: "💕",
    tagline: "หัวใจ กุหลาบ โทนชมพูอบอุ่น",
    palette: { "--color-background": "#fdf4f7", ...accent("#e0457b", "224 69 123") },
    sectionBg: ["#fcf1f5", "#fffafc"],
    footerTint: "42 15 34",
    art: art("valentine"),
    icons: icons("valentine"),
    defaults: { effect: "falling-hearts", intensity: 25, animation: "cupid", animationScale: 40, iconMode: "falling", iconCount: 8, iconSize: 34, iconSpeed: 30 },
  },
  savings: {
    navTrim: "pennants",
    key: "savings",
    label: "วันออม",
    emoji: "🐷",
    tagline: "กระปุกออมสิน เหรียญทอง ต้นอ่อน สมุดบัญชี",
    palette: { "--color-background": "#f3f9fd", ...gold("#e0b44a", "224 180 74") },
    sectionBg: ["#eef7fc", "#f9fcff"],
    footerTint: "4 28 74", // สีฟ้าในภาพฉากจริง — ไล่สีต่อกันเนียน
    footerShift: 52,
    art: art("savings"),
    icons: icons("savings"),
    // เว็บการเงิน — ไม่ใส่อนุภาคทั่วจอ ไอคอนน้อย ๆ ช้า ๆ ให้ดูสุภาพ
    defaults: { effect: "none", intensity: 0, animation: "piggy-walk", animationScale: 40, iconMode: "falling", iconCount: 8, iconSize: 34, iconSpeed: 28 },
  },
  halloween: {
    key: "halloween",
    label: "ฮาโลวีน",
    emoji: "🎃",
    tagline: "ฟักทองยิ้ม ค้างคาว ผีน้อย ลูกอม (น่ารัก ไม่น่ากลัว)",
    navTrim: "lights", // เทศกาลกลางคืน — ไฟประดับสีส้ม/ม่วง
    palette: {
      "--color-background": "#fbf8ff",
      ...gold("#f59e0b", "245 158 11"),
      "--brand-gold-200": "#fde3b8",
      "--brand-gold-200-rgb": "253 227 184",
      // หลอดไฟ/สีเน้นเป็นม่วง (สลับกับส้มทอง)
      ...accent("#a855f7", "168 85 247"),
    },
    sectionBg: ["#f9f5ff", "#fefcff"],
    footerTint: "18 11 38",
    art: art("halloween"),
    icons: icons("halloween"),
    defaults: { effect: "bats", intensity: 15, animation: "ghost-float", animationScale: 35, iconMode: "falling", iconCount: 6, iconSize: 32, iconSpeed: 25 },
  },
  agm: {
    key: "agm",
    label: "ประชุมใหญ่สามัญประจำปี",
    emoji: "🗳️",
    tagline: "หีบลงคะแนน รายงานประจำปี แท่นพูด หอประชุม (ทางการ)",
    formal: true, // งานทางการ — ไม่มีตัวการ์ตูนวิ่งผ่าน
    navTrim: "pennants", // ธงราวทอง-ขาวแบบหน้าหอประชุม
    palette: {
      "--color-background": "#f7f8fb",
      ...gold("#d8ae3f", "216 174 63"),
      "--brand-gold-200": "#f7e3a1",
      "--brand-gold-200-rgb": "247 227 161",
    },
    sectionBg: ["#f3f5f9", "#fbfcfe"],
    footerTint: "8 18 38",
    art: art("agm"),
    icons: icons("agm"),
    // ทางการ: ประกายดาวทองเบา ๆ · ไม่มีไอคอนตกลงมา (เปิดเองได้)
    defaults: { effect: "gold-sparkle", intensity: 15, animation: "none", animationScale: 35, iconMode: "none", iconCount: 6, iconSize: 32, iconSpeed: 25 },
  },
  anniversary: {
    navTrim: "pennants",
    key: "anniversary",
    label: "วันครบรอบสหกรณ์",
    emoji: "🏅",
    tagline: "สีประจำสหกรณ์ เหรียญทอง โบว์รางวัล พลุทอง",
    palette: { "--color-background": "#fbf8f1", ...gold("#d8ae3f", "216 174 63") },
    sectionBg: ["#fbf6ea", "#fffdf8"],
    footerTint: "8 18 38",
    art: art("anniversary"),
    icons: icons("anniversary"),
    defaults: { effect: "confetti", intensity: 22, animation: "balloons-up", animationScale: 40, iconMode: "falling", iconCount: 10, iconSize: 34, iconSpeed: 30 },
  },
  coronation: {
    navTrim: "none",
    key: "coronation",
    label: "วันฉัตรมงคล",
    emoji: "👑",
    tagline: "ดาวเรือง ลายทอง โทนเหลือง-ทอง",
    formal: true,
    palette: { "--color-background": "#fffbea", ...gold("#e2b42c", "226 180 44"), "--brand-gold-200": "#fdeeb0", "--brand-gold-200-rgb": "253 238 176" },
    sectionBg: ["#fff9e3", "#fffdf4"],
    footerTint: "11 26 61",
    art: art("coronation"),
    icons: icons("coronation"),
    defaults: { effect: "none", intensity: 0, animation: "none", animationScale: 50, iconMode: "falling", iconCount: 10, iconSize: 32, iconSpeed: 25 },
  },
  ploughing: {
    navTrim: "none",
    key: "ploughing",
    label: "วันพืชมงคล",
    emoji: "🌾",
    tagline: "ทุ่งข้าว รวงข้าว รุ่งอรุณ",
    formal: true,
    palette: { "--color-background": "#f6fbf1", ...gold("#d9a72f", "217 167 47") },
    sectionBg: ["#f3f9ec", "#fbfdf8"],
    footerTint: "20 28 60",
    art: art("ploughing"),
    icons: icons("ploughing"),
    defaults: { effect: "none", intensity: 0, animation: "none", animationScale: 50, iconMode: "falling", iconCount: 8, iconSize: 32, iconSpeed: 25 },
  },
  "makha-bucha": {
    navTrim: "none",
    key: "makha-bucha",
    label: "วันมาฆบูชา",
    emoji: "🪷",
    tagline: "พระจันทร์เต็มดวง เวียนเทียน ดอกบัวตูม ธรรมจักร (สงบ ทางการ)",
    formal: true,
    palette: { "--color-background": "#faf7f0", ...gold("#d9a93c", "217 169 60"), "--brand-gold-200": "#fde9b5", "--brand-gold-200-rgb": "253 233 181" },
    sectionBg: ["#f8f4ea", "#fdfbf6"],
    footerTint: "10 18 48",
    art: art("makha-bucha"),
    icons: icons("makha-bucha"),
    // วันสำคัญทางศาสนา: ประกายทองเบา ๆ · ไม่มีตัวการ์ตูน · ไอคอนตกช้า ๆ ไม่กี่ชิ้น
    defaults: { effect: "gold-sparkle", intensity: 12, animation: "none", animationScale: 50, iconMode: "falling", iconCount: 6, iconSize: 32, iconSpeed: 22 },
  },
  "labor-day": {
    navTrim: "pennants",
    key: "labor-day",
    label: "วันแรงงาน",
    emoji: "⚒️",
    tagline: "ฟันเฟือง เมือง พลังคนทำงาน",
    palette: { "--color-background": "#f7f8fb" },
    sectionBg: ["#f4f6fa", "#fbfcfe"],
    footerTint: "18 15 36",
    art: art("labor-day"),
    icons: icons("labor-day"),
    defaults: { effect: "none", intensity: 0, animation: "none", animationScale: 50, iconMode: "bouncing", iconCount: 6, iconSize: 32, iconSpeed: 25 },
  },
  confetti: {
    navTrim: "pennants",
    key: "confetti",
    label: "ฉลองทั่วไป",
    emoji: "🎉",
    tagline: "ลูกโป่ง ริบบิ้น กระดาษสี",
    palette: { "--color-background": "#fbf8ff" },
    sectionBg: ["#f8f5ff", "#fdfcff"],
    footerTint: "13 16 51",
    art: art("confetti"),
    icons: icons("confetti"),
    defaults: { effect: "confetti", intensity: 30, animation: "balloons-up", animationScale: 45, iconMode: "none", iconCount: 10, iconSize: 34, iconSpeed: 40 },
  },
};

/* ── สีประจำธีมจากฝ่ายประชาสัมพันธ์ (สีประจำธีม.txt) ── */
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** ผสมสีกับสีขาว: amount 0 = สีเดิม, 1 = ขาว */
const tint = (hex: string, amount: number) =>
  "#" + hexRgb(hex).map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0")).join("");
function applyColors(kit: FestivalKit, [dark, accent, light]: [string, string, string]) {
  // 1) เข้ม → เงาทับฉากส่วนท้าย
  kit.footerTint = hexRgb(dark).join(" ");
  // 2) เน้น → ทอง/จุดเน้นทั้งเว็บ (+ โทนอ่อนของสีเน้น)
  const soft = tint(accent, 0.62);
  kit.palette = {
    ...kit.palette,
    "--brand-gold-400": accent,
    "--brand-gold-400-rgb": hexRgb(accent).join(" "),
    "--brand-gold-200": soft,
    "--brand-gold-200-rgb": hexRgb(soft).join(" "),
    // 3) อ่อน → พื้นหน้าเว็บ ผสมขาวมาก ๆ ให้เป็นแค่โทน ไม่รบกวนการอ่าน
    "--color-background": tint(light, 0.93),
  };
  kit.sectionBg = [tint(light, 0.91), tint(light, 0.96)];
}

// เทศกาลที่มีภาพจริงแล้ว (สร้างโดย scripts/festival-images.mjs) → ใช้ภาพจริงแทนภาพวาด + สีประจำธีม (ถ้ามี)
for (const key of Object.keys(REAL_ART)) {
  const kit = FESTIVAL_KITS[key];
  if (!kit) continue;
  // ส่วนที่ยังไม่มีภาพจริง ใช้ภาพวาดเดิมของส่วนนั้นไปก่อน (เว็บไม่เสีย ระหว่างรอฝ่ายประชาสัมพันธ์)
  const drawn = kit.art;
  const photo = photoArt(key);
  const missing = new Set(REAL_ART[key].missing ?? []);
  kit.art = {
    ...photo,
    sky: missing.has("sky") ? drawn.sky : photo.sky,
    seam: missing.has("seam") ? drawn.seam : photo.seam,
    edgeLeft: missing.has("edge-left") ? drawn.edgeLeft : photo.edgeLeft,
    edgeRight: missing.has("edge-left") ? drawn.edgeRight : photo.edgeRight,
    footer: missing.has("footer-scene") ? drawn.footer : photo.footer,
  };
  // ถ้ายังไม่มีไฟล์ไอคอนที่กำหนดไว้ (เช่น icon-4 ของลอยกระทง) สคริปต์ยังไม่ได้สร้าง → ใช้ชุด 1–3 ไปก่อน
  kit.icons = REAL_ART[key].icons ? photoIcons(key) : [1, 2, 3].map((i) => `/festival/${key}/icon-${i}.webp`);
  const colors = REAL_ART[key].colors;
  if (colors) applyColors(kit, colors);
}

export const KIT_ORDER = ["savings", "halloween", "agm", "anniversary", "loy-krathong", "songkran", "newyear", "christmas", "valentine", "coronation", "ploughing", "makha-bucha", "labor-day", "confetti"];
