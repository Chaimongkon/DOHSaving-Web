/**
 * แจ้งเตือนเจ้าหน้าที่ทาง Telegram (ฟรี ไม่จำกัดจำนวนข้อความ) — ฝั่งเซิร์ฟเวอร์เท่านั้น
 *
 * ตั้งค่าใน .env (วิธีสร้างบอทดู DEPLOY.md):
 *   TELEGRAM_BOT_TOKEN=123456:ABC...
 *   TELEGRAM_CHAT_ID=-1001234567890        (หลายห้องคั่นด้วย ,)
 * ไม่ได้ตั้ง = ปิดการแจ้งเตือนเงียบ ๆ เว็บทำงานปกติ
 *
 * ข้อความส่งออกนอกระบบ → ไม่ใส่ชื่อ เบอร์โทร อีเมล เลขสมาชิก ส่งแค่หัวข้อพร้อมลิงก์ให้เข้าไปดูในระบบหลังบ้าน
 */
import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 5000;

function config() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chats = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return token && chats.length ? { token, chats } : null;
}

export const isTelegramConfigured = () => config() !== null;
export const telegramChatCount = () => config()?.chats.length ?? 0;

/* ═════════ เปิด/ปิดการแจ้งเตือนแต่ละแบบ (ตั้งที่ /admin/settings) ═════════ */

export const TELEGRAM_SETTINGS_KEY = "telegram_settings";
export type TelegramEvent = "complaint" | "question" | "reply" | "digest";
export type TelegramToggles = Record<TelegramEvent, boolean>;
export const TELEGRAM_DEFAULTS: TelegramToggles = { complaint: true, question: true, reply: true, digest: true };

let togglesCache: { at: number; value: TelegramToggles } | null = null;

export function parseTelegramToggles(raw: string | null | undefined): TelegramToggles {
  try {
    const p = raw ? JSON.parse(raw) : {};
    return {
      complaint: p.complaint !== false,
      question: p.question !== false,
      reply: p.reply !== false,
      digest: p.digest !== false,
    };
  } catch {
    return TELEGRAM_DEFAULTS;
  }
}

/** อ่านสวิตช์ (จำไว้ 1 นาที ไม่ต้องอ่านฐานข้อมูลทุกครั้งที่มีเรื่องใหม่) */
export async function getTelegramToggles(): Promise<TelegramToggles> {
  if (togglesCache && Date.now() - togglesCache.at < 60_000) return togglesCache.value;
  const row = await prisma.siteSetting.findUnique({ where: { key: TELEGRAM_SETTINGS_KEY }, select: { value: true } }).catch(() => null);
  const value = parseTelegramToggles(row?.value);
  togglesCache = { at: Date.now(), value };
  return value;
}

/** เรียกหลังบันทึกสวิตช์ใหม่ ให้มีผลทันที */
export const resetTelegramToggles = () => {
  togglesCache = null;
};

const enabled = async (event: TelegramEvent) => (await getTelegramToggles())[event];

/** ผลการส่งครั้งล่าสุด (นับตั้งแต่เซิร์ฟเวอร์เริ่มทำงาน) — แสดงในหน้าตั้งค่า */
export let lastDelivery: { at: string; ok: boolean; error: string | null } | null = null;

/** ข้อความจากฐานข้อมูลบางส่วนถูก escape เป็น HTML entity ไว้แล้ว — ถอดกลับก่อน แล้วค่อย escape ใหม่ให้ Telegram */
function plain(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** หัวข้อสั้น ๆ ที่ปิดตัวเลขยาว (เบอร์โทร/เลขสมาชิก/เลขบัตร) แล้ว */
function safeTitle(s: string | null | undefined, max = 90) {
  const t = plain(s ?? "").replace(/\s+/g, " ").trim().replace(/\d[\d\s-]{4,}\d/g, "•••");
  return esc(t.length > max ? `${t.slice(0, max).trimEnd()}…` : t || "(ไม่มีหัวข้อ)");
}

function adminLink(path: string, label: string) {
  try {
    return `<a href="${esc(absoluteUrl(path))}">${label}</a>`;
  } catch {
    return ""; // ไม่ได้ตั้ง NEXT_PUBLIC_SITE_URL — ส่งข้อความโดยไม่มีลิงก์
  }
}

/** ส่งข้อความ (HTML) ไปทุกห้องที่ตั้งไว้ · ล้มเหลวแค่บันทึก log ไม่โยน error */
export async function sendTelegram(html: string): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  const results = await Promise.all(
    cfg.chats.map(async (chat_id) => {
      try {
        const res = await fetch(`${API}/bot${cfg.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 200);
          console.error(`[telegram] ส่งไม่สำเร็จ (${res.status}):`, detail);
          return describeError(res.status, detail);
        }
        return null;
      } catch (error) {
        console.error("[telegram] ส่งไม่สำเร็จ:", error instanceof Error ? error.message : error);
        return "เชื่อมต่อ Telegram ไม่ได้ (เครือข่ายหรือไฟร์วอลล์ของเซิร์ฟเวอร์)";
      }
    })
  );
  const failed = results.filter((r): r is string => r !== null);
  const ok = failed.length < results.length;
  lastDelivery = { at: new Date().toISOString(), ok, error: failed[0] ?? null };
  return ok;
}

/** แปลงข้อผิดพลาดจาก Telegram เป็นภาษาที่เจ้าหน้าที่เข้าใจ */
function describeError(status: number, detail: string): string {
  if (status === 401) return "Token ของบอทไม่ถูกต้อง (ตรวจ TELEGRAM_BOT_TOKEN)";
  if (status === 400 && /chat not found/i.test(detail)) return "ไม่พบห้องแชต (ตรวจ TELEGRAM_CHAT_ID)";
  if (status === 403) return "บอทถูกนำออกจากห้อง หรือยังไม่ได้เพิ่มบอทเข้าห้อง";
  if (status === 429) return "ส่งข้อความถี่เกินไป Telegram ให้รอสักครู่";
  return `Telegram ตอบกลับผิดพลาด (${status})`;
}

/** ข้อความทดสอบจากหน้าตั้งค่า */
export function sendTelegramTest(by: string) {
  return sendTelegram(
    [`✅ <b>ทดสอบการแจ้งเตือน</b>`, `ระบบหลังบ้านเว็บสหกรณ์ส่งข้อความถึงห้องนี้ได้ปกติ`, `ทดสอบโดย ${esc(by)}`, adminLink("/admin/settings", "เปิดหน้าตั้งค่า →")]
      .filter(Boolean)
      .join("\n")
  );
}

/* ═════════ เหตุการณ์ ═════════ */

const COMPLAINT_LABELS: Record<string, string> = {
  complaint: "ร้องเรียน",
  suggestion: "ข้อเสนอแนะ",
  inquiry: "สอบถาม",
};

export async function notifyNewComplaint(c: { trackingCode: string; category: string; subject: string | null }) {
  if (!(await enabled("complaint"))) return false;
  return sendTelegram(
    [
      `📮 <b>เรื่อง${COMPLAINT_LABELS[c.category] ?? "ร้องเรียน"}ใหม่</b>`,
      safeTitle(c.subject),
      `เลขที่ ${esc(c.trackingCode)}`,
      adminLink("/admin/complaints", "เปิดในระบบหลังบ้าน →"),
    ].filter(Boolean).join("\n")
  );
}

export async function notifyNewQuestion(q: { id: number; title: string }) {
  if (!(await enabled("question"))) return false;
  return sendTelegram(
    [
      `💬 <b>คำถามใหม่ในกระดานถาม-ตอบ</b>`,
      safeTitle(q.title),
      adminLink("/admin/qna", "ตอบในระบบหลังบ้าน →"),
    ].filter(Boolean).join("\n")
  );
}

export async function notifyMemberReply(q: { id: number; title: string }) {
  if (!(await enabled("reply"))) return false;
  return sendTelegram(
    [
      `↩️ <b>สมาชิกถามต่อในกระทู้</b>`,
      safeTitle(q.title),
      adminLink("/admin/qna", "ตอบในระบบหลังบ้าน →"),
    ].filter(Boolean).join("\n")
  );
}

/* ═════════ สรุปงานค้างประจำวัน ═════════ */

export const DIGEST_KEY = "telegram_digest_last";
export const DIGEST_HOUR = 8; // หลัง 08:00 น. วันทำการ
const CHECK_EVERY_MS = 10 * 60 * 1000;
const TH = 7 * 60 * 60 * 1000;

let lastCheck = 0;
let running = false;

/**
 * ส่งสรุปงานค้าง (ร้องเรียน + กระทู้รอตอบ) วันละครั้ง จันทร์–ศุกร์
 * เรียกจากเส้นทางที่มีคนเข้าบ่อย ไม่ต้องตั้ง cron · จำวันที่ส่งไว้ในฐานข้อมูล รีสตาร์ตเซิร์ฟเวอร์แล้วไม่ส่งซ้ำ
 */
export async function maybeSendDailyDigest(): Promise<void> {
  const now = Date.now();
  if (running || now - lastCheck < CHECK_EVERY_MS || !isTelegramConfigured()) return;
  lastCheck = now;

  const th = new Date(now + TH);
  const weekday = th.getUTCDay();
  if (weekday === 0 || weekday === 6 || th.getUTCHours() < DIGEST_HOUR) return;
  const today = th.toISOString().slice(0, 10);

  running = true;
  try {
    if (!(await enabled("digest"))) return;
    const last = await prisma.siteSetting.findUnique({ where: { key: DIGEST_KEY }, select: { value: true } });
    if (last?.value === today) return;
    // จองวันนี้ก่อนส่ง — ถ้าส่งล้มเหลวก็ไม่วนส่งซ้ำทั้งวัน
    await prisma.siteSetting.upsert({
      where: { key: DIGEST_KEY },
      update: { value: today },
      create: { key: DIGEST_KEY, value: today, remark: "วันที่ส่งสรุปงานค้างทาง Telegram ล่าสุด" },
    });

    const [pending, reviewing, open] = await Promise.all([
      prisma.complaint.count({ where: { status: "pending" } }),
      prisma.complaint.count({ where: { status: "reviewing" } }),
      prisma.qnaQuestion.findMany({
        where: { isActive: true, isClosed: false },
        select: {
          createdAt: true,
          replies: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 1, select: { isAdmin: true, createdAt: true } },
        },
      }),
    ]);
    const waiting = open
      .filter((q) => !q.replies[0] || !q.replies[0].isAdmin)
      .map((q) => (q.replies[0]?.createdAt ?? q.createdAt).getTime());
    if (pending + reviewing === 0 && waiting.length === 0) return; // ไม่มีงานค้าง ไม่ต้องรบกวน

    const oldestDays = waiting.length ? Math.floor((now - Math.min(...waiting)) / 86400000) : 0;
    const lines = [`☀️ <b>งานค้างประจำวัน</b> (${th.getUTCDate()}/${th.getUTCMonth() + 1})`];
    if (pending + reviewing > 0) {
      lines.push(`📮 ร้องเรียน/เสนอแนะ ${pending + reviewing} เรื่อง (รอรับเรื่อง ${pending} · กำลังตรวจสอบ ${reviewing})`);
      const link = adminLink("/admin/complaints", "เปิดรายการร้องเรียน →");
      if (link) lines.push(link);
    }
    if (waiting.length > 0) {
      lines.push(`💬 กระทู้รอตอบ ${waiting.length} กระทู้${oldestDays > 0 ? ` (รอนานสุด ${oldestDays} วัน)` : ""}`);
      const link = adminLink("/admin/qna", "เปิดกระดานถาม-ตอบ →");
      if (link) lines.push(link);
    }
    await sendTelegram(lines.join("\n"));
  } catch (error) {
    console.error("[telegram] daily digest failed:", error);
  } finally {
    running = false;
  }
}
