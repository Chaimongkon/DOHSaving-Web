/**
 * สร้างภาพประกอบธีมเทศกาล (SVG) ทั้งชุด → public/festival/<theme>/
 *
 *   node scripts/festival-art.mjs
 *
 * ต่อธีม: icon-1..3.svg (ไอคอนตก/เด้ง + ของลอยหัวเว็บ) · sky.svg (ของตกแต่งมุมขวาบน)
 *         seam.svg (ของลอยบนรอยต่อช่วงหน้าแรก) · edge-left/right.svg (ขอบจอ) · footer-scene.svg (ฉากส่วนท้าย)
 * ลอยกระทงมีภาพวาดมือชุดเดิมอยู่แล้ว — สคริปต์นี้เพิ่มเฉพาะไอคอน/พระจันทร์/โคม ที่ระบบกลางต้องใช้
 * แก้ภาพ: แก้ฟังก์ชันวาดหรือชุดค่าของธีมด้านล่าง แล้วรันใหม่
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "festival");

/* ════════════════════ เครื่องมือพื้นฐาน ════════════════════ */
const f = (n) => Math.round(n * 100) / 100;
const svg = (w, h, body, defs = "", extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>\n<defs>${defs}</defs>\n${body}\n</svg>\n`;
const lin = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join("")}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join("")}</radialGradient>`;
/** สุ่มแบบกำหนดได้ (ภาพเหมือนเดิมทุกครั้งที่รัน) */
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const glow = (cx, cy, r, color, op = 0.5, id = "g") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`.replace("url(#g)", `url(#${id})`) + (op ? "" : "");

/* ════════════════════ ชิ้นส่วนภาพ ════════════════════ */
const flower5 = (cx, cy, r, fill, center = "#f6c445", stroke = "none", rot = 0) =>
  `<g transform="rotate(${rot} ${cx} ${cy})">${[0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="${cx}" cy="${f(cy - r * 0.55)}" rx="${f(r * 0.4)}" ry="${f(r * 0.58)}" fill="${fill}" stroke="${stroke}" stroke-width="0.8" transform="rotate(${a} ${cx} ${cy})"/>`)
    .join("")}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.28)}" fill="${center}"/></g>`;

const marigold = (cx, cy, r) => {
  const ring = (rr, pr, n, c) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return `<circle cx="${f(cx + Math.cos(a) * rr)}" cy="${f(cy + Math.sin(a) * rr)}" r="${f(pr)}" fill="${c}"/>`;
    }).join("");
  return `<g>${ring(r * 0.72, r * 0.34, 14, "#f59e0b")}${ring(r * 0.46, r * 0.3, 11, "#fbbf24")}${ring(r * 0.2, r * 0.24, 7, "#f97316")}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.16)}" fill="#c2410c"/></g>`;
};

const heart = (cx, cy, s, fill, stroke = "none") =>
  `<path d="M${f(cx)} ${f(cy + s * 0.36)} C${f(cx - s * 0.62)} ${f(cy - s * 0.04)} ${f(cx - s * 0.56)} ${f(cy - s * 0.7)} ${f(cx)} ${f(cy - s * 0.34)} C${f(cx + s * 0.56)} ${f(cy - s * 0.7)} ${f(cx + s * 0.62)} ${f(cy - s * 0.04)} ${f(cx)} ${f(cy + s * 0.36)} Z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;

const star = (cx, cy, R, r, fill, n = 5, rot = -90) => {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    return `${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`;
  });
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
};

const snowflake = (cx, cy, r, stroke = "#ffffff", w = 2) =>
  `<g stroke="${stroke}" stroke-width="${w}" stroke-linecap="round">${[0, 60, 120]
    .map((a) => `<line x1="${cx}" y1="${f(cy - r)}" x2="${cx}" y2="${f(cy + r)}" transform="rotate(${a} ${cx} ${cy})"/>`)
    .join("")}${[0, 60, 120, 180, 240, 300]
    .map(
      (a) =>
        `<path d="M${cx} ${f(cy - r * 0.62)} l${f(-r * 0.22)} ${f(-r * 0.2)} M${cx} ${f(cy - r * 0.62)} l${f(r * 0.22)} ${f(-r * 0.2)}" transform="rotate(${a} ${cx} ${cy})" fill="none"/>`
    )
    .join("")}</g>`;

const ornament = (cx, cy, r, c1, c2) =>
  `<g><rect x="${f(cx - r * 0.22)}" y="${f(cy - r * 1.22)}" width="${f(r * 0.44)}" height="${f(r * 0.3)}" rx="2" fill="#d8ae3f"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c1}"/><path d="M${f(cx - r)} ${cy} Q${cx} ${f(cy + r * 0.35)} ${f(cx + r)} ${cy}" stroke="${c2}" stroke-width="${f(r * 0.18)}" fill="none"/><circle cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.38)}" r="${f(r * 0.22)}" fill="#ffffff" opacity="0.55"/></g>`;

const pine = (x, y, h, color = "#1f6b3a", snow = false) => {
  const w = h * 0.62;
  const tier = (top, bw, bh) =>
    `<path d="M${x} ${f(top)} L${f(x + bw / 2)} ${f(top + bh)} L${f(x - bw / 2)} ${f(top + bh)} Z" fill="${color}"/>${
      snow ? `<path d="M${x} ${f(top)} L${f(x + bw * 0.16)} ${f(top + bh * 0.3)} Q${x} ${f(top + bh * 0.24)} ${f(x - bw * 0.16)} ${f(top + bh * 0.3)} Z" fill="#ffffff" opacity="0.9"/>` : ""
    }`;
  return `<g><rect x="${f(x - h * 0.05)}" y="${f(y - h * 0.12)}" width="${f(h * 0.1)}" height="${f(h * 0.12)}" fill="#6b4423"/>${tier(y - h, w * 0.55, h * 0.4)}${tier(y - h * 0.72, w * 0.78, h * 0.38)}${tier(y - h * 0.45, w, h * 0.35)}</g>`;
};

const gift = (x, y, s, box, ribbon) =>
  `<g><rect x="${x}" y="${y}" width="${s}" height="${f(s * 0.8)}" rx="${f(s * 0.06)}" fill="${box}"/><rect x="${f(x - s * 0.06)}" y="${f(y - s * 0.02)}" width="${f(s * 1.12)}" height="${f(s * 0.22)}" rx="${f(s * 0.05)}" fill="${box}" stroke="rgba(0,0,0,0.12)"/><rect x="${f(x + s * 0.42)}" y="${f(y - s * 0.02)}" width="${f(s * 0.16)}" height="${f(s * 0.82)}" fill="${ribbon}"/><ellipse cx="${f(x + s * 0.36)}" cy="${f(y - s * 0.1)}" rx="${f(s * 0.16)}" ry="${f(s * 0.1)}" fill="${ribbon}" transform="rotate(-25 ${f(x + s * 0.36)} ${f(y - s * 0.1)})"/><ellipse cx="${f(x + s * 0.64)}" cy="${f(y - s * 0.1)}" rx="${f(s * 0.16)}" ry="${f(s * 0.1)}" fill="${ribbon}" transform="rotate(25 ${f(x + s * 0.64)} ${f(y - s * 0.1)})"/></g>`;

const balloon = (cx, cy, r, color, string = true) =>
  `<g>${string ? `<path d="M${cx} ${f(cy + r * 1.18)} q${f(-r * 0.3)} ${f(r * 0.6)} 0 ${f(r * 1.1)} t0 ${f(r * 1.1)}" stroke="#94a3b8" stroke-width="1.4" fill="none"/>` : ""}<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * 1.18)}" fill="${color}"/><path d="M${f(cx - r * 0.14)} ${f(cy + r * 1.24)} L${f(cx + r * 0.14)} ${f(cy + r * 1.24)} L${cx} ${f(cy + r * 1.1)} Z" fill="${color}"/><ellipse cx="${f(cx - r * 0.36)}" cy="${f(cy - r * 0.45)}" rx="${f(r * 0.2)}" ry="${f(r * 0.32)}" fill="#ffffff" opacity="0.45" transform="rotate(-20 ${f(cx - r * 0.36)} ${f(cy - r * 0.45)})"/></g>`;

const gear = (cx, cy, r, teeth, fill) => {
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.8;
    pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return `<path d="M${pts.join(" L")} Z M${f(cx + r * 0.32)} ${cy} A${f(r * 0.32)} ${f(r * 0.32)} 0 1 0 ${f(cx - r * 0.32)} ${cy} A${f(r * 0.32)} ${f(r * 0.32)} 0 1 0 ${f(cx + r * 0.32)} ${cy} Z" fill="${fill}" fill-rule="evenodd"/>`;
};

const riceSheaf = (x, y, h, color = "#e3b341") => {
  let out = "";
  const stems = [-0.34, -0.2, -0.06, 0.08, 0.22, 0.36];
  stems.forEach((d, i) => {
    const tipX = x + d * h * 0.9;
    const tipY = y - h * (0.92 - Math.abs(d) * 0.3);
    out += `<path d="M${x} ${y} Q${f(x + d * h * 0.3)} ${f(y - h * 0.5)} ${f(tipX)} ${f(tipY)}" stroke="#b08a2e" stroke-width="2" fill="none"/>`;
    for (let g = 0; g < 6; g++) {
      const t = 0.62 + g * 0.065;
      const gx = x + (tipX - x) * t + (i % 2 ? 3 : -3);
      const gy = y + (tipY - y) * t;
      out += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="2.6" ry="5" fill="${color}" transform="rotate(${f(d * 60 + (g % 2 ? 25 : -25))} ${f(gx)} ${f(gy)})"/>`;
    }
  });
  out += `<rect x="${f(x - h * 0.08)}" y="${f(y - h * 0.32)}" width="${f(h * 0.16)}" height="${f(h * 0.07)}" rx="2" fill="#c2410c"/>`;
  out += `<path d="M${f(x - h * 0.05)} ${y} L${f(x - h * 0.1)} ${f(y + h * 0.12)} M${x} ${y} L${x} ${f(y + h * 0.14)} M${f(x + h * 0.05)} ${y} L${f(x + h * 0.1)} ${f(y + h * 0.12)}" stroke="#b08a2e" stroke-width="2.4"/>`;
  return `<g>${out}</g>`;
};

const waterBowl = (cx, cy, s) =>
  `<g><ellipse cx="${cx}" cy="${f(cy + s * 0.42)}" rx="${f(s * 0.46)}" ry="${f(s * 0.08)}" fill="#0e7490" opacity="0.25"/><path d="M${f(cx - s * 0.5)} ${cy} Q${f(cx - s * 0.46)} ${f(cy + s * 0.42)} ${cx} ${f(cy + s * 0.42)} Q${f(cx + s * 0.46)} ${f(cy + s * 0.42)} ${f(cx + s * 0.5)} ${cy} Z" fill="url(#silver)"/><ellipse cx="${cx}" cy="${cy}" rx="${f(s * 0.5)}" ry="${f(s * 0.11)}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/><ellipse cx="${cx}" cy="${f(cy + s * 0.01)}" rx="${f(s * 0.43)}" ry="${f(s * 0.08)}" fill="#7dd3fc"/>${flower5(f(cx - s * 0.12), f(cy - s * 0.03), s * 0.12, "#ffffff", "#fde68a", "#e2e8f0", 10)}${flower5(f(cx + s * 0.14), f(cy - s * 0.02), s * 0.1, "#ffffff", "#fde68a", "#e2e8f0", 40)}<path d="M${f(cx - s * 0.3)} ${f(cy + s * 0.12)} Q${cx} ${f(cy + s * 0.2)} ${f(cx + s * 0.3)} ${f(cy + s * 0.12)}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="2" fill="none"/></g>`;

const drop = (cx, cy, s, fill = "url(#drop)") =>
  `<path d="M${cx} ${f(cy - s * 0.6)} C${f(cx + s * 0.42)} ${f(cy - s * 0.05)} ${f(cx + s * 0.42)} ${f(cy + s * 0.42)} ${cx} ${f(cy + s * 0.42)} C${f(cx - s * 0.42)} ${f(cy + s * 0.42)} ${f(cx - s * 0.42)} ${f(cy - s * 0.05)} ${cx} ${f(cy - s * 0.6)} Z" fill="${fill}"/><ellipse cx="${f(cx - s * 0.12)}" cy="${f(cy + s * 0.08)}" rx="${f(s * 0.08)}" ry="${f(s * 0.14)}" fill="#ffffff" opacity="0.6"/>`;

const firework = (cx, cy, R, color, rays = 16, w = 3) => {
  let out = `<circle cx="${cx}" cy="${cy}" r="${f(R * 1.15)}" fill="${color}" opacity="0.12"/>`;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const r0 = R * 0.28;
    const r1 = R * (i % 2 ? 0.82 : 1);
    out += `<line x1="${f(cx + Math.cos(a) * r0)}" y1="${f(cy + Math.sin(a) * r0)}" x2="${f(cx + Math.cos(a) * r1)}" y2="${f(cy + Math.sin(a) * r1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    out += `<circle cx="${f(cx + Math.cos(a) * (r1 + w * 2))}" cy="${f(cy + Math.sin(a) * (r1 + w * 2))}" r="${f(w * 0.75)}" fill="${color}"/>`;
  }
  return `<g>${out}<circle cx="${cx}" cy="${cy}" r="${f(w * 1.4)}" fill="#fff7cc"/></g>`;
};

const sun = (cx, cy, r, rays = true, c1 = "#fff7cc", c2 = "#fbbf24") =>
  `<g>${rays
    ? Array.from({ length: 12 }, (_, i) => `<path d="M${cx} ${f(cy - r * 1.25)} L${f(cx + r * 0.12)} ${f(cy - r * 1.6)} L${f(cx - r * 0.12)} ${f(cy - r * 1.6)} Z" fill="${c2}" opacity="0.7" transform="rotate(${i * 30} ${cx} ${cy})"/>`).join("")
    : ""}<circle cx="${cx}" cy="${cy}" r="${f(r * 1.9)}" fill="url(#sunGlow)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sunBody)"/></g>`;
const SUN_DEFS = rad("sunGlow", [[0, "#ffe9a8", 0.6], [1, "#ffe9a8", 0]]) + rad("sunBody", [[0, "#fffbe6"], [0.6, "#fde68a"], [1, "#f59e0b"]], 0.42, 0.4, 0.65);

const moon = (cx, cy, r) =>
  `<g><circle cx="${cx}" cy="${cy}" r="${f(r * 2.6)}" fill="url(#moonGlow)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonBody)"/><g fill="#e2c271" opacity="0.35"><circle cx="${f(cx - r * 0.3)}" cy="${f(cy - r * 0.25)}" r="${f(r * 0.16)}"/><circle cx="${f(cx + r * 0.32)}" cy="${f(cy + r * 0.25)}" r="${f(r * 0.11)}"/></g></g>`;
const MOON_DEFS = rad("moonGlow", [[0, "#ffe9a8", 0.45], [1, "#ffe9a8", 0]]) + rad("moonBody", [[0, "#fffbe8"], [0.7, "#fbe7a6"], [1, "#efcb6c"]], 0.42, 0.4, 0.65);

const stars = (seed, n, w, h, color = "#ffffff") => {
  const r = rng(seed);
  return `<g fill="${color}">${Array.from({ length: n }, () => `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(0.8 + r() * 1)}" opacity="${f(0.35 + r() * 0.55)}"/>`).join("")}</g>`;
};

const skyline = (seed, y, color, windows = "#fcd34d", x0 = 0, x1 = 1600) => {
  const r = rng(seed);
  let x = x0;
  let out = "";
  while (x < x1) {
    const w = 30 + r() * 60;
    const h = 30 + r() * 110;
    out += `<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h + 4)}" fill="${color}"/>`;
    for (let wy = y - h + 10; wy < y - 8; wy += 14)
      for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() > 0.62) out += `<rect x="${f(wx)}" y="${f(wy)}" width="5" height="6" fill="${windows}" opacity="${f(0.45 + r() * 0.4)}"/>`;
    x += w + 2 + r() * 8;
  }
  return `<g>${out}</g>`;
};

const hills = (y, color, amp = 30, seed = 3) => {
  const r = rng(seed);
  let d = `M0 ${y}`;
  for (let x = 0; x <= 1600; x += 200) d += ` Q${x + 100} ${f(y - amp - r() * amp)} ${x + 200} ${y}`;
  return `<path d="${d} L1600 460 L0 460 Z" fill="${color}"/>`;
};

const chedi = (x, y, h, color) =>
  `<path d="M${f(x - h * 0.22)} ${y} L${f(x - h * 0.22)} ${f(y - h * 0.3)} Q${f(x - h * 0.2)} ${f(y - h * 0.45)} ${f(x - h * 0.06)} ${f(y - h * 0.55)} L${x} ${f(y - h)} L${f(x + h * 0.06)} ${f(y - h * 0.55)} Q${f(x + h * 0.2)} ${f(y - h * 0.45)} ${f(x + h * 0.22)} ${f(y - h * 0.3)} L${f(x + h * 0.22)} ${y} Z" fill="${color}"/>`;

const ripple = (y, color, op = 0.14, seed = 7) => {
  const r = rng(seed);
  return `<g fill="${color}" opacity="${op}">${Array.from({ length: 10 }, () => `<rect x="${f(r() * 1500)}" y="${f(y + r() * 120)}" width="${f(80 + r() * 160)}" height="2" rx="1"/>`).join("")}</g>`;
};

const confettiBits = (seed, n, w, h, colors) => {
  const r = rng(seed);
  return `<g>${Array.from({ length: n }, () => {
    const x = r() * w, y = r() * h, c = colors[Math.floor(r() * colors.length)], a = r() * 180;
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(5 + r() * 6)}" height="${f(3 + r() * 3)}" rx="1" fill="${c}" opacity="0.85" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
  }).join("")}</g>`;
};

const streamer = (x, y, len, color, seed = 1) => {
  const r = rng(seed);
  let d = `M${x} ${y}`;
  for (let i = 1; i <= 6; i++) d += ` q${f(len / 12)} ${f((i % 2 ? -1 : 1) * (8 + r() * 10))} ${f(len / 6)} ${f(6 + r() * 6)}`;
  return `<path d="${d}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
};

const pennants = (x0, x1, y, colors) => {
  const n = Math.floor((x1 - x0) / 34);
  let out = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + 26} ${x1} ${y}" stroke="#d8ae3f" stroke-width="1.6" fill="none"/>`;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y + 26 * 4 * t * (1 - t) * 0.5 * 2 * 0.5 + 26 * t * (1 - t) * 2;
    out += `<path d="M${f(x - 10)} ${f(yy)} L${f(x + 10)} ${f(yy)} L${f(x)} ${f(yy + 22)} Z" fill="${colors[i % colors.length]}"/>`;
  }
  return `<g>${out}</g>`;
};

const rose = (cx, cy, r, color = "#e11d48", dark = "#9f1239", stem = true) =>
  `<g>${stem ? `<path d="M${cx} ${f(cy + r * 0.8)} Q${f(cx - r * 0.2)} ${f(cy + r * 1.8)} ${f(cx + r * 0.1)} ${f(cy + r * 2.6)}" stroke="#15803d" stroke-width="${f(r * 0.16)}" fill="none" stroke-linecap="round"/><path d="M${f(cx - r * 0.05)} ${f(cy + r * 1.7)} q${f(-r * 0.9)} ${f(-r * 0.2)} ${f(-r * 1.0)} ${f(-r * 0.7)} q${f(r * 0.7)} ${f(-r * 0.05)} ${f(r * 1.0)} ${f(r * 0.7)} Z" fill="#22c55e"/>` : ""}<path d="M${f(cx - r)} ${f(cy - r * 0.1)} Q${f(cx - r * 0.95)} ${f(cy + r)} ${cx} ${f(cy + r)} Q${f(cx + r * 0.95)} ${f(cy + r)} ${f(cx + r)} ${f(cy - r * 0.1)} Q${f(cx + r * 0.5)} ${f(cy - r * 0.35)} ${cx} ${f(cy - r * 0.05)} Q${f(cx - r * 0.5)} ${f(cy - r * 0.35)} ${f(cx - r)} ${f(cy - r * 0.1)} Z" fill="${color}"/><path d="M${f(cx - r * 0.7)} ${f(cy - r * 0.2)} Q${f(cx - r * 0.6)} ${f(cy - r * 1.05)} ${cx} ${f(cy - r * 0.95)} Q${f(cx + r * 0.6)} ${f(cy - r * 1.05)} ${f(cx + r * 0.7)} ${f(cy - r * 0.2)} Q${cx} ${f(cy + r * 0.25)} ${f(cx - r * 0.7)} ${f(cy - r * 0.2)} Z" fill="${dark}"/><path d="M${f(cx - r * 0.35)} ${f(cy - r * 0.45)} Q${cx} ${f(cy - r * 0.85)} ${f(cx + r * 0.35)} ${f(cy - r * 0.45)} Q${cx} ${f(cy - r * 0.15)} ${f(cx - r * 0.35)} ${f(cy - r * 0.45)} Z" fill="${color}"/></g>`;

const coin = (cx, cy, r) =>
  `<g><circle cx="${cx}" cy="${f(cy + r * 0.12)}" r="${r}" fill="#a16207"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#coin)"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.74)}" fill="none" stroke="#b7791f" stroke-width="${f(r * 0.08)}"/>${star(cx, cy, r * 0.42, r * 0.18, "#b7791f")}</g>`;
const COIN_DEFS = rad("coin", [[0, "#fff4c2"], [0.6, "#f6cf55"], [1, "#d8a02a"]], 0.4, 0.35, 0.7);

const coinStack = (x, y, r, n) =>
  `<g>${Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${f(y - i * r * 0.32)}" rx="${r}" ry="${f(r * 0.34)}" fill="${i % 2 ? "#e9b949" : "#d8a02a"}" stroke="#a16207" stroke-width="1"/>`).join("")}<ellipse cx="${x}" cy="${f(y - (n - 1) * r * 0.32)}" rx="${f(r * 0.7)}" ry="${f(r * 0.22)}" fill="none" stroke="#fff4c2" stroke-width="1.2" opacity="0.7"/></g>`;

/** โบว์รางวัล/เหรียญครบรอบ: ริบบิ้นน้ำเงิน-ส้ม · ขอบหยักทอง · ดาวกลาง */
const rosette = (cx, cy, r) =>
  `<g><path d="M${f(cx - r * 0.55)} ${f(cy + r * 0.5)} L${f(cx - r * 0.85)} ${f(cy + r * 1.9)} L${f(cx - r * 0.45)} ${f(cy + r * 1.65)} L${f(cx - r * 0.2)} ${f(cy + r * 2)} L${f(cx - r * 0.05)} ${f(cy + r * 0.7)} Z" fill="#1d3a6e"/><path d="M${f(cx + r * 0.55)} ${f(cy + r * 0.5)} L${f(cx + r * 0.85)} ${f(cy + r * 1.9)} L${f(cx + r * 0.45)} ${f(cy + r * 1.65)} L${f(cx + r * 0.2)} ${f(cy + r * 2)} L${f(cx + r * 0.05)} ${f(cy + r * 0.7)} Z" fill="#e8652b"/>${gear(cx, cy, r, 16, "#d8ae3f")}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.78)}" fill="url(#coin)"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.6)}" fill="#0f1d36"/>${star(cx, cy, r * 0.42, r * 0.17, "#f7e3a1")}</g>`;

/** อาคารสำนักงาน (เงา) — หน้าจั่ว เสา บันได */
const office = (x, y, w, color) => {
  const h = w * 0.42;
  const cols = Array.from({ length: 6 }, (_, i) => `<rect x="${f(x - w * 0.36 + i * w * 0.144)}" y="${f(y - h * 0.62)}" width="${f(w * 0.05)}" height="${f(h * 0.52)}" fill="#fcd34d" opacity="0.18"/>`).join("");
  return `<g><path d="M${f(x - w * 0.46)} ${f(y - h * 0.66)} L${x} ${f(y - h * 1.15)} L${f(x + w * 0.46)} ${f(y - h * 0.66)} Z" fill="${color}"/><path d="M${f(x - w * 0.3)} ${f(y - h * 0.74)} L${x} ${f(y - h * 1.02)} L${f(x + w * 0.3)} ${f(y - h * 0.74)}" stroke="#d8ae3f" stroke-width="2" fill="none" opacity="0.7"/><rect x="${f(x - w * 0.42)}" y="${f(y - h * 0.68)}" width="${f(w * 0.84)}" height="${f(h * 0.68)}" fill="${color}"/>${cols}<rect x="${f(x - w * 0.5)}" y="${f(y - h * 0.1)}" width="${f(w)}" height="${f(h * 0.1)}" fill="${color}"/></g>`;
};

/** กระปุกออมสิน (หันขวา) วาดในกรอบ 200×160 — วางด้วย translate/scale */
const PIG_DEFS = lin("pig", [[0, "#fdd5e5"], [1, "#f29ac0"]]);
const piggyRaw = (withCoin = true) =>
  `<path d="M32 74 q-20 -4 -14 -20 q9 -7 11 6" stroke="#e57aa6" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="52" y="104" width="22" height="40" rx="9" fill="#e98ab0"/><rect x="124" y="104" width="22" height="40" rx="9" fill="#e98ab0"/>
  <ellipse cx="96" cy="86" rx="70" ry="52" fill="url(#pig)"/>
  <rect x="72" y="110" width="22" height="38" rx="9" fill="#f29ac0"/><rect x="142" y="108" width="22" height="38" rx="9" fill="#f29ac0"/>
  <path d="M126 44 L138 14 L158 46 Z" fill="#e98ab0"/><path d="M132 40 L139 22 L150 42 Z" fill="#fbcfe0"/>
  <circle cx="150" cy="80" r="34" fill="url(#pig)"/>
  <ellipse cx="182" cy="88" rx="16" ry="13" fill="#f472a6"/><ellipse cx="177" cy="88" rx="2.6" ry="4" fill="#9d174d"/><ellipse cx="187" cy="88" rx="2.6" ry="4" fill="#9d174d"/>
  <circle cx="160" cy="70" r="4.6" fill="#1f2937"/><circle cx="161.6" cy="68.4" r="1.4" fill="#fff"/>
  <circle cx="154" cy="96" r="6" fill="#fb7185" opacity="0.45"/>
  <ellipse cx="66" cy="62" rx="18" ry="8" fill="#ffffff" opacity="0.35" transform="rotate(-22 66 62)"/>
  <rect x="82" y="36" width="32" height="7" rx="3.5" fill="#9d174d"/>${withCoin ? coin(98, 18, 13) : ""}`;
const piggy = (x, y, scale, withCoin = true) => `<g transform="translate(${x} ${y}) scale(${scale})">${piggyRaw(withCoin)}</g>`;

const sprout = (x, y, s) =>
  `<g><path d="M${x} ${y} Q${f(x - s * 0.05)} ${f(y - s * 0.5)} ${x} ${f(y - s)}" stroke="#15803d" stroke-width="${f(s * 0.08)}" fill="none" stroke-linecap="round"/><path d="M${x} ${f(y - s * 0.62)} C${f(x - s * 0.2)} ${f(y - s * 0.95)} ${f(x - s * 0.7)} ${f(y - s * 0.95)} ${f(x - s * 0.72)} ${f(y - s * 0.7)} C${f(x - s * 0.5)} ${f(y - s * 0.55)} ${f(x - s * 0.15)} ${f(y - s * 0.55)} ${x} ${f(y - s * 0.62)} Z" fill="#4ade80"/><path d="M${x} ${f(y - s * 0.82)} C${f(x + s * 0.2)} ${f(y - s * 1.15)} ${f(x + s * 0.75)} ${f(y - s * 1.12)} ${f(x + s * 0.78)} ${f(y - s * 0.86)} C${f(x + s * 0.55)} ${f(y - s * 0.72)} ${f(x + s * 0.18)} ${f(y - s * 0.72)} ${x} ${f(y - s * 0.82)} Z" fill="#22c55e"/></g>`;

const coinSprout = (x, y, r) => coinStack(x, y, r, 4) + sprout(x, y - r * 1.1, r * 1.6);

const passbook = (x, y, w) => {
  const h = w * 0.72;
  return `<g transform="rotate(-8 ${f(x + w / 2)} ${f(y + h / 2)})"><rect x="${f(x + 4)}" y="${f(y + 5)}" width="${w}" height="${f(h)}" rx="${f(w * 0.06)}" fill="#0b1e45" opacity="0.35"/><rect x="${x}" y="${y}" width="${w}" height="${f(h)}" rx="${f(w * 0.06)}" fill="url(#book)"/><rect x="${f(x + w * 0.08)}" y="${y}" width="${f(w * 0.05)}" height="${f(h)}" fill="#d8ae3f"/><circle cx="${f(x + w * 0.56)}" cy="${f(y + h * 0.38)}" r="${f(w * 0.14)}" fill="none" stroke="#f7e3a1" stroke-width="${f(w * 0.025)}"/>${star(x + w * 0.56, y + h * 0.38, w * 0.08, w * 0.035, "#f7e3a1")}<rect x="${f(x + w * 0.3)}" y="${f(y + h * 0.66)}" width="${f(w * 0.52)}" height="${f(h * 0.06)}" rx="2" fill="#f7e3a1" opacity="0.8"/><rect x="${f(x + w * 0.36)}" y="${f(y + h * 0.78)}" width="${f(w * 0.4)}" height="${f(h * 0.05)}" rx="2" fill="#ffffff" opacity="0.5"/></g>`;
};
const BOOK_DEFS = lin("book", [[0, "#2563eb"], [1, "#1e3a8a"]], 1, 1);

/** ต้นไม้เงินออม: ลำต้น ใบเขียว ผลเป็นเหรียญทอง */
const coinTree = (x, y, h, seed = 4) => {
  const r = rng(seed);
  let leaves = "";
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = r() * h * 0.3;
    leaves += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y - h * 0.68 + Math.sin(a) * d * 0.8)}" rx="${f(h * 0.12)}" ry="${f(h * 0.08)}" fill="${i % 2 ? "#16a34a" : "#22c55e"}" transform="rotate(${f(r() * 180)} ${f(x + Math.cos(a) * d)} ${f(y - h * 0.68 + Math.sin(a) * d * 0.8)})"/>`;
  }
  const coins = Array.from({ length: 7 }, () => {
    const a = r() * Math.PI * 2, d = r() * h * 0.28;
    return coin(f(x + Math.cos(a) * d), f(y - h * 0.68 + Math.sin(a) * d * 0.8), f(h * 0.055));
  }).join("");
  return `<g><path d="M${f(x - h * 0.05)} ${y} Q${f(x - h * 0.02)} ${f(y - h * 0.35)} ${x} ${f(y - h * 0.6)} Q${f(x + h * 0.03)} ${f(y - h * 0.35)} ${f(x + h * 0.06)} ${y} Z" fill="#7c4a1e"/><path d="M${x} ${f(y - h * 0.45)} L${f(x - h * 0.16)} ${f(y - h * 0.62)} M${x} ${f(y - h * 0.5)} L${f(x + h * 0.15)} ${f(y - h * 0.66)}" stroke="#7c4a1e" stroke-width="${f(h * 0.03)}" stroke-linecap="round"/>${leaves}${coins}</g>`;
};

/* ── ฮาโลวีน (แบบน่ารัก ไม่น่ากลัว) ── */
const pumpkin = (cx, cy, r, glow = true) =>
  `<g>${glow ? `<circle cx="${cx}" cy="${cy}" r="${f(r * 1.6)}" fill="#fb923c" opacity="0.18"/>` : ""}<path d="M${f(cx - r * 0.06)} ${f(cy - r * 0.78)} q${f(r * 0.04)} ${f(-r * 0.36)} ${f(r * 0.26)} ${f(-r * 0.42)}" stroke="#3f6212" stroke-width="${f(r * 0.16)}" fill="none" stroke-linecap="round"/>${[-0.52, 0.52, -0.22, 0.22, 0]
    .map((d, i) => `<ellipse cx="${f(cx + d * r)}" cy="${cy}" rx="${f(r * (i === 4 ? 0.5 : 0.48))}" ry="${f(r * 0.8)}" fill="${i === 4 ? "#fb923c" : i > 1 ? "#f97316" : "#ea580c"}"/>`)
    .join("")}<path d="M${f(cx - r * 0.42)} ${f(cy - r * 0.18)} l${f(r * 0.14)} ${f(-r * 0.22)} l${f(r * 0.14)} ${f(r * 0.22)} Z M${f(cx + r * 0.14)} ${f(cy - r * 0.18)} l${f(r * 0.14)} ${f(-r * 0.22)} l${f(r * 0.14)} ${f(r * 0.22)} Z" fill="#fde68a"/><path d="M${f(cx - r * 0.4)} ${f(cy + r * 0.16)} Q${cx} ${f(cy + r * 0.56)} ${f(cx + r * 0.4)} ${f(cy + r * 0.16)} Q${cx} ${f(cy + r * 0.34)} ${f(cx - r * 0.4)} ${f(cy + r * 0.16)} Z" fill="#fde68a"/></g>`;

const bat = (cx, cy, w, color = "#3b2559") => {
  const h = w * 0.45;
  return `<g><path d="M${cx} ${f(cy - h * 0.15)} C${f(cx - w * 0.12)} ${f(cy - h * 0.7)} ${f(cx - w * 0.38)} ${f(cy - h * 0.75)} ${f(cx - w * 0.5)} ${f(cy - h * 0.3)} Q${f(cx - w * 0.4)} ${f(cy - h * 0.05)} ${f(cx - w * 0.36)} ${f(cy + h * 0.2)} Q${f(cx - w * 0.28)} ${f(cy)} ${f(cx - w * 0.2)} ${f(cy + h * 0.25)} Q${f(cx - w * 0.12)} ${f(cy + h * 0.05)} ${cx} ${f(cy + h * 0.3)} Q${f(cx + w * 0.12)} ${f(cy + h * 0.05)} ${f(cx + w * 0.2)} ${f(cy + h * 0.25)} Q${f(cx + w * 0.28)} ${f(cy)} ${f(cx + w * 0.36)} ${f(cy + h * 0.2)} Q${f(cx + w * 0.4)} ${f(cy - h * 0.05)} ${f(cx + w * 0.5)} ${f(cy - h * 0.3)} C${f(cx + w * 0.38)} ${f(cy - h * 0.75)} ${f(cx + w * 0.12)} ${f(cy - h * 0.7)} ${cx} ${f(cy - h * 0.15)} Z" fill="${color}"/><ellipse cx="${cx}" cy="${f(cy + h * 0.02)}" rx="${f(w * 0.11)}" ry="${f(h * 0.4)}" fill="${color}"/><path d="M${f(cx - w * 0.08)} ${f(cy - h * 0.3)} l${f(w * 0.03)} ${f(-h * 0.22)} l${f(w * 0.04)} ${f(h * 0.16)} M${f(cx + w * 0.08)} ${f(cy - h * 0.3)} l${f(-w * 0.03)} ${f(-h * 0.22)} l${f(-w * 0.04)} ${f(h * 0.16)}" fill="${color}" stroke="${color}" stroke-width="2"/><circle cx="${f(cx - w * 0.04)}" cy="${f(cy - h * 0.08)}" r="${f(w * 0.022)}" fill="#fde047"/><circle cx="${f(cx + w * 0.04)}" cy="${f(cy - h * 0.08)}" r="${f(w * 0.022)}" fill="#fde047"/></g>`;
};

const candy = (cx, cy, s, c1 = "#a855f7", c2 = "#f97316") =>
  `<g><path d="M${f(cx - s * 0.3)} ${cy} L${f(cx - s * 0.62)} ${f(cy - s * 0.22)} L${f(cx - s * 0.56)} ${cy} L${f(cx - s * 0.62)} ${f(cy + s * 0.22)} Z M${f(cx + s * 0.3)} ${cy} L${f(cx + s * 0.62)} ${f(cy - s * 0.22)} L${f(cx + s * 0.56)} ${cy} L${f(cx + s * 0.62)} ${f(cy + s * 0.22)} Z" fill="${c1}"/><ellipse cx="${cx}" cy="${cy}" rx="${f(s * 0.34)}" ry="${f(s * 0.24)}" fill="${c2}"/><path d="M${f(cx - s * 0.16)} ${f(cy - s * 0.22)} q${f(s * 0.1)} ${f(s * 0.22)} 0 ${f(s * 0.44)} M${f(cx + s * 0.04)} ${f(cy - s * 0.24)} q${f(s * 0.1)} ${f(s * 0.24)} 0 ${f(s * 0.48)}" stroke="#ffffff" stroke-width="${f(s * 0.06)}" fill="none" opacity="0.8"/></g>`;

const ghost = (cx, cy, s) =>
  `<g><path d="M${f(cx - s * 0.4)} ${f(cy + s * 0.5)} L${f(cx - s * 0.4)} ${f(cy - s * 0.05)} A${f(s * 0.4)} ${f(s * 0.42)} 0 0 1 ${f(cx + s * 0.4)} ${f(cy - s * 0.05)} L${f(cx + s * 0.4)} ${f(cy + s * 0.5)} q${f(-s * 0.1)} ${f(-s * 0.12)} ${f(-s * 0.2)} 0 q${f(-s * 0.1)} ${f(s * 0.12)} ${f(-s * 0.2)} 0 q${f(-s * 0.1)} ${f(-s * 0.12)} ${f(-s * 0.2)} 0 q${f(-s * 0.1)} ${f(s * 0.12)} ${f(-s * 0.2)} 0 Z" fill="#f8fafc"/><ellipse cx="${f(cx - s * 0.13)}" cy="${f(cy - s * 0.04)}" rx="${f(s * 0.06)}" ry="${f(s * 0.09)}" fill="#1e1b4b"/><ellipse cx="${f(cx + s * 0.13)}" cy="${f(cy - s * 0.04)}" rx="${f(s * 0.06)}" ry="${f(s * 0.09)}" fill="#1e1b4b"/><ellipse cx="${f(cx - s * 0.24)}" cy="${f(cy + s * 0.1)}" rx="${f(s * 0.06)}" ry="${f(s * 0.035)}" fill="#fda4af" opacity="0.8"/><ellipse cx="${f(cx + s * 0.24)}" cy="${f(cy + s * 0.1)}" rx="${f(s * 0.06)}" ry="${f(s * 0.035)}" fill="#fda4af" opacity="0.8"/><path d="M${f(cx - s * 0.07)} ${f(cy + s * 0.12)} q${f(s * 0.07)} ${f(s * 0.07)} ${f(s * 0.14)} 0" stroke="#1e1b4b" stroke-width="${f(s * 0.03)}" fill="none" stroke-linecap="round"/></g>`;

const cobweb = (x, y, r, stroke = "#e9d5ff") => {
  const spokes = [0, 18, 36, 54, 72, 90].map((a) => [x + Math.cos((a * Math.PI) / 180) * r, y + Math.sin((a * Math.PI) / 180) * r]);
  let out = spokes.map(([sx, sy]) => `<line x1="${x}" y1="${y}" x2="${f(sx)}" y2="${f(sy)}"/>`).join("");
  for (const k of [0.3, 0.55, 0.8]) out += `<polyline fill="none" points="${spokes.map(([sx, sy]) => `${f(x + (sx - x) * k)},${f(y + (sy - y) * k)}`).join(" ")}"/>`;
  return `<g stroke="${stroke}" stroke-width="1.4" opacity="0.7">${out}</g>`;
};

const bareTree = (x, y, h, color) =>
  `<g stroke="${color}" stroke-linecap="round" fill="none"><path d="M${x} ${y} L${f(x + h * 0.02)} ${f(y - h * 0.6)}" stroke-width="${f(h * 0.08)}"/><path d="M${f(x + h * 0.01)} ${f(y - h * 0.4)} Q${f(x - h * 0.2)} ${f(y - h * 0.55)} ${f(x - h * 0.32)} ${f(y - h * 0.8)} M${f(x + h * 0.02)} ${f(y - h * 0.5)} Q${f(x + h * 0.22)} ${f(y - h * 0.62)} ${f(x + h * 0.3)} ${f(y - h * 0.92)} M${f(x + h * 0.02)} ${f(y - h * 0.6)} L${f(x + h * 0.05)} ${f(y - h)} M${f(x - h * 0.2)} ${f(y - h * 0.62)} L${f(x - h * 0.36)} ${f(y - h * 0.62)} M${f(x + h * 0.18)} ${f(y - h * 0.7)} L${f(x + h * 0.36)} ${f(y - h * 0.7)}" stroke-width="${f(h * 0.035)}"/></g>`;

/* ── ประชุมใหญ่สามัญประจำปี (ทางการ กรมท่า-ทอง) ── */
const ballotBox = (cx, cy, s) =>
  `<g><rect x="${f(cx - s * 0.22)}" y="${f(cy - s * 0.62)}" width="${f(s * 0.44)}" height="${f(s * 0.36)}" rx="${f(s * 0.03)}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" transform="rotate(-6 ${cx} ${f(cy - s * 0.45)})"/><path d="M${f(cx - s * 0.1)} ${f(cy - s * 0.48)} l${f(s * 0.07)} ${f(s * 0.07)} l${f(s * 0.14)} ${f(-s * 0.15)}" stroke="#16a34a" stroke-width="${f(s * 0.05)}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-6 ${cx} ${f(cy - s * 0.45)})"/><path d="M${f(cx - s * 0.44)} ${f(cy - s * 0.3)} L${f(cx + s * 0.44)} ${f(cy - s * 0.3)} L${f(cx + s * 0.4)} ${f(cy + s * 0.46)} L${f(cx - s * 0.4)} ${f(cy + s * 0.46)} Z" fill="#1d3a6e"/><rect x="${f(cx - s * 0.46)}" y="${f(cy - s * 0.36)}" width="${f(s * 0.92)}" height="${f(s * 0.12)}" rx="${f(s * 0.03)}" fill="#d8ae3f"/><rect x="${f(cx - s * 0.24)}" y="${f(cy - s * 0.32)}" width="${f(s * 0.48)}" height="${f(s * 0.04)}" rx="2" fill="#0f1d36"/>${star(cx, cy + s * 0.1, s * 0.16, s * 0.07, "#f7e3a1")}</g>`;

const reportBook = (x, y, w, color, tilt = 0) => {
  const h = w * 0.22;
  return `<g transform="rotate(${tilt} ${f(x + w / 2)} ${f(y + h / 2)})"><rect x="${x}" y="${y}" width="${w}" height="${f(h)}" rx="${f(h * 0.15)}" fill="${color}"/><rect x="${f(x + w * 0.06)}" y="${f(y + h * 0.12)}" width="${f(w * 0.88)}" height="${f(h * 0.76)}" fill="#f8fafc" opacity="0.92"/><rect x="${x}" y="${y}" width="${f(w * 0.08)}" height="${f(h)}" fill="${color}"/><rect x="${f(x + w * 0.2)}" y="${f(y + h * 0.38)}" width="${f(w * 0.5)}" height="${f(h * 0.24)}" rx="2" fill="#d8ae3f"/></g>`;
};

const podium = (cx, cy, s) =>
  `<g><path d="M${f(cx + s * 0.1)} ${f(cy - s * 0.42)} q${f(s * 0.12)} ${f(-s * 0.14)} ${f(s * 0.2)} ${f(-s * 0.3)}" stroke="#334155" stroke-width="${f(s * 0.03)}" fill="none" stroke-linecap="round"/><ellipse cx="${f(cx + s * 0.31)}" cy="${f(cy - s * 0.76)}" rx="${f(s * 0.05)}" ry="${f(s * 0.08)}" fill="#1f2937" transform="rotate(30 ${f(cx + s * 0.31)} ${f(cy - s * 0.76)})"/><path d="M${f(cx - s * 0.42)} ${f(cy - s * 0.42)} L${f(cx + s * 0.42)} ${f(cy - s * 0.42)} L${f(cx + s * 0.3)} ${f(cy + s * 0.5)} L${f(cx - s * 0.3)} ${f(cy + s * 0.5)} Z" fill="#1d3a6e"/><rect x="${f(cx - s * 0.48)}" y="${f(cy - s * 0.5)}" width="${f(s * 0.96)}" height="${f(s * 0.1)}" rx="${f(s * 0.03)}" fill="#d8ae3f"/><circle cx="${cx}" cy="${f(cy)}" r="${f(s * 0.15)}" fill="#d8ae3f"/><circle cx="${cx}" cy="${f(cy)}" r="${f(s * 0.11)}" fill="#0f1d36"/>${star(cx, cy, s * 0.08, s * 0.035, "#f7e3a1")}<rect x="${f(cx - s * 0.36)}" y="${f(cy + s * 0.5)}" width="${f(s * 0.72)}" height="${f(s * 0.06)}" rx="2" fill="#0f1d36"/></g>`;

const voteCard = (cx, cy, s) =>
  `<g transform="rotate(-8 ${cx} ${cy})"><rect x="${f(cx - s * 0.08)}" y="${f(cy + s * 0.1)}" width="${f(s * 0.16)}" height="${f(s * 0.4)}" rx="${f(s * 0.04)}" fill="#d8ae3f"/><rect x="${f(cx - s * 0.36)}" y="${f(cy - s * 0.44)}" width="${f(s * 0.72)}" height="${f(s * 0.58)}" rx="${f(s * 0.06)}" fill="#ffffff" stroke="#1d3a6e" stroke-width="${f(s * 0.04)}"/><path d="M${f(cx - s * 0.16)} ${f(cy - s * 0.16)} l${f(s * 0.1)} ${f(s * 0.1)} l${f(s * 0.22)} ${f(-s * 0.22)}" stroke="#16a34a" stroke-width="${f(s * 0.07)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;

const spotlight = (x, y, len, angle, color = "#fde68a") =>
  `<path d="M${x} ${y} L${f(x + Math.sin(((angle - 7) * Math.PI) / 180) * len)} ${f(y - Math.cos(((angle - 7) * Math.PI) / 180) * len)} L${f(x + Math.sin(((angle + 7) * Math.PI) / 180) * len)} ${f(y - Math.cos(((angle + 7) * Math.PI) / 180) * len)} Z" fill="url(#beam)" opacity="0.5"/>`;
const BEAM_DEFS = lin("beam", [[0, "#fde68a", 0.55], [1, "#fde68a", 0]], 0, -1);

/* ── มาฆบูชา (ทางการ สงบ): เทียน ดอกบัวตูม ธรรมจักร พานธูปเทียน อุโบสถ · กรมท่า-ทอง-แสงเทียน ── */
const flame = (cx, cy, s, halo = true) =>
  `<g>${halo ? `<circle cx="${cx}" cy="${cy}" r="${f(s * 1.5)}" fill="url(#fglow)"/>` : ""}<path d="M${cx} ${f(cy - s * 0.7)} C${f(cx + s * 0.38)} ${f(cy - s * 0.15)} ${f(cx + s * 0.34)} ${f(cy + s * 0.36)} ${cx} ${f(cy + s * 0.38)} C${f(cx - s * 0.34)} ${f(cy + s * 0.36)} ${f(cx - s * 0.38)} ${f(cy - s * 0.15)} ${cx} ${f(cy - s * 0.7)} Z" fill="#f97316"/><path d="M${cx} ${f(cy - s * 0.3)} C${f(cx + s * 0.2)} ${f(cy)} ${f(cx + s * 0.18)} ${f(cy + s * 0.3)} ${cx} ${f(cy + s * 0.32)} C${f(cx - s * 0.18)} ${f(cy + s * 0.3)} ${f(cx - s * 0.2)} ${f(cy)} ${cx} ${f(cy - s * 0.3)} Z" fill="#fde68a"/></g>`;

/** เทียน: by = ฐานเทียน */
const candle = (cx, by, h, w = h * 0.3) => {
  const s = w * 1.05;
  return `<g><rect x="${f(cx - w / 2)}" y="${f(by - h)}" width="${f(w)}" height="${f(h)}" rx="${f(w * 0.14)}" fill="url(#wax)"/><path d="M${f(cx - w * 0.5)} ${f(by - h + w * 0.2)} q${f(w * 0.12)} ${f(w * 0.5)} ${f(w * 0.26)} 0 q${f(w * 0.1)} ${f(w * 0.8)} ${f(w * 0.24)} 0" fill="#fff7e0"/><rect x="${f(cx - w / 2)}" y="${f(by - h * 0.32)}" width="${f(w)}" height="${f(h * 0.06)}" fill="#d8ae3f" opacity="0.7"/><line x1="${cx}" y1="${f(by - h)}" x2="${cx}" y2="${f(by - h - w * 0.22)}" stroke="#44403c" stroke-width="${f(Math.max(1, w * 0.07))}"/>${flame(cx, f(by - h - w * 0.22 - s * 0.36), s)}</g>`;
};

/** ดอกบัวตูม (ถือเวียนเทียน) */
const lotusBud = (cx, cy, s, stem = true) =>
  `<g>${stem ? `<path d="M${cx} ${f(cy + s * 0.44)} Q${f(cx - s * 0.08)} ${f(cy + s * 0.95)} ${f(cx + s * 0.04)} ${f(cy + s * 1.45)}" stroke="#15803d" stroke-width="${f(s * 0.07)}" fill="none" stroke-linecap="round"/>` : ""}<path d="M${cx} ${f(cy - s * 0.62)} C${f(cx + s * 0.42)} ${f(cy - s * 0.2)} ${f(cx + s * 0.38)} ${f(cy + s * 0.42)} ${cx} ${f(cy + s * 0.46)} C${f(cx - s * 0.38)} ${f(cy + s * 0.42)} ${f(cx - s * 0.42)} ${f(cy - s * 0.2)} ${cx} ${f(cy - s * 0.62)} Z" fill="url(#bud)"/><path d="M${cx} ${f(cy + s * 0.46)} C${f(cx - s * 0.52)} ${f(cy + s * 0.3)} ${f(cx - s * 0.46)} ${f(cy - s * 0.16)} ${f(cx - s * 0.2)} ${f(cy - s * 0.38)} C${f(cx - s * 0.3)} ${f(cy - s * 0.02)} ${f(cx - s * 0.2)} ${f(cy + s * 0.3)} ${cx} ${f(cy + s * 0.46)} Z M${cx} ${f(cy + s * 0.46)} C${f(cx + s * 0.52)} ${f(cy + s * 0.3)} ${f(cx + s * 0.46)} ${f(cy - s * 0.16)} ${f(cx + s * 0.2)} ${f(cy - s * 0.38)} C${f(cx + s * 0.3)} ${f(cy - s * 0.02)} ${f(cx + s * 0.2)} ${f(cy + s * 0.3)} ${cx} ${f(cy + s * 0.46)} Z" fill="#ec4899" opacity="0.85"/><path d="M${cx} ${f(cy - s * 0.5)} Q${f(cx + s * 0.06)} ${f(cy)} ${cx} ${f(cy + s * 0.4)}" stroke="#ffffff" stroke-width="${f(s * 0.03)}" fill="none" opacity="0.45"/><path d="M${f(cx - s * 0.2)} ${f(cy + s * 0.5)} Q${cx} ${f(cy + s * 0.36)} ${f(cx + s * 0.2)} ${f(cy + s * 0.5)} Z" fill="#16a34a"/></g>`;

/** ธรรมจักร 8 ซี่ */
const dharmaWheel = (cx, cy, r, color = "#d8ae3f") => {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<line x1="${f(cx + Math.cos(a) * r * 0.2)}" y1="${f(cy + Math.sin(a) * r * 0.2)}" x2="${f(cx + Math.cos(a) * r * 0.86)}" y2="${f(cy + Math.sin(a) * r * 0.86)}"/><circle cx="${f(cx + Math.cos(a) * r * 1.08)}" cy="${f(cy + Math.sin(a) * r * 1.08)}" r="${f(r * 0.09)}" fill="${color}" stroke="none"/>`;
  }).join("");
  return `<g stroke="${color}" fill="none" stroke-linecap="round"><circle cx="${cx}" cy="${cy}" r="${f(r * 0.92)}" stroke-width="${f(r * 0.13)}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.66)}" stroke-width="${f(r * 0.04)}" opacity="0.7"/><g stroke-width="${f(r * 0.07)}">${spokes}</g><circle cx="${cx}" cy="${cy}" r="${f(r * 0.2)}" fill="${color}" stroke="none"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.08)}" fill="#fff7e0" stroke="none"/></g>`;
};

/** ธูป 3 ดอก: by = โคนธูป */
const incense = (cx, by, h) =>
  `<g>${[-1, 0, 1].map((d) => `<line x1="${f(cx + d * h * 0.05)}" y1="${by}" x2="${f(cx + d * h * 0.14)}" y2="${f(by - h)}" stroke="#9a3412" stroke-width="${f(Math.max(1.2, h * 0.025))}"/><circle cx="${f(cx + d * h * 0.14)}" cy="${f(by - h)}" r="${f(Math.max(1.4, h * 0.03))}" fill="#fb923c"/>`).join("")}<path d="M${f(cx)} ${f(by - h * 1.05)} q${f(-h * 0.12)} ${f(-h * 0.14)} 0 ${f(-h * 0.28)} t0 ${f(-h * 0.28)}" stroke="#e2e8f0" stroke-width="${f(Math.max(1, h * 0.02))}" fill="none" opacity="0.45"/></g>`;

/** พานธูปเทียนแพ: by = ฐานพาน */
const phan = (cx, by, s) => {
  const top = by - s * 0.42;
  return `<g><path d="M${f(cx - s * 0.3)} ${by} L${f(cx + s * 0.3)} ${by} L${f(cx + s * 0.14)} ${f(by - s * 0.14)} L${f(cx - s * 0.14)} ${f(by - s * 0.14)} Z" fill="#b7791f"/><rect x="${f(cx - s * 0.07)}" y="${f(by - s * 0.36)}" width="${f(s * 0.14)}" height="${f(s * 0.24)}" fill="#d8ae3f"/>${lotusBud(f(cx - s * 0.26), f(top - s * 0.16), s * 0.26, false)}${lotusBud(f(cx + s * 0.26), f(top - s * 0.16), s * 0.26, false)}${incense(f(cx + s * 0.08), f(top - s * 0.02), s * 0.5)}${candle(f(cx - s * 0.06), f(top - s * 0.02), s * 0.36, s * 0.1)}${lotusBud(cx, f(top - s * 0.2), s * 0.32, false)}<path d="M${f(cx - s * 0.5)} ${f(top)} Q${cx} ${f(top + s * 0.2)} ${f(cx + s * 0.5)} ${f(top)} Z" fill="url(#goldP)"/><ellipse cx="${cx}" cy="${f(top)}" rx="${f(s * 0.5)}" ry="${f(s * 0.06)}" fill="#f7e3a1"/></g>`;
};

/** อุโบสถ (เงา): หลังคาซ้อน 2 ชั้น ช่อฟ้า */
const ubosot = (x, y, w, color, windows = "#fcd34d") => {
  const h = w * 0.26;
  const tier = (bw, base, peak) =>
    `<path d="M${f(x - bw / 2)} ${f(base)} L${f(x - bw * 0.12)} ${f(peak)} L${f(x + bw * 0.12)} ${f(peak)} L${f(x + bw / 2)} ${f(base)} Z" fill="${color}"/><path d="M${f(x - bw / 2)} ${f(base)} q${f(-w * 0.03)} ${f(-w * 0.02)} ${f(-w * 0.025)} ${f(-w * 0.06)} M${f(x + bw / 2)} ${f(base)} q${f(w * 0.03)} ${f(-w * 0.02)} ${f(w * 0.025)} ${f(-w * 0.06)}" stroke="${color}" stroke-width="${f(w * 0.012)}" fill="none" stroke-linecap="round"/>`;
  const win = Array.from({ length: 5 }, (_, i) => `<rect x="${f(x - w * 0.3 + i * w * 0.14)}" y="${f(y - h * 0.8)}" width="${f(w * 0.05)}" height="${f(h * 0.45)}" rx="${f(w * 0.02)}" fill="${windows}" opacity="0.55"/>`).join("");
  return `<g><rect x="${f(x - w * 0.4)}" y="${f(y - h)}" width="${f(w * 0.8)}" height="${f(h)}" fill="${color}"/>${win}${tier(w * 0.96, y - h, y - h - w * 0.16)}${tier(w * 0.66, y - h - w * 0.13, y - h - w * 0.3)}<path d="M${f(x - w * 0.08)} ${f(y - h - w * 0.3)} L${x} ${f(y - h - w * 0.4)} L${f(x + w * 0.08)} ${f(y - h - w * 0.3)} Z" fill="${color}"/><rect x="${f(x - w * 0.46)}" y="${f(y - w * 0.02)}" width="${f(w * 0.92)}" height="${f(w * 0.03)}" fill="${color}"/></g>`;
};

/** ต้นโพธิ์ (เงา) */
const bodhiTree = (x, y, h, color, seed = 8) => {
  const r = rng(seed);
  const leaves = Array.from({ length: 40 }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * h * 0.3;
    return `<circle cx="${f(x + Math.cos(a) * d * 1.5)}" cy="${f(y - h * 0.66 + Math.sin(a) * d * 0.75)}" r="${f(h * (0.07 + r() * 0.06))}"/>`;
  }).join("");
  return `<g fill="${color}"><path d="M${f(x - h * 0.06)} ${y} Q${f(x - h * 0.02)} ${f(y - h * 0.35)} ${f(x - h * 0.04)} ${f(y - h * 0.6)} L${f(x + h * 0.04)} ${f(y - h * 0.6)} Q${f(x + h * 0.03)} ${f(y - h * 0.35)} ${f(x + h * 0.08)} ${y} Z"/>${leaves}</g>`;
};

/** แถวเทียนเวียนรอบอุโบสถ (เปลวไฟเล็ก ๆ ตามแนวโค้ง) */
const procession = (cx, cy, rx, ry, n) =>
  `<g>${Array.from({ length: n }, (_, i) => {
    const a = Math.PI * (0.06 + (0.88 * i) / (n - 1));
    const x = cx - Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const s = 5 + Math.sin(a) * 4;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 1.8)}" fill="url(#fglow)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.32)}" fill="#fde68a"/>`;
  }).join("")}</g>`;

const MAKHA_DEFS =
  rad("fglow", [[0, "#fdba74", 0.6], [1, "#fdba74", 0]]) +
  lin("wax", [[0, "#fff7e0"], [1, "#f2d38a"]], 1, 0) +
  lin("bud", [[0, "#fde2ef"], [1, "#e05a98"]]) +
  lin("goldP", [[0, "#f7e3a1"], [1, "#b7791f"]]);

/** ฉากส่วนท้าย 1600×460: ท้องฟ้า → ของมุมขวาบน → เงา/ฉากหลัง → แถบล่าง (ของวางตรงกลางล่าง ใต้ตัวหนังสือ) */
const footerScene = ({ sky, defs = "", top = "", mid = "", ground, foreground = "", corners = "" }) =>
  svg(1600, 460, `<rect width="1600" height="460" fill="url(#sky)"/>${top}${mid}${ground}${foreground}${corners}`, lin("sky", sky) + defs, ' preserveAspectRatio="xMidYMax slice"');

/** ขอบจอ 170×1200: กลุ่มของตกแต่งช่วงบน ที่เหลือโปร่งใส (เรียงซ้ำแนวตั้ง) — ขวา = กลับด้าน */
const edgeTile = (content, defs = "", mirror = false) =>
  svg(170, 1200, `<g opacity="0.92"${mirror ? ' transform="translate(170 0) scale(-1 1)"' : ""}>${content}</g>`, defs);

/* ════════════════════ ชุดของแต่ละเทศกาล ════════════════════ */
const PETAL = lin("petal", [[0, "#fdeaf2"], [1, "#e8679f"]], 0, -1);
const SILVER = lin("silver", [[0, "#f8fafc"], [0.5, "#cbd5e1"], [1, "#94a3b8"]], 1, 1);
const DROP = lin("drop", [[0, "#a5f3fc"], [1, "#0891b2"]]);

const THEMES = {
  /* ── สงกรานต์: ฟ้าเย็น น้ำ ดอกมะลิ ขันน้ำ ── */
  songkran: {
    icons: [
      svg(80, 80, drop(40, 44, 56), DROP),
      svg(80, 80, flower5(40, 40, 30, "#ffffff", "#fcd34d", "#cbd5e1") + flower5(40, 40, 16, "#ffffff", "#fcd34d", "#e2e8f0", 36)),
      svg(100, 80, waterBowl(50, 38, 84), SILVER),
    ],
    sky: svg(220, 220, sun(110, 110, 44), SUN_DEFS),
    seam: svg(120, 110, waterBowl(60, 60, 96), SILVER),
    edge: (m) =>
      edgeTile(
        `<path d="M40 40 Q60 160 30 300" stroke="#16a34a" stroke-width="2" fill="none"/>${Array.from({ length: 9 }, (_, i) => flower5(f(40 + Math.sin(i) * 12), 60 + i * 28, 13, "#ffffff", "#fcd34d", "#cbd5e1", i * 20)).join("")}${drop(110, 200, 34)}${drop(130, 260, 22)}${waterBowl(96, 330, 80)}`,
        DROP + SILVER,
        m
      ),
    footer: footerScene({
      sky: [[0, "#06324a"], [0.65, "#0b5470"], [1, "#11708f"]],
      defs: SUN_DEFS + SILVER + DROP,
      top: `<g transform="translate(1335 96)">${sun(0, 0, 46)}</g>${stars(11, 10, 1600, 160)}`,
      mid: `<g fill="#05273a">${chedi(980, 300, 140, "#05273a")}${chedi(1060, 300, 200, "#05273a")}${chedi(1140, 300, 120, "#05273a")}<path d="M0 300 Q80 262 160 282 Q240 254 330 284 L330 300 Z"/><rect y="296" width="1600" height="8"/></g>`,
      ground: `<rect y="302" width="1600" height="158" fill="#0a4a63"/>${ripple(306, "#a5f3fc", 0.18)}`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => `<g transform="translate(${x} ${428 + (i % 2) * 12}) scale(${[0.62, 0.72, 0.58, 0.75, 0.6][i]})">${waterBowl(0, 0, 96)}</g>`).join(""),
      corners: `<g transform="translate(250 430)">${Array.from({ length: 6 }, (_, i) => flower5(-40 + i * 16, -10 - (i % 2) * 12, 12, "#ffffff", "#fcd34d", "#cbd5e1", i * 30)).join("")}</g><g transform="translate(1350 430)">${Array.from({ length: 6 }, (_, i) => flower5(-40 + i * 16, -10 - (i % 2) * 12, 12, "#ffffff", "#fcd34d", "#cbd5e1", i * 30)).join("")}</g>`,
    }),
  },

  /* ── ปีใหม่: พลุ ดาว เมืองยามค่ำ ของขวัญ ── */
  newyear: {
    icons: [
      svg(80, 80, star(40, 42, 34, 15, "#fbbf24")),
      svg(80, 80, gift(16, 30, 48, "#dc2626", "#fbbf24")),
      svg(80, 80, firework(40, 40, 30, "#f59e0b", 14, 2.6)),
    ],
    sky: svg(240, 240, firework(120, 120, 80, "#fbbf24", 18, 4) + firework(60, 70, 34, "#f472b6", 12, 2.4)),
    seam: svg(120, 110, gift(22, 46, 54, "#dc2626", "#fbbf24") + gift(70, 66, 34, "#2563eb", "#fde68a")),
    edge: (m) => edgeTile(`${firework(80, 120, 52, "#fbbf24", 16, 3)}${firework(40, 230, 28, "#f472b6", 12, 2)}${star(120, 290, 16, 7, "#fde68a")}${gift(40, 300, 52, "#dc2626", "#fbbf24")}`, "", m),
    footer: footerScene({
      sky: [[0, "#070b1f"], [0.7, "#151a3d"], [1, "#24295a"]],
      top: `${stars(21, 40, 1600, 260)}${firework(1335, 100, 70, "#fbbf24", 18, 3.5)}${firework(1180, 70, 40, "#f472b6", 14, 2.5)}${firework(620, 90, 46, "#38bdf8", 16, 2.8)}${firework(300, 150, 30, "#a3e635", 12, 2.2)}`,
      mid: skyline(5, 300, "#0b1030", "#fcd34d"),
      ground: `<rect y="300" width="1600" height="160" fill="#0b1030"/>${ripple(312, "#fcd34d", 0.08)}`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => gift(x - 24, 410 + (i % 2) * 10, [44, 52, 40, 54, 46][i], ["#dc2626", "#2563eb", "#16a34a", "#dc2626", "#7c3aed"][i], "#fbbf24")).join(""),
    }),
  },

  /* ── คริสต์มาส: หิมะ ต้นสน ดาว ── */
  christmas: {
    icons: [
      svg(80, 80, snowflake(40, 40, 30, "#e0f2fe", 3)),
      svg(80, 80, ornament(40, 46, 24, "#dc2626", "#fbbf24")),
      svg(80, 90, pine(40, 84, 76, "#15803d", true) + star(40, 12, 9, 4, "#fbbf24")),
    ],
    sky: svg(220, 220, star(110, 110, 46, 18, "#fde68a") + `<circle cx="110" cy="110" r="90" fill="url(#sg)"/>`, rad("sg", [[0, "#fff7cc", 0.5], [1, "#fff7cc", 0]])),
    seam: svg(120, 110, pine(42, 104, 92, "#15803d", true) + pine(84, 104, 64, "#166534", true) + star(42, 14, 8, 3.5, "#fbbf24")),
    edge: (m) => edgeTile(`${pine(70, 330, 260, "#166534", true)}${ornament(40, 220, 12, "#dc2626", "#fbbf24")}${ornament(98, 260, 11, "#2563eb", "#fde68a")}${ornament(64, 170, 10, "#fbbf24", "#dc2626")}${star(70, 64, 16, 7, "#fbbf24")}${snowflake(140, 120, 14, "#bae6fd", 2)}`, "", m),
    footer: footerScene({
      sky: [[0, "#06131f"], [0.7, "#0d2a3a"], [1, "#163f52"]],
      defs: MOON_DEFS,
      top: `${stars(31, 40, 1600, 260)}<g>${moon(1335, 92, 50)}</g>${snowflake(420, 80, 10, "#e0f2fe", 1.6)}${snowflake(760, 140, 8, "#e0f2fe", 1.4)}${snowflake(1010, 60, 9, "#e0f2fe", 1.4)}`,
      mid: [900, 960, 1030, 1110, 1190, 1250, 150, 230, 300].map((x, i) => pine(x, 304, 90 + (i % 3) * 30, "#0c3b2c", true)).join(""),
      // หิมะยามค่ำโทนฟ้าหม่น — ตัวหนังสือสีขาวในแถบล่างยังอ่านออก
      ground: `<path d="M0 300 Q400 284 800 300 T1600 296 L1600 460 L0 460 Z" fill="#33526c"/><path d="M0 330 Q400 316 800 330 T1600 326 L1600 460 L0 460 Z" fill="#284660"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => (i % 2 ? gift(x - 22, 418, 44, "#dc2626", "#fbbf24") : pine(x, 456, 70, "#15803d", true))).join(""),
    }),
  },

  /* ── วาเลนไทน์: หัวใจ กุหลาบ ── */
  valentine: {
    icons: [
      svg(80, 80, heart(40, 44, 64, "#e11d48")),
      svg(80, 90, rose(40, 30, 22)),
      svg(80, 80, heart(30, 40, 40, "#be123c") + heart(52, 50, 32, "#fb7185")),
    ],
    sky: svg(220, 220, `<circle cx="110" cy="110" r="100" fill="url(#hg)"/>` + heart(110, 116, 120, "#fb7185") + heart(110, 116, 70, "#fecdd3"), rad("hg", [[0, "#fda4af", 0.45], [1, "#fda4af", 0]])),
    seam: svg(120, 110, rose(40, 38, 20) + heart(86, 76, 42, "#fb7185")),
    edge: (m) => edgeTile(`${rose(70, 70, 20)}${heart(110, 170, 40, "#e11d48")}${heart(50, 220, 46, "#f9a8d4")}${rose(110, 260, 14)}${heart(60, 330, 30, "#fda4af")}`, "", m),
    footer: footerScene({
      sky: [[0, "#2a0f22"], [0.7, "#4a1838"], [1, "#6b2149"]],
      top: `${stars(41, 30, 1600, 240, "#fecdd3")}${heart(1335, 110, 120, "#fb7185")}${heart(1335, 110, 70, "#fecdd3")}${heart(560, 90, 30, "#f472b6")}${heart(880, 140, 22, "#fda4af")}`,
      mid: skyline(9, 300, "#2a0f22", "#fda4af"),
      ground: `<rect y="300" width="1600" height="160" fill="#2a0f22"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => (i % 2 ? rose(x, 400, 15) : heart(x, 424, [48, 60, 44, 62, 50][i], ["#e11d48", "#fb7185", "#f472b6", "#e11d48", "#fda4af"][i]))).join(""),
    }),
  },

  /* ── วันออม: กระปุกออมสิน เหรียญทอง ต้นอ่อน สมุดบัญชี (ฟ้า-ทอง-เขียว ตามแคมเปญวันออม) ── */
  savings: {
    icons: [
      svg(80, 80, coin(40, 38, 30), COIN_DEFS),
      svg(100, 90, piggy(2, 2, 0.48, false), PIG_DEFS),
      svg(80, 90, sprout(40, 82, 54)),
    ],
    sky: svg(240, 220, `<circle cx="120" cy="120" r="104" fill="url(#sg2)"/>${piggy(20, 50, 1, true)}`, PIG_DEFS + COIN_DEFS + rad("sg2", [[0, "#fef3c7", 0.55], [1, "#fef3c7", 0]])),
    seam: svg(120, 110, coinSprout(44, 100, 22) + coin(90, 88, 15) + coinStack(90, 104, 15, 1), COIN_DEFS),
    edge: (m) =>
      edgeTile(
        `<path d="M50 10 Q80 120 46 220 Q20 300 60 380" stroke="#16a34a" stroke-width="3" fill="none"/>${[40, 110, 180, 250, 320].map((y, i) => sprout(f(50 + Math.sin(y / 60) * 18 + (i % 2 ? 6 : -6)), y + 30, 34)).join("")}${coin(120, 90, 16)}${coin(132, 200, 12)}${coinStack(110, 330, 18, 5)}${piggy(70, 380, 0.42, false)}`,
        COIN_DEFS + PIG_DEFS,
        m
      ),
    footer: footerScene({
      sky: [[0, "#0a2240"], [0.65, "#123a66"], [1, "#1b5486"]],
      defs: COIN_DEFS + PIG_DEFS + BOOK_DEFS + SUN_DEFS,
      top: `${stars(91, 26, 1600, 220, "#fef3c7")}<g transform="translate(1335 98)"><circle r="80" fill="url(#sunGlow)"/>${coin(0, 0, 44)}</g>${coin(1210, 70, 12)}${coin(520, 110, 10)}${coin(760, 60, 8)}`,
      mid: `${hills(290, "#0f3a4a", 22, 5)}${coinTree(230, 300, 230, 4)}${coinTree(1050, 300, 190, 9)}`,
      ground: `<rect y="298" width="1600" height="162" fill="#0b2e3b"/>${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${308 + i * 24} Q800 ${298 + i * 24} 1600 ${310 + i * 24}" stroke="#1f6b4a" stroke-width="3" fill="none" opacity="0.5"/>`).join("")}`,
      foreground: [470, 650, 835, 1010, 1170]
        .map((x, i) => (i === 2 ? piggy(x - 48, 392, 0.48, true) : i % 2 ? passbook(x - 30, 412, 60) : coinSprout(x, 448, 20)))
        .join(""),
    }),
  },

  /* ── ฮาโลวีน: ฟักทองยิ้ม ค้างคาวตัวกลม ผีน้อย ลูกอม · ส้ม-ม่วง-ดำ (น่ารัก ไม่น่ากลัว) ── */
  halloween: {
    icons: [
      svg(80, 80, pumpkin(40, 46, 28, false)),
      svg(90, 60, bat(45, 32, 84)),
      svg(90, 60, candy(45, 30, 64)),
    ],
    sky: svg(240, 220, `<circle cx="120" cy="110" r="100" fill="url(#hm)"/>${moon(120, 110, 52)}${bat(70, 80, 46)}${bat(176, 140, 34)}`, MOON_DEFS + rad("hm", [[0, "#c4b5fd", 0.35], [1, "#c4b5fd", 0]])),
    seam: svg(120, 110, pumpkin(48, 74, 32, false) + candy(98, 96, 30)),
    edge: (m) => edgeTile(`${cobweb(0, 0, 150)}<line x1="96" y1="0" x2="96" y2="130" stroke="#e9d5ff" stroke-width="1.2" opacity="0.7"/><circle cx="96" cy="136" r="8" fill="#3b2559"/>${bat(60, 210, 54)}${candy(110, 270, 40)}${pumpkin(70, 330, 26)}`, "", m),
    footer: footerScene({
      sky: [[0, "#120b26"], [0.65, "#24134a"], [1, "#3b1d5e"]],
      defs: MOON_DEFS,
      top: `${stars(101, 30, 1600, 240, "#e9d5ff")}<g>${moon(1335, 96, 52)}</g>${bat(1240, 70, 40, "#1e1238")}${bat(1420, 150, 30, "#1e1238")}${bat(560, 110, 26, "#1e1238")}`,
      mid: `${hills(290, "#1e1238", 24, 6)}${bareTree(180, 300, 170, "#160d2b")}${bareTree(1120, 300, 140, "#160d2b")}${bareTree(1270, 300, 110, "#160d2b")}`,
      ground: `<rect y="300" width="1600" height="160" fill="#160d2b"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => (i === 2 ? ghost(x, 406, 52) : i % 2 ? candy(x, 436, 40) : pumpkin(x, 428, [26, 0, 0, 0, 28][i] || 26))).join(""),
    }),
  },

  /* ── ประชุมใหญ่สามัญประจำปี: หีบลงคะแนน รายงานประจำปี บัตรลงมติ แท่นพูด หอประชุม · กรมท่า-ทอง ทางการ ── */
  agm: {
    icons: [
      svg(80, 90, ballotBox(40, 54, 64)),
      svg(90, 70, reportBook(10, 18, 70, "#1d3a6e", -6) + reportBook(14, 36, 66, "#d8ae3f", 3)),
      svg(80, 90, voteCard(40, 44, 70)),
    ],
    sky: svg(240, 240, `<circle cx="120" cy="120" r="104" fill="url(#ag2)"/>${podium(120, 140, 130)}`, rad("ag2", [[0, "#f7e3a1", 0.45], [1, "#f7e3a1", 0]])),
    seam: svg(120, 110, reportBook(10, 74, 74, "#1d3a6e") + reportBook(14, 56, 70, "#d8ae3f") + reportBook(8, 38, 76, "#0f766e") + ballotBox(100, 78, 34)),
    edge: (m) =>
      edgeTile(
        `<path d="M70 0 Q90 120 64 240 Q44 330 74 400" stroke="#d8ae3f" stroke-width="6" fill="none" opacity="0.85"/>${[60, 150, 240, 330].map((y, i) => star(f(70 + Math.sin(y / 70) * 14), y, i % 2 ? 9 : 13, i % 2 ? 4 : 5.5, "#d8ae3f")).join("")}${voteCard(120, 200, 40)}`,
        "",
        m
      ),
    footer: footerScene({
      sky: [[0, "#081226"], [0.65, "#0f1d36"], [1, "#172c52"]],
      defs: BEAM_DEFS,
      top: `${stars(111, 26, 1600, 220, "#f7e3a1")}${spotlight(560, 300, 300, -16)}${spotlight(1040, 300, 300, 16)}${spotlight(800, 300, 320, 0)}${pennants(380, 1220, 34, ["#d8ae3f", "#f8fafc", "#1d3a6e"])}<g transform="translate(1335 96)">${star(0, 0, 34, 14, "#d8ae3f")}<circle r="56" fill="#d8ae3f" opacity="0.12"/></g>`,
      mid: `${skyline(23, 300, "#0b1730", "#f7e3a1")}${office(800, 300, 380, "#081226")}`,
      ground: `<rect y="300" width="1600" height="160" fill="#081226"/><path d="M0 312 H1600" stroke="#d8ae3f" stroke-width="2" stroke-dasharray="14 8" opacity="0.5"/>`,
      foreground: [470, 650, 835, 1010, 1170]
        .map((x, i) =>
          i === 2
            ? podium(x, 412, 74)
            : `<g><path d="M${x - 22} 456 L${x - 16} 428 L${x + 16} 428 L${x + 22} 456 Z" fill="#1d3a6e"/><rect x="${x - 24}" y="424" width="48" height="7" rx="2" fill="#d8ae3f"/>${[-12, 0, 12].map((d) => flower5(x + d, 412 - Math.abs(d) * 0.5, 10, "#fde047", "#d97706", "#eab308", d * 3)).join("")}</g>`
        )
        .join(""),
    }),
  },

  /* ── วันครบรอบสหกรณ์: สีประจำสหกรณ์ (น้ำเงิน-ทอง-ส้ม) เหรียญ โบว์รางวัล พลุทอง ── */
  anniversary: {
    icons: [
      svg(80, 80, coin(40, 38, 30), COIN_DEFS),
      svg(80, 100, rosette(40, 36, 28), COIN_DEFS),
      svg(80, 80, star(40, 42, 34, 15, "#e8b923")),
    ],
    sky: svg(220, 240, `<circle cx="110" cy="90" r="100" fill="url(#ag)"/>` + rosette(110, 90, 56), COIN_DEFS + rad("ag", [[0, "#f7e3a1", 0.45], [1, "#f7e3a1", 0]])),
    seam: svg(120, 110, coinStack(40, 96, 22, 6) + coin(86, 70, 18) + coinStack(86, 100, 16, 2), COIN_DEFS),
    edge: (m) =>
      edgeTile(
        `${streamer(10, 40, 150, "#d8ae3f", 3)}${coin(70, 120, 22)}${coin(118, 170, 15)}${star(50, 210, 14, 6, "#e8652b")}${balloon(110, 250, 22, "#1d3a6e")}${coinStack(60, 370, 18, 5)}`,
        COIN_DEFS,
        m
      ),
    footer: footerScene({
      sky: [[0, "#0a1628"], [0.65, "#0f1d36"], [1, "#172c52"]],
      defs: COIN_DEFS,
      top: `${stars(81, 36, 1600, 240, "#f7e3a1")}${firework(1335, 100, 66, "#d8ae3f", 18, 3.4)}${firework(1190, 70, 36, "#e8652b", 14, 2.4)}${firework(300, 120, 40, "#f7e3a1", 14, 2.4)}${pennants(420, 1140, 36, ["#d8ae3f", "#e8652b", "#f7e3a1", "#1d3a6e"])}`,
      mid: `${skyline(17, 300, "#0b1730", "#f7e3a1")}${office(800, 300, 300, "#081226")}`,
      ground: `<rect y="300" width="1600" height="160" fill="#081226"/><path d="M0 312 H1600" stroke="#d8ae3f" stroke-width="2" stroke-dasharray="14 8" opacity="0.55"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => (i % 2 ? coinStack(x, 448, 20, 5) : coin(x, 422, [24, 0, 22, 0, 26][i]))).join(""),
    }),
  },

  /* ── ฉัตรมงคล: ดาวเรือง ลายทอง โทนเหลือง-ทอง (สุภาพ ไม่มีตัวการ์ตูน) ── */
  coronation: {
    icons: [
      svg(80, 80, marigold(40, 40, 30)),
      svg(80, 80, star(40, 42, 32, 13, "#facc15")),
      svg(80, 80, flower5(40, 40, 30, "#fde047", "#f59e0b", "#eab308")),
    ],
    sky: svg(240, 240, sun(120, 120, 46, true, "#fffbeb", "#facc15"), SUN_DEFS),
    seam: svg(120, 110, marigold(42, 62, 34) + marigold(86, 74, 22)),
    edge: (m) => edgeTile(`<path d="M60 20 Q80 160 60 320" stroke="#a16207" stroke-width="2" fill="none"/>${Array.from({ length: 10 }, (_, i) => marigold(f(60 + Math.sin(i * 1.3) * 10), 40 + i * 30, 15)).join("")}`, "", m),
    footer: footerScene({
      sky: [[0, "#0b1a3d"], [0.7, "#172a5a"], [1, "#24397a"]],
      defs: SUN_DEFS,
      top: `${stars(51, 24, 1600, 220, "#fde68a")}<g transform="translate(1335 100)">${sun(0, 0, 44, true, "#fffbeb", "#facc15")}</g>${pennants(380, 1180, 40, ["#facc15", "#fde047", "#eab308"])}`,
      mid: `<g fill="#0a1633">${chedi(960, 300, 150, "#0a1633")}${chedi(1040, 300, 210, "#0a1633")}${chedi(1120, 300, 150, "#0a1633")}<rect y="296" width="1600" height="8"/></g>`,
      ground: `<rect y="302" width="1600" height="158" fill="#0a1633"/><path d="M0 312 H1600" stroke="#d8ae3f" stroke-width="2" stroke-dasharray="14 8" opacity="0.6"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => marigold(x, 420 + (i % 2) * 12, [26, 32, 24, 34, 28][i])).join(""),
    }),
  },

  /* ── พืชมงคล: ทุ่งข้าว รวงข้าว รุ่งเช้า (สุภาพ ไม่มีตัวการ์ตูน) ── */
  ploughing: {
    icons: [
      svg(80, 90, riceSheaf(40, 74, 62)),
      svg(80, 80, `<ellipse cx="40" cy="40" rx="10" ry="22" fill="#e3b341" transform="rotate(25 40 40)"/><path d="M40 62 L40 74" stroke="#b08a2e" stroke-width="3"/>`),
      svg(80, 80, `<path d="M18 64 Q40 10 64 18 Q50 52 18 64 Z" fill="#4d9a3a"/><path d="M18 64 Q40 40 64 18" stroke="#2f6d22" stroke-width="2" fill="none"/>`),
    ],
    sky: svg(240, 240, sun(120, 120, 46, true, "#fff7ed", "#fb923c"), SUN_DEFS),
    seam: svg(120, 110, riceSheaf(44, 96, 82) + riceSheaf(86, 100, 58)),
    edge: (m) => edgeTile(`${riceSheaf(70, 330, 260)}${riceSheaf(118, 330, 170)}`, "", m),
    footer: footerScene({
      sky: [[0, "#1b2552"], [0.55, "#6b3a5c"], [1, "#e0894a"]],
      defs: SUN_DEFS,
      top: `<g transform="translate(1335 230)">${sun(0, 0, 60, false)}</g>`,
      mid: `${hills(280, "#2c3d3a", 26, 2)}`,
      ground: `<rect y="300" width="1600" height="160" fill="#2e5a2a"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${310 + i * 18} Q800 ${300 + i * 18} 1600 ${312 + i * 18}" stroke="#4d8a3a" stroke-width="3" fill="none" opacity="0.7"/>`).join("")}`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => riceSheaf(x, 452, [70, 84, 64, 88, 72][i])).join(""),
    }),
  },

  /* ── มาฆบูชา: เพ็ญเดือนสาม เวียนเทียน ดอกบัวตูม ธรรมจักร (สุภาพ ไม่มีตัวการ์ตูน) ── */
  "makha-bucha": {
    icons: [
      svg(80, 90, lotusBud(40, 34, 52), MAKHA_DEFS),
      svg(60, 100, candle(30, 94, 52, 16), MAKHA_DEFS),
      svg(80, 80, dharmaWheel(40, 40, 30)),
    ],
    sky: svg(240, 240, `<circle cx="120" cy="120" r="108" fill="url(#mg)"/>${dharmaWheel(120, 120, 62)}`, rad("mg", [[0, "#fde9b5", 0.5], [1, "#fde9b5", 0]])),
    seam: svg(120, 110, phan(60, 106, 100), MAKHA_DEFS),
    edge: (m) =>
      edgeTile(
        `<path d="M60 0 Q84 120 58 240 Q40 320 66 400" stroke="#15803d" stroke-width="2.4" fill="none" opacity="0.8"/>${dharmaWheel(70, 70, 24)}${lotusBud(110, 160, 40, false)}${lotusBud(46, 220, 32, false)}${candle(108, 320, 60, 16)}${lotusBud(56, 340, 26, false)}`,
        MAKHA_DEFS,
        m
      ),
    footer: footerScene({
      sky: [[0, "#070d24"], [0.65, "#111c44"], [1, "#1d2a5e"]],
      defs: MOON_DEFS + MAKHA_DEFS,
      top: `${stars(121, 34, 1600, 240, "#fde9b5")}<g>${moon(1335, 96, 54)}</g>`,
      mid: `${hills(292, "#0b1433", 18, 4)}${bodhiTree(220, 300, 210, "#0a1230")}${chedi(1110, 300, 190, "#0a1230")}${chedi(1180, 300, 120, "#0a1230")}${ubosot(860, 300, 300, "#0a1230")}`,
      ground: `<rect y="298" width="1600" height="162" fill="#0a1230"/>${procession(860, 308, 300, 26, 22)}<path d="M0 340 H1600" stroke="#d8ae3f" stroke-width="2" stroke-dasharray="14 8" opacity="0.4"/>`,
      foreground: [470, 650, 835, 1010, 1170]
        .map((x, i) => (i === 2 ? phan(x, 456, 92) : i % 2 ? candle(x, 452, 46, 13) : lotusBud(x, 412, 44)))
        .join(""),
    }),
  },

  /* ── วันแรงงาน: ฟันเฟือง เมือง ── */
  "labor-day": {
    icons: [
      svg(80, 80, gear(40, 40, 32, 10, "#f59e0b")),
      svg(80, 80, gear(40, 40, 30, 8, "#94a3b8")),
      svg(80, 80, star(40, 42, 32, 13, "#ef4444")),
    ],
    sky: svg(240, 240, sun(120, 120, 46, true), SUN_DEFS),
    seam: svg(120, 110, gear(44, 62, 36, 10, "#f59e0b") + gear(88, 76, 24, 8, "#94a3b8")),
    edge: (m) => edgeTile(`${gear(80, 140, 56, 12, "#f59e0b")}${gear(40, 230, 34, 9, "#94a3b8")}${gear(110, 270, 26, 8, "#ef4444")}`, "", m),
    footer: footerScene({
      sky: [[0, "#120f24"], [0.7, "#2a1a3a"], [1, "#4a1f2c"]],
      defs: SUN_DEFS,
      top: `${stars(61, 24, 1600, 200)}<g transform="translate(1335 100)">${sun(0, 0, 40)}</g>`,
      mid: skyline(13, 300, "#120f24", "#fbbf24"),
      ground: `<rect y="300" width="1600" height="160" fill="#120f24"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => gear(x, 424 + (i % 2) * 10, [26, 32, 24, 34, 28][i], 10, ["#f59e0b", "#94a3b8", "#ef4444", "#f59e0b", "#94a3b8"][i])).join(""),
    }),
  },

  /* ── ฉลองทั่วไป: ลูกโป่ง ริบบิ้น กระดาษสี ── */
  confetti: {
    icons: [
      svg(80, 110, balloon(40, 38, 26, "#ef4444")),
      svg(80, 80, star(40, 42, 32, 13, "#a855f7")),
      svg(80, 80, `<rect x="22" y="30" width="36" height="16" rx="3" fill="#22c55e" transform="rotate(-24 40 38)"/>`),
    ],
    sky: svg(240, 240, balloon(150, 70, 32, "#f43f5e") + balloon(96, 96, 28, "#3b82f6") + balloon(178, 128, 24, "#facc15") + confettiBits(3, 30, 240, 240, ["#f43f5e", "#3b82f6", "#facc15", "#22c55e", "#a855f7"])),
    seam: svg(120, 110, balloon(42, 40, 22, "#f43f5e") + balloon(80, 50, 18, "#3b82f6")),
    edge: (m) => edgeTile(`${balloon(70, 100, 30, "#f43f5e")}${balloon(116, 150, 24, "#3b82f6")}${balloon(46, 190, 22, "#facc15")}${streamer(10, 300, 150, "#a855f7", 4)}${confettiBits(5, 24, 170, 340, ["#f43f5e", "#3b82f6", "#facc15", "#22c55e"])}`, "", m),
    footer: footerScene({
      sky: [[0, "#0d1033"], [0.7, "#1b2156"], [1, "#2a2f6e"]],
      top: `${confettiBits(71, 120, 1600, 280, ["#f43f5e", "#3b82f6", "#facc15", "#22c55e", "#a855f7"])}${streamer(380, 60, 420, "#facc15", 2)}${streamer(820, 40, 380, "#f472b6", 3)}${balloon(1335, 90, 34, "#f43f5e")}${balloon(1290, 130, 28, "#3b82f6")}`,
      mid: "",
      ground: `<rect y="300" width="1600" height="160" fill="#14184a"/>`,
      foreground: [470, 650, 835, 1010, 1170].map((x, i) => balloon(x, 404 + (i % 2) * 10, [20, 24, 18, 26, 22][i], ["#f43f5e", "#3b82f6", "#facc15", "#22c55e", "#a855f7"][i], false)).join(""),
    }),
  },
};

/* ── ลอยกระทง: เพิ่มเฉพาะไอคอน/ของลอยหัวเว็บ (ภาพหลักวาดมือไว้แล้ว) ── */
const LOY_EXTRA = {
  "icon-1.svg": svg(80, 80, `<g transform="translate(40 58)">${[-60, 60, -36, 36, -14, 14, 0].map((a) => `<path d="M0 0 C-9 -13 -8 -34 0 -42 C8 -34 9 -13 0 0 Z" fill="url(#petal)" transform="rotate(${a})"/>`).join("")}<ellipse cx="0" cy="-5" rx="6" ry="3.4" fill="#f6c94a"/></g>`, PETAL),
  "icon-2.svg": fs.existsSync(path.join(OUT, "loy-krathong", "krathong.svg")) ? fs.readFileSync(path.join(OUT, "loy-krathong", "krathong.svg"), "utf8") : null,
  "icon-3.svg": svg(60, 80, `<circle cx="30" cy="40" r="28" fill="url(#lg)"/><path d="M19 22 L41 22 L44 54 L16 54 Z" fill="url(#lb)"/><rect x="16" y="52" width="28" height="3" fill="#c25a14"/><ellipse cx="30" cy="50" rx="5" ry="3" fill="#fff4c4"/>`, rad("lg", [[0, "#ffcf6b", 0.55], [1, "#ffcf6b", 0]]) + lin("lb", [[0, "#ffd27a"], [1, "#ff8a2a"]])),
  "sky.svg": svg(220, 220, moon(110, 110, 44), MOON_DEFS),
  "seam.svg": fs.existsSync(path.join(OUT, "loy-krathong", "krathong.svg")) ? fs.readFileSync(path.join(OUT, "loy-krathong", "krathong.svg"), "utf8") : null,
};

/* ── สัตว์/ของวิ่งผ่านจอ (Animation) ── */
const ANIM = {
  // ช้างพ่นน้ำ (สงกรานต์) — หันขวา เดินผ่านจอ
  "elephant-splash.svg": svg(
    260,
    200,
    `<g>
      <g fill="url(#water)" opacity="0.85">${[[180, 40, 7], [196, 26, 6], [210, 42, 5], [222, 22, 6], [236, 36, 5], [204, 12, 4], [244, 16, 4]].map(([x, y, r]) => drop(x, y, r * 2.2, "url(#water)")).join("")}</g>
      <path d="M172 64 Q186 40 200 52" stroke="#7dd3fc" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>
      <ellipse cx="104" cy="122" rx="74" ry="50" fill="url(#ele)"/>
      <rect x="48" y="146" width="24" height="44" rx="10" fill="#8b98aa"/><rect x="82" y="150" width="24" height="42" rx="10" fill="#9aa6b8"/>
      <rect x="120" y="150" width="24" height="42" rx="10" fill="#8b98aa"/><rect x="150" y="146" width="24" height="44" rx="10" fill="#9aa6b8"/>
      <path d="M32 112 Q16 116 18 132" stroke="#8b98aa" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M70 84 Q104 70 138 84 L132 128 Q104 140 76 128 Z" fill="#c62828"/>
      <path d="M74 92 Q104 80 134 92" stroke="#fbbf24" stroke-width="4" fill="none"/>
      <path d="M78 122 Q104 132 130 122" stroke="#fbbf24" stroke-width="4" fill="none"/>
      <circle cx="166" cy="96" r="38" fill="url(#ele)"/>
      <path d="M182 108 Q206 104 200 76 Q196 60 184 58" stroke="url(#ele)" stroke-width="16" fill="none" stroke-linecap="round"/>
      <ellipse cx="146" cy="96" rx="22" ry="28" fill="#a7b2c3"/><ellipse cx="148" cy="98" rx="14" ry="19" fill="#f5c2cf"/>
      <circle cx="178" cy="88" r="4.5" fill="#1f2937"/><circle cx="179.5" cy="86.5" r="1.4" fill="#fff"/>
      <path d="M186 116 q6 6 0 12" stroke="#f8fafc" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>`,
    lin("ele", [[0, "#b4bfce"], [1, "#8391a5"]]) + lin("water", [[0, "#cffafe"], [1, "#22d3ee"]])
  ),
  // กระปุกออมสินเดินผ่าน (วันออม) — หันขวา มีเหรียญหล่นตามหลัง
  "piggy-walk.svg": svg(230, 180, `${coin(22, 150, 9)}${coin(40, 162, 7)}<g transform="translate(14 8)">${piggyRaw(true)}</g>`, PIG_DEFS + COIN_DEFS),
  // ผีน้อยลอยผ่าน (ฮาโลวีน) — หน้าตรง ใช้ได้ทั้งสองทิศ
  "ghost-float.svg": svg(160, 170, `<ellipse cx="80" cy="160" rx="36" ry="6" fill="#1e1b4b" opacity="0.15"/>${ghost(80, 84, 130)}${candy(128, 120, 36)}`),
  // ลูกโป่งลอยขึ้น (ฉลองทั่วไป)
  "balloons-up.svg": svg(200, 260, `${balloon(70, 70, 34, "#f43f5e")}${balloon(130, 60, 30, "#3b82f6")}${balloon(100, 110, 28, "#facc15")}<path d="M70 110 Q90 180 100 250 M130 96 Q110 180 100 250 M100 144 L100 250" stroke="#94a3b8" stroke-width="1.6" fill="none"/>`),
};

/* ════════════════════ เขียนไฟล์ ════════════════════ */
let written = 0;
const write = (dir, name, content) => {
  if (!content) return;
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  fs.writeFileSync(path.join(OUT, dir, name), content);
  written++;
};
// เทศกาลที่มีภาพจริงจากฝ่ายประชาสัมพันธ์แล้ว (design/festival/<key>) — ไม่สร้างภาพวาดแทน (ใช้ scripts/festival-images.mjs)
const hasRealArt = (key) => fs.existsSync(path.join(OUT, "..", "..", "design", "festival", key));
for (const [key, t] of Object.entries(THEMES)) {
  if (hasRealArt(key)) continue;
  t.icons.forEach((c, i) => write(key, `icon-${i + 1}.svg`, c));
  write(key, "sky.svg", t.sky);
  write(key, "seam.svg", t.seam);
  write(key, "edge-left.svg", t.edge(false));
  write(key, "edge-right.svg", t.edge(true));
  write(key, "footer-scene.svg", t.footer);
}
for (const [name, c] of Object.entries(LOY_EXTRA)) write("loy-krathong", name, c);
for (const [name, c] of Object.entries(ANIM)) {
  if (name === "piggy-walk.svg" && hasRealArt("savings")) continue; // ใช้ตัวการ์ตูนจริง (savings/character.webp)
  write("animations", name, c);
}
console.log(`festival art: ${written} files → ${OUT}`);
