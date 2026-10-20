/**
 * "ตอบข้อความนี้" ในกระดานถาม-ตอบ
 *
 * กระทู้หนึ่งมักมีสมาชิกหลายคนถามต่อกันท้ายกระทู้ เจ้าหน้าที่จึงต้องบอกได้ว่าคำตอบนี้ตอบข้อความไหน
 * เก็บเป็นบรรทัดแรกของคำตอบในรูปแบบที่คนอ่านเข้าใจได้แม้ไม่มีโปรแกรมช่วยแสดงผล:
 *
 *   ↪ ตอบ นายเกรียงไกร ศรีสุราช: “มีความประสงค์จะลาออกจากสมาชิก…”
 *
 *   (เนื้อคำตอบ)
 *
 * ไม่ต้องเพิ่มคอลัมน์ในฐานข้อมูล · หน้าเว็บที่รู้จักรูปแบบนี้จะวาดเป็นกรอบอ้างอิงให้
 */
import { maskPlain, stripMarkers } from "./qnaPrivacy";

const QUOTE_RE = /^↪ ตอบ ([^:\n]{1,120}): “([^”\n]{0,200})”\n+/;
const EXCERPT_MAX = 70;

export interface QnaQuote {
  author: string;
  excerpt: string;
}

/** ข้อความย่อของต้นฉบับ — ซ่อนเบอร์โทร/เลขบัตร/เลขบัญชีเสมอ เพราะคำตอบเจ้าหน้าที่แสดงสาธารณะโดยไม่ผ่านการซ่อน */
export function excerptOf(text: string): string {
  const flat = maskPlain(stripMarkers(text)).replace(/\s+/g, " ").replace(/”/g, '"').trim();
  return flat.length > EXCERPT_MAX ? `${flat.slice(0, EXCERPT_MAX).trimEnd()}…` : flat;
}

/** บรรทัดอ้างอิงที่วางไว้หน้าคำตอบ */
export function makeQuote(author: string, text: string): string {
  const name = author.replace(/[:\n]/g, " ").replace(/\s+/g, " ").trim() || "สมาชิก";
  return `↪ ตอบ ${name}: “${excerptOf(text)}”\n\n`;
}

/** แยกบรรทัดอ้างอิงออกจากเนื้อคำตอบ */
export function splitQuote(body: string): { quote: QnaQuote | null; rest: string } {
  const m = QUOTE_RE.exec(body);
  if (!m) return { quote: null, rest: body };
  return { quote: { author: m[1].trim(), excerpt: m[2] }, rest: body.slice(m[0].length) };
}

/** ข้อความต้นฉบับตรงกับบรรทัดอ้างอิงหรือไม่ (เทียบชื่อ + ข้อความย่อ) */
export function quoteMatches(quote: QnaQuote, author: string, text: string): boolean {
  if (quote.author !== author.replace(/[:\n]/g, " ").replace(/\s+/g, " ").trim()) return false;
  const want = quote.excerpt.replace(/…$/, "");
  return excerptOf(text).replace(/…$/, "").startsWith(want);
}
