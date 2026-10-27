/**
 * ค้นหาให้เจอแม้พิมพ์ไม่ตรง — ใช้กับแบบฟอร์ม (/forms) และกระทู้ถาม-ตอบ (/qna)
 * (ใช้ได้ทั้งหน้าเว็บและเซิร์ฟเวอร์ — ห้าม import prisma ในไฟล์นี้)
 *
 *   1. ตรงตัว   ข้อความที่พิมพ์อยู่ในชื่อ/เนื้อหา (ไม่สนช่องว่าง) → แสดงเฉพาะรายการที่ตรง แบบเดิม
 *   2. ใกล้เคียง  ไม่มีรายการที่ตรงตัว → ตัดเป็นคำ ทิ้งคำทั่วไป (ขอ หน่อย ค่ะ แบบฟอร์ม ไหมครับ)
 *               ใช้คำที่ความหมายเดียวกัน (น้ำท่วม → ภัยพิบัติ · ผู้ค้ำ → คนค้ำ) ยอมสะกดผิด 1–2 ตัว
 *               ให้คะแนนตามความเฉพาะของคำ (คำที่มีเกือบทุกรายการได้คะแนนน้อย)
 *
 * คำค้นที่สมาชิกหาไม่เจอดูได้ที่ /admin/search-insights — เจอคำใหม่ที่ควรรู้จัก ให้เพิ่มใน CONCEPTS
 */

/** คำที่ความหมายเดียวกัน — มีคำใดคำหนึ่งในคำค้น = ค้นหารายการที่มีคำใดคำหนึ่งในกลุ่ม · กลุ่มที่อยู่ก่อนตรวจก่อน */
const CONCEPTS: string[][] = [
  // ชื่อแบบฟอร์มจริงสะกด "ภัยภิบัติ" — ใส่ทั้งสองแบบ
  ["ภัยพิบัติ", "ภัยภิบัติ", "น้ำท่วม", "อุทกภัย", "อัคคีภัย", "ไฟไหม้", "วาตภัย", "พายุ", "ดินถล่ม", "แผ่นดินไหว", "บ้านพัง"],
  ["ถึงแก่กรรม", "เสียชีวิต", "ตาย", "งานศพ", "ฌาปนกิจ"],
  // อยู่ก่อนกลุ่มแต่งงาน — "คู่สมรส" ไม่ใช่เรื่องสวัสดิการมงคลสมรส
  ["คู่สมรส", "สามี", "ภรรยา", "ภริยา"],
  ["มงคลสมรส", "สมรส", "แต่งงาน"],
  ["ลายเซ็น", "ลงนาม", "ลงชื่อ", "เซ็นต์", "เซ็น"],
  ["เงินเดือน", "สลิป"],
  ["ดอกเบี้ย", "ปันผล", "เฉลี่ยคืน"],
  ["รับขวัญบุตร", "คลอดบุตร", "คลอด", "ลูกเกิด", "บุตรเกิด", "มีลูก"],
  ["อุปสมบท", "บวช", "ฮัจญ์"],
  ["เจ็บป่วย", "ป่วย", "โรงพยาบาล", "ค่ารักษา", "รักษาพยาบาล", "นอนโรงพยาบาล"],
  ["ลาออก", "ออกจากสหกรณ์", "ออกจากสมาชิก", "ยกเลิกสมาชิก"],
  ["ร้องทุกข์", "ร้องเรียน"],
  ["ผู้รับโอนประโยชน์", "ผู้รับผลประโยชน์", "ทายาท"],
  ["ผ่อนผัน", "ขยายเวลา", "พักชำระ", "พักหนี้"],
  ["การศึกษา", "ทุนการศึกษา", "จบการศึกษา", "รับปริญญา", "เรียนจบ"],
  ["เกื้อกูลอาวุโส", "อาวุโส", "ผู้สูงอายุ"],
  // ไม่ใส่ "เกษียณ" — ชนกับชื่อเงินฝาก "เกษียณสุข"
  ["บำเหน็จ"],
  ["ผู้เป็นโสด", "โสด"],
  ["ค่าหุ้น", "หุ้น"],
  ["ถอนเงิน", "ถอน"],
  ["ฉุกเฉิน", "เร่งด่วน"],
  ["ทัศนศึกษา", "ท่องเที่ยว", "เที่ยว"],
  ["ประกันชีวิต", "ประกันภัย"],
  // ยังไม่มีแบบฟอร์มเรื่องผู้ค้ำ — แยกกลุ่มไว้ ไม่ให้ "ค้ำประกัน" ไปเจอแบบฟอร์มประกันภัย
  ["ค้ำประกัน", "ผู้ค้ำ", "คนค้ำ", "ค้ำ"],
  ["หนังสือรับรอง", "ใบรับรอง"],
  ["สมัครสมาชิก", "สมาชิกใหม่", "สมัคร"],
];

/** คำทั่วไปที่ไม่ช่วยแยกรายการ */
const STOP = new Set([
  // คำถามทั่วไปในกระทู้
  "ต้อง", "จำเป็น", "ไหมครับ", "ไหมคะ", "บ้าง", "อะไร", "กรณี", "สอบถาม", "อยากทราบ", "ทราบ", "คือ", "เป็น", "มี", "ไม่", "แล้ว", "ยัง", "หรือไม่",
  "ขอ", "หน่อย", "ค่ะ", "คะ", "ครับ", "คับ", "จ้า", "นะ", "รบกวน", "อยาก", "อยากได้", "ได้", "ไหม", "มั้ย", "ยังไง", "อย่างไร",
  "ที่", "ของ", "การ", "ผู้", "สหกรณ์", "เรื่อง", "สำหรับ", "ด้วย", "จะ", "ใช้", "และ", "หรือ", "กับ", "ให้", "ไป", "มา", "เอา", "ทำ", "ยื่น", "กรอก",
  "แบบ", "แบบฟอร์ม", "แบบฟอม", "แบบฟอรม", "ฟอร์ม", "ฟอม", "ฟอรม", "เอกสาร", "ใบ", "โหลด", "ดาวน์โหลด", "ดาวโหลด", "ไฟล์",
]);

const DIGIT: Record<string, number> = { หนึ่ง: 1, เอ็ด: 1, สอง: 2, ยี่: 2, สาม: 3, สี่: 4, ห้า: 5, หก: 6, เจ็ด: 7, แปด: 8, เก้า: 9 };

/** ตัวพิมพ์เล็ก · ตัดอักขระล่องหนและ "ฯ" · "ํา" → "ำ" · เลขคำไทยหลักสิบ → ตัวเลข (ร้อยละเก้าสิบ → ร้อยละ90) */
export function normalizeText(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[​-‍﻿ฯ]/g, "")
    .replace(/ํา/g, "ำ")
    .replace(
      /(หนึ่ง|สอง|ยี่|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?สิบ(เอ็ด|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?/g,
      (_, tens?: string, ones?: string) => String((tens ? DIGIT[tens] : 1) * 10 + (ones ? DIGIT[ones] : 0))
    )
    .replace(/\s+/g, " ")
    .trim();
}

const compact = (s: string) => s.replace(/\s+/g, "");

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("th", { granularity: "word" }) : null;

/** ตัดคำภาษาไทย (เบราว์เซอร์/Node รุ่นใหม่) — ไม่รองรับ ใช้ช่องว่างแทน */
function words(s: string): string[] {
  if (!segmenter) return s.split(/\s+/).filter(Boolean);
  return [...segmenter.segment(s)].filter((x) => x.isWordLike).map((x) => x.segment);
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

interface Indexed<T> {
  item: T;
  text: string;
  words: string[];
  concepts: Set<number>;
}

export interface SmartSearchResult<T> {
  items: T[];
  /** false = ไม่มีรายการที่ตรงตัว แสดงรายการที่ใกล้เคียงแทน */
  exact: boolean;
}

/** สร้างดัชนีครั้งเดียวต่อรายการแบบฟอร์ม แล้วเรียก search ได้หลายครั้ง */
export function createSmartSearch<T>(items: T[], textOf: (item: T) => string) {
  const index: Indexed<T>[] = items.map((item) => {
    const text = compact(normalizeText(textOf(item)));
    const concepts = new Set<number>();
    CONCEPTS.forEach((group, i) => {
      if (group.some((w) => text.includes(w))) concepts.add(i);
    });
    return { item, text, words: [...new Set(words(normalizeText(textOf(item))))], concepts };
  });
  const N = Math.max(index.length, 1);
  /** คำที่มีในแบบฟอร์มน้อยฉบับ = เฉพาะเจาะจง = คะแนนสูง */
  const weight = (df: number) => Math.log(1 + N / (1 + df));

  const matchesWord = (doc: Indexed<T>, w: string) => {
    if (doc.text.includes(w)) return true;
    if (w.length < 4) return false;
    const max = w.length >= 8 ? 2 : 1;
    return doc.words.some((x) => Math.abs(x.length - w.length) <= max && editDistance(x, w) <= max);
  };

  return function search(query: string): SmartSearchResult<T> {
    const q = normalizeText(query);
    if (!q) return { items: items.slice(), exact: true };

    const exact = index.filter((d) => d.text.includes(compact(q)));
    if (exact.length) return { items: exact.map((d) => d.item), exact: true };

    // กลุ่มคำความหมายเดียวกันที่อยู่ในคำค้น — ตัดคำนั้นออกก่อนตัดคำที่เหลือ
    let rest = compact(q);
    const concepts: number[] = [];
    CONCEPTS.forEach((group, i) => {
      const hit = [...group].sort((a, b) => b.length - a.length).find((w) => rest.includes(w));
      if (hit) {
        concepts.push(i);
        rest = rest.split(hit).join(" ");
      }
    });
    const terms = [...new Set(words(rest))].filter((w) => w.length >= 2 && !STOP.has(w));

    const scores = index.map((d) => {
      let score = 0;
      for (const c of concepts) {
        if (!d.concepts.has(c)) continue;
        score += 1.5 * weight(index.filter((x) => x.concepts.has(c)).length);
      }
      for (const w of terms) {
        if (!matchesWord(d, w)) continue;
        score += weight(index.filter((x) => matchesWord(x, w)).length);
      }
      return score;
    });

    const best = Math.max(0, ...scores);
    if (best === 0) return { items: [], exact: false };
    const ranked = index
      .map((d, i) => ({ d, s: scores[i] }))
      .filter((r) => r.s >= best * 0.6)
      .sort((a, b) => b.s - a.s);
    return { items: ranked.map((r) => r.d.item), exact: false };
  };
}
