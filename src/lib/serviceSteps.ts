// ============================================================
// ขั้นตอนแบบข้อความของหน้าบริการ (service_pages.steps — JSON)
// แสดงคู่กับรูป infographic: ตัวหนังสือใหญ่ อ่านบนมือถือได้ และแนบปุ่มดาวน์โหลด/ลิงก์ไว้ในขั้นตอนนั้นเลย
// ใช้ร่วมกันทั้งหน้าเว็บ, API และหน้าแอดมิน
// ============================================================

export interface ServiceStep {
  title: string;
  detail?: string;
  /** index ของเอกสารใน downloadLinks — แสดงปุ่มดาวน์โหลดในขั้นนี้ */
  docIndex?: number;
  /** ปุ่มลิงก์เพิ่มเติม เช่น "เพิ่มเพื่อน LINE @dohsaving" */
  linkLabel?: string;
  linkUrl?: string;
}

export const MAX_STEPS = 12;
const MAX_TITLE = 120;
const MAX_DETAIL = 600;
const MAX_LABEL = 80;
const MAX_URL = 500;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ลิงก์ในปุ่ม: อนุญาตเฉพาะ http(s) และ path ภายในเว็บ — กัน javascript: ฯลฯ
function safeUrl(v: unknown): string {
  const url = str(v, MAX_URL);
  return /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : "";
}

/** อ่านและทำความสะอาดข้อมูลขั้นตอน (รับได้ทั้ง JSON string และ array) — ข้อมูลเสียคืน [] */
export function parseSteps(raw: unknown): ServiceStep[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const steps: ServiceStep[] = [];
  for (const item of list.slice(0, MAX_STEPS)) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const title = str(s.title, MAX_TITLE);
    if (!title) continue;
    const step: ServiceStep = { title };
    const detail = str(s.detail, MAX_DETAIL);
    if (detail) step.detail = detail;
    if (Number.isInteger(s.docIndex) && (s.docIndex as number) >= 0) step.docIndex = s.docIndex as number;
    const linkUrl = safeUrl(s.linkUrl);
    const linkLabel = str(s.linkLabel, MAX_LABEL);
    if (linkUrl && linkLabel) {
      step.linkUrl = linkUrl;
      step.linkLabel = linkLabel;
    }
    steps.push(step);
  }
  return steps;
}

/** สำหรับบันทึกลงฐานข้อมูล — ว่างคืน null */
export function serializeSteps(raw: unknown): string | null {
  const steps = parseSteps(raw);
  return steps.length ? JSON.stringify(steps) : null;
}
