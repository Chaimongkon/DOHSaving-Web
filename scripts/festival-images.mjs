/**
 * แปลงภาพธีมเทศกาลจากฝ่ายประชาสัมพันธ์ → ไฟล์สำหรับเว็บ
 *
 *   node scripts/festival-images.mjs            (ทุกเทศกาลใน design/festival/)
 *   node scripts/festival-images.mjs savings    (เฉพาะเทศกาลที่ระบุ)
 *
 * ต้นฉบับ: design/festival/<key>/  icon-1..3.png · sky.png · seam.png · edge-left.png · footer-scene.jpg · character.png
 * ผลลัพธ์: public/festival/<key>/   icon-1..3.webp · sky.webp · seam.webp · edge-left.webp · edge-right.webp · footer-scene.jpg · character.webp
 *
 * ตัดขอบโปร่งใส → ย่อให้พอดีกรอบของแต่ละตำแหน่ง → WebP (เล็กกว่า PNG มาก ยังโปร่งใสได้)
 * ภาพขอบจอ: จัดวางบนผ้าใบ 300×2120 ให้ลวดลายอยู่ 2 ใน 3 ทางขวา (ส่วนซ้ายถูกซ่อนนอกจอ) · ขอบขวา = กลับด้านภาพซ้าย
 * ไม่ขยายภาพเกินต้นฉบับ
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "design", "festival");
const OUT = path.join(ROOT, "public", "festival");

// ตัวการ์ตูน: ไฟล์เคลื่อนไหว (webp/gif) มาก่อนภาพนิ่ง (png) ถ้ามีทั้งคู่
// ("character-green.png" เป็นไฟล์ที่สคริปต์สร้างเอง ชื่อไม่ตรงกับ "character.<นามสกุล>" จึงไม่ถูกหยิบมาใช้แทน)
const find = (dir, name) => (name === "character" ? ["webp", "gif", "png", "jpg", "jpeg"] : ["png", "webp", "gif", "jpg", "jpeg"]).map((e) => path.join(dir, `${name}.${e}`)).find((p) => fs.existsSync(p));
const kb = (p) => `${Math.round(fs.statSync(p).size / 1024)} KB`;
const WEBP = { quality: 84, alphaQuality: 90, effort: 6 };

/** ตัดขอบโปร่งใส แล้วย่อให้พอดีกรอบ (ไม่ขยาย) วางบนผ้าใบโปร่งใสตามตำแหน่งที่กำหนด */
async function fit(src, w, h, gravity = "centre") {
  const trimmed = await sharp(src).trim({ threshold: 8 }).toBuffer();
  return sharp(trimmed)
    .resize(w, h, { fit: "contain", position: gravity, background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: true })
    .resize(w, h, { fit: "contain", position: gravity, background: { r: 0, g: 0, b: 0, alpha: 0 } }) // เติมผ้าใบให้ครบขนาด
    .webp(WEBP);
}

async function edge(src, outDir) {
  // ลวดลายสูงราว 2/3 ของช่อง กว้างไม่เกิน 140 px ชิดขวา (ซ้ายสุด 1/3 จะอยู่นอกจอ) — เบา ๆ ไม่แย่งเนื้อหา
  const art = await sharp(await sharp(src).trim({ threshold: 8 }).toBuffer())
    .resize(140, 1300, { fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const left = 300 - art.info.width - 14;
  const canvas = () => sharp({ create: { width: 300, height: 2120, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  const tile = await canvas().composite([{ input: art.data, left, top: 60 }]).png().toBuffer();
  await sharp(tile).webp(WEBP).toFile(path.join(outDir, "edge-left.webp"));
  await sharp(tile).flop().webp(WEBP).toFile(path.join(outDir, "edge-right.webp"));
}

/**
 * ตัวการ์ตูนแบบเคลื่อนไหว จากวิดีโอที่แปลงเป็น WebP (เช่นที่ ezgif.com)
 * - ถ้าพื้นหลังเป็นสีเขียว (green screen) → ลบเป็นโปร่งใส และลดเงาเขียวที่ขอบตัว
 * - ตัดขอบว่างตามกรอบที่รวมทุกเฟรม (ตัวการ์ตูนไม่กระตุกตำแหน่ง) · กว้างไม่เกิน 480 px · วนไม่รู้จบ
 */
async function animatedCharacter(src, outPath) {
  const img = sharp(src, { animated: true });
  const meta = await img.metadata();
  const W = meta.width;
  const H = meta.pageHeight;
  const N = meta.pages;
  const px = await img.ensureAlpha().raw().toBuffer();

  // พื้นหลังสีเรียบ (เขียว ขาว หรือสีที่ค่อย ๆ เปลี่ยนระหว่างคลิป)? — ดูว่า 4 มุมของแต่ละเฟรมเป็นสีเดียวกันและทึบ
  const frameAt = (f) => f * W * H * 4;
  const cornerIdx = [0, W - 1, (H - 1) * W, H * W - 1];
  const flat = (f) => {
    const cs = cornerIdx.map((p) => frameAt(f) + p * 4);
    if (cs.some((i) => px[i + 3] < 200)) return false; // โปร่งใสอยู่แล้ว
    return cs.every((i) => Math.hypot(px[i] - px[cs[0]], px[i + 1] - px[cs[0] + 1], px[i + 2] - px[cs[0] + 2]) < 40);
  };
  const keyed = [...Array(N).keys()].filter(flat).length >= N * 0.8;
  // ลบพื้นทีละเฟรมตามสีพื้นของเฟรมนั้นเอง (ไล่จากขอบเข้าไป) — สีอ่อน/เขียวที่อยู่ในตัวการ์ตูนไม่ถูกลบ
  if (keyed) removeBackground(px, W, H, N);

  let keep = [...Array(N).keys()];
  // เกิน 30 เฟรม: เก็บเฟรมเว้นเฟรม (เวลาต่อเฟรมเพิ่มเป็น 2 เท่า) — ไฟล์เล็กลงครึ่งหนึ่ง ตัวเล็กบนจอยังดูลื่นพอ
  const step = keep.length > 30 ? 2 : 1;
  keep = keep.filter((_, i) => i % step === 0);

  // กรอบรวมทุกเฟรม
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (const f of keep)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (px[((f * H + y) * W + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
  if (x1 < 0) throw new Error("character: ไม่พบตัวการ์ตูนในภาพ (พื้นหลังทั้งภาพ?)");
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const cw = x1 - x0 + 1, chh = y1 - y0 + 1;
  // บนจอแสดงกว้างราว 120–220 px — 260 px พอสำหรับจอความละเอียดสูง และไฟล์เล็ก
  const outW = Math.min(260, cw);

  const frames = [];
  for (const f of keep) {
    const frame = await sharp(px, { raw: { width: W, height: H * N, channels: 4 } })
      .extract({ left: x0, top: f * H + y0, width: cw, height: chh })
      .resize({ width: outW })
      .png()
      .toBuffer();
    frames.push(frame);
  }
  const delay = keep.map((f) => ((Array.isArray(meta.delay) && meta.delay[f]) || 66) * step);
  // loop: 0 = วนไม่รู้จบ (ไฟล์จาก ezgif บางครั้งตั้งให้เล่นแค่ 2 รอบแล้วหยุด)
  await sharp(frames, { join: { animated: true } }).webp({ ...WEBP, quality: 75, alphaQuality: 80, loop: 0, delay }).toFile(outPath);
  return `${keep.length}/${N} เฟรม${keyed ? " · ลบพื้นหลังแล้ว" : ""} · วนไม่รู้จบ`;
}

/**
 * ลบพื้นหลังสีเรียบ (เขียว ขาว หรือสีที่ค่อย ๆ เปลี่ยนระหว่างคลิป) ทีละเฟรม ตามสีพื้นของเฟรมนั้น (เฉลี่ย 4 มุม)
 * ไล่จากขอบภาพเข้าไปเฉพาะบริเวณที่ต่อเนื่องกับขอบและสีใกล้สีพื้น — ส่วนที่อยู่ "ข้างใน" ตัวการ์ตูน
 * (ใบตองสีเขียว โคนกลีบบัว เคราขาวซานต้า แสงเทียน) จึงไม่ถูกลบ
 * ขอบที่โปร่งครึ่งหนึ่ง: ถอดสีพื้นออกจากสีเดิม (un-mix) ไม่ให้เห็นขอบขาว/เขียวเมื่อวางบนพื้นเข้ม
 */
function removeBackground(px, W, H, N) {
  const T1 = 20; // ใกล้สีพื้นกว่านี้ = โปร่งใสทั้งหมด
  const T2 = 52; // ห่างกว่านี้ = ส่วนของตัวการ์ตูน
  const seen = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  for (let f = 0; f < N; f++) {
    const base = f * W * H * 4;
    const cornerIdx = [0, W - 1, (H - 1) * W, H * W - 1];
    const bg = [0, 1, 2].map((c) => cornerIdx.reduce((s, p) => s + px[base + p * 4 + c], 0) / 4);
    const dist = (p) => Math.hypot(px[base + p * 4] - bg[0], px[base + p * 4 + 1] - bg[1], px[base + p * 4 + 2] - bg[2]);
    seen.fill(0);
    let head = 0, tail = 0;
    const push = (p) => {
      if (!seen[p] && dist(p) < T2) {
        seen[p] = 1;
        queue[tail++] = p;
      }
    };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (head < tail) {
      const p = queue[head++];
      const x = p % W;
      if (x > 0) push(p - 1);
      if (x < W - 1) push(p + 1);
      if (p >= W) push(p - W);
      if (p < W * (H - 1)) push(p + W);
    }
    for (let k = 0; k < tail; k++) {
      const p = queue[k];
      const i = base + p * 4;
      const a = Math.max(0, Math.min(1, (dist(p) - T1) / (T2 - T1)));
      if (a <= 0) { px[i + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - bg[c] * (1 - a)) / a)));
      px[i + 3] = Math.round(px[i + 3] * a);
    }

    // พื้นสีจัด (green screen): ลบสีพื้นทั่วทั้งเฟรมด้วย — ช่องที่ถูกล้อมไว้ (ระหว่างขากวาง สายบังเหียน) ไล่จากขอบไม่ถึง
    // สีพื้นสด ๆ แบบนี้ไม่มีอยู่ในตัวการ์ตูนจริง จึงปลอดภัย · พื้นขาวไม่ทำ (เคราซานต้า/กลีบบัวสีขาวจะหาย)
    const dom = bg.indexOf(Math.max(...bg));
    const [o1, o2] = [0, 1, 2].filter((c) => c !== dom);
    if (Math.max(...bg) - Math.min(...bg) > 60) {
      const spill = (i) => px[i + dom] - Math.max(px[i + o1], px[i + o2]);
      for (let p = 0; p < W * H; p++) {
        const i = base + p * 4;
        if (px[i + 3] === 0 || spill(i) <= 0) continue;
        const d = dist(p);
        if (d < 70) px[i + 3] = Math.min(px[i + 3], Math.round(255 * Math.max(0, (d - 30) / 40)));
      }
      // ขอบตัวการ์ตูนที่ติดเงาสีพื้น: ลดสีนั้นลง เฉพาะพิกเซลที่อยู่ติดกับส่วนโปร่งใส (ใบไม้สีเขียวข้างในไม่โดน)
      for (let pass = 0; pass < 2; pass++) {
        for (let p = 0; p < W * H; p++) {
          const i = base + p * 4;
          if (px[i + 3] === 0 || spill(i) <= 0) continue;
          const x = p % W;
          const nearClear = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W].some((q) => q >= 0 && q < W * H && px[base + q * 4 + 3] < 128);
          if (nearClear) px[i + dom] = Math.max(px[i + o1], px[i + o2]);
        }
      }
    }
  }
}

async function run(key) {
  const dir = path.join(SRC, key);
  const out = path.join(OUT, key);
  fs.mkdirSync(out, { recursive: true });
  const done = [];
  const save = async (pipeline, name) => {
    const p = path.join(out, name);
    await (await pipeline).toFile(p);
    done.push(`${name} ${kb(p)}`);
  };

  for (const i of [1, 2, 3, 4]) {
    const s = find(dir, `icon-${i}`);
    if (s) await save(fit(s, 256, 256), `icon-${i}.webp`);
  }
  const sky = find(dir, "sky");
  if (sky) await save(fit(sky, 512, 512), "sky.webp");
  const seam = find(dir, "seam");
  if (seam) await save(fit(seam, 480, 440, "south"), "seam.webp"); // ฐานแตะขอบล่าง — ลอยบนเส้นรอยต่อ
  const ed = find(dir, "edge-left");
  if (ed) {
    await edge(ed, out);
    done.push(`edge-left.webp ${kb(path.join(out, "edge-left.webp"))}`, `edge-right.webp ${kb(path.join(out, "edge-right.webp"))}`);
  }
  const footer = find(dir, "footer-scene");
  if (footer) await save(sharp(footer).resize({ width: 3200, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true, progressive: true }), "footer-scene.jpg");
  const ch = find(dir, "character");
  if (ch) {
    const { pages = 1 } = await sharp(ch, { animated: true }).metadata();
    if (pages > 1) {
      // ภาพเคลื่อนไหว (WebP/GIF หลายเฟรม เช่น กระปุกเดินอยู่กับที่) — ลบพื้นเขียว (ถ้ามี) ตัดขอบว่าง เก็บทุกเฟรม
      const p = path.join(out, "character.webp");
      const info = await animatedCharacter(ch, p);
      done.push(`character.webp ${kb(p)} (${info})`);
    } else {
      const trimmed = await sharp(ch).trim({ threshold: 8 }).toBuffer();
      await save(sharp(trimmed).resize({ width: 800, withoutEnlargement: true }).webp(WEBP), "character.webp");
      // ภาพสำหรับอัปโหลดเข้าเครื่องมือทำวิดีโอ (image-to-video): ตัวการ์ตูนบนพื้นเขียวล้วน มีขอบรอบตัว
      // เครื่องมือมักใช้พื้นหลังตามภาพที่อัปโหลด — ถ้าภาพเป็นพื้นเขียวตั้งแต่แรก วิดีโอก็เป็นพื้นเขียว ลบพื้นได้ง่าย
      const meta = await sharp(trimmed).metadata();
      const padX = Math.round(meta.width * 0.18);
      const padY = Math.round(meta.height * 0.22);
      await sharp(trimmed)
        .extend({ top: padY, bottom: padY, left: padX, right: padX, background: { r: 0, g: 255, b: 0, alpha: 1 } })
        .flatten({ background: { r: 0, g: 255, b: 0 } })
        .png()
        .toFile(path.join(dir, "character-green.png"));
      done.push("character-green.png (สำหรับทำวิดีโอ อยู่ใน design/)");
    }
  }
  console.log(`${key}: ${done.join(" · ")}`);
}

/**
 * สีประจำธีมจากฝ่ายประชาสัมพันธ์ — ไฟล์ .txt ใด ๆ ในโฟลเดอร์ (เช่น สีประจำธีม.txt) มีรหัสสี 3 สีเรียงกัน:
 *   1) สีเข้ม → เงาทับฉากส่วนท้าย (ควรใกล้สีท้องฟ้าในภาพฉาก)
 *   2) สีเน้น → ทอง/จุดเน้น (ลายใต้เมนู เส้นรอยต่อ)
 *   3) สีอ่อน → โทนพื้นหน้าเว็บ (ระบบผสมกับสีขาวให้อ่อนมาก ไม่รบกวนการอ่าน)
 */
function readColors(dir) {
  if (!fs.existsSync(dir)) return null;
  const txt = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith(".txt"));
  if (!txt) return null;
  const hex = (fs.readFileSync(path.join(dir, txt), "utf8").match(/#?[0-9a-f]{6}\b/gi) ?? []).map((h) => "#" + h.replace("#", "").toUpperCase());
  if (hex.length < 3) {
    console.warn(`  ⚠ ${txt}: ต้องมีรหัสสี 3 สี (เช่น #123A66, #E0B44A, #4CAF50) — พบ ${hex.length} สี ใช้สีเดิมของระบบ`);
    return null;
  }
  return hex.slice(0, 3);
}

/** รายชื่อเทศกาลที่มีภาพจริงแล้ว → src/components/festival/realArt.generated.ts (เว็บเปลี่ยนไปใช้ภาพจริงเอง ไม่ต้องแก้ kits.ts) */
function writeManifest() {
  const entries = fs
    .readdirSync(OUT)
    .filter((d) => fs.existsSync(path.join(OUT, d, "icon-1.webp")))
    .sort()
    .map((d) => {
      const has = (f) => fs.existsSync(path.join(OUT, d, f));
      const colors = readColors(path.join(SRC, d));
      // icons: มีไอคอนชิ้นที่ 4 แล้ว (ใช้แทนชิ้นที่ซ้ำกับ Effect ตามที่ตั้งใน kits.ts)
      // missing: ส่วนที่ยังไม่มีภาพจริง → เว็บใช้ภาพวาดเดิมของส่วนนั้นไปก่อน
      const missing = ["sky.webp", "seam.webp", "edge-left.webp", "footer-scene.jpg"].filter((f) => !has(f)).map((f) => f.split(".")[0]);
      return `  "${d}": { character: ${has("character.webp")}, icons: ${has("icon-4.webp")}${missing.length ? `, missing: ${JSON.stringify(missing)}` : ""}${colors ? `, colors: ${JSON.stringify(colors)}` : ""} },`;
    });
  const file = path.join(ROOT, "src", "components", "festival", "realArt.generated.ts");
  fs.writeFileSync(
    file,
    `// สร้างโดย scripts/festival-images.mjs — ห้ามแก้เอง\n// เทศกาลที่มีภาพจริงจากฝ่ายประชาสัมพันธ์แล้ว (public/festival/<key>/*.webp)\n// colors: [เข้ม (เงาส่วนท้าย), เน้น (ทอง), อ่อน (พื้นหน้าเว็บ)] จากไฟล์ .txt ในโฟลเดอร์ design ของเทศกาล\n// missing: ส่วนที่ยังไม่มีภาพจริง (sky / seam / edge-left / footer-scene) — ใช้ภาพวาดเดิมแทน\nexport const REAL_ART: Record<string, { character: boolean; icons: boolean; missing?: string[]; colors?: [string, string, string] }> = {\n${entries.join("\n")}\n};\n`
  );
  console.log(`realArt.generated.ts: ${entries.length} เทศกาล`);
}

const only = process.argv[2];
const keys = only ? [only] : fs.readdirSync(SRC).filter((d) => fs.statSync(path.join(SRC, d)).isDirectory());
for (const k of keys) await run(k);
writeManifest();
