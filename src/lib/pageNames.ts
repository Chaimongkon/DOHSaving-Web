/**
 * ชื่อหน้าที่อ่านเข้าใจได้สำหรับสถิติการเข้าชม (ฝั่งเซิร์ฟเวอร์เท่านั้น)
 *
 * ลำดับการเลือกชื่อ:
 *   1. ชื่อที่แอดมินตั้งเองในเมนู "ตั้งค่าแสดงชื่อ URL" (url_translation:*) — ชนะเสมอ
 *   2. ชื่อจริงจากฐานข้อมูลของหน้าที่มี id/slug (ข่าว · กระทู้ · หน้าบริการ · รายงานประจำปี · อัลบั้ม)
 *   3. ชื่อหมวดของเว็บ + ส่วนท้ายของ URL
 */
import prisma from "@/lib/prisma";

/** หมวดของเว็บ (ส่วนแรกของ URL) */
export const SECTION_LABELS: Record<string, string> = {
  "": "หน้าแรก",
  forms: "ดาวน์โหลดแบบฟอร์ม",
  services: "บริการ",
  news: "ข่าวสาร",
  "interest-rates": "อัตราดอกเบี้ย",
  about: "เกี่ยวกับสหกรณ์",
  qna: "ถาม-ตอบ",
  contact: "ติดต่อเรา",
  "download-app": "ดาวน์โหลดแอป",
  regulations: "ข้อบังคับ / ระเบียบ / ประกาศ",
  "bank-accounts": "บัญชีธนาคาร",
  "annual-reports": "รายงานประจำปี",
  activities: "ภาพกิจกรรม",
  reports: "รายงานการเงิน / ประชุม",
  complaints: "ร้องเรียน / เสนอแนะ",
  videos: "วิดีโอ",
  "cookie-policy": "นโยบายคุกกี้",
  "privacy-policy": "นโยบายความเป็นส่วนตัว",
  terms: "ข้อกำหนดการใช้งาน",
  downloads: "เอกสารดาวน์โหลด",
};

/** หน้าคงที่ที่รู้จัก (ไม่มี id) */
const STATIC_LABELS: Record<string, string> = {
  "/regulations/statute": "ข้อบังคับ",
  "/regulations/rules": "ระเบียบ",
  "/regulations/announcements": "ประกาศ",
  "/reports/financial-summary": "รายการย่อแสดงสินทรัพย์และหนี้สิน",
  "/reports/annual-meeting": "เอกสารประกอบการประชุมใหญ่",
  "/services/loan-calculator": "คำนวณเงินกู้",
  "/services/member-media": "สื่อสำหรับสมาชิก",
  "/services/app-dohsaving": "วิธีใช้งานแอป DOHSaving",
};

/** ส่วนแรกของ URL ที่มีหน้าอยู่จริงในเว็บ — นอกเหนือจากนี้คือลิงก์เก่า/พิมพ์ผิด (ผู้ใช้เจอหน้า 404) */
const LIVE_SECTIONS = new Set([
  ...Object.keys(SECTION_LABELS),
  "BusinessReport", "DownloadForm", "MemberMedia", "uploads",
]);

export const sectionOf = (url: string) => url.split("?")[0].split("/")[1] ?? "";
export const isKnownSection = (url: string) => LIVE_SECTIONS.has(sectionOf(url));

const short = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** ชื่อหน้าของ URL หลายรายการพร้อมกัน (ดึงชื่อจากฐานข้อมูลแบบรวมครั้งเดียวต่อประเภท) */
export async function resolvePageNames(urls: string[]): Promise<Record<string, string>> {
  const clean = [...new Set(urls.map((u) => u.split("?")[0].split("#")[0] || "/"))];

  const ids = (prefix: string) =>
    clean
      .map((u) => new RegExp(`^/${prefix}/(\\d+)$`).exec(u)?.[1])
      .filter((v): v is string => !!v)
      .map(Number);
  const slugs = clean.map((u) => /^\/services\/([^/]+)$/.exec(u)?.[1]).filter((v): v is string => !!v);

  const [mappings, news, qna, services, reports, albums] = await Promise.all([
    prisma.siteSetting.findMany({ where: { key: { startsWith: "url_translation:" } }, select: { key: true, value: true } }),
    ids("news").length ? prisma.news.findMany({ where: { id: { in: ids("news") } }, select: { id: true, title: true } }) : [],
    ids("qna").length ? prisma.qnaQuestion.findMany({ where: { id: { in: ids("qna") } }, select: { id: true, title: true } }) : [],
    slugs.length ? prisma.servicePage.findMany({ where: { slug: { in: slugs } }, select: { slug: true, title: true } }) : [],
    ids("annual-reports").length
      ? prisma.annualReport.findMany({ where: { id: { in: ids("annual-reports") } }, select: { id: true, title: true } })
      : [],
    ids("activities").length
      ? prisma.activityAlbum.findMany({ where: { id: { in: ids("activities") } }, select: { id: true, title: true } })
      : [],
  ]);

  const manual = new Map(mappings.filter((m) => m.value).map((m) => [m.key.replace("url_translation:", ""), m.value!]));
  const dynamic = new Map<string, string>();
  for (const n of news) if (n.title) dynamic.set(`/news/${n.id}`, `ข่าว: ${short(n.title)}`);
  for (const q of qna) dynamic.set(`/qna/${q.id}`, `กระทู้: ${short(q.title)}`);
  for (const s of services) dynamic.set(`/services/${s.slug}`, `บริการ: ${short(s.title)}`);
  for (const r of reports) dynamic.set(`/annual-reports/${r.id}`, `eBook: ${short(r.title)}`);
  for (const a of albums) dynamic.set(`/activities/${a.id}`, `กิจกรรม: ${short(a.title)}`);

  const out: Record<string, string> = {};
  for (const url of clean) {
    const fromMap = manual.get(url);
    if (fromMap) {
      out[url] = fromMap;
      continue;
    }
    const known = dynamic.get(url) ?? STATIC_LABELS[url];
    if (known) {
      out[url] = known;
      continue;
    }
    const section = sectionOf(url);
    const label = SECTION_LABELS[section];
    const rest = url.split("/").slice(2).join("/");
    out[url] = label ? (rest ? `${label} › ${decodeURIComponent(rest)}` : label) : decodeURIComponent(url);
  }
  return out;
}
