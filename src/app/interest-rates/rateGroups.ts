/**
 * จัดรูปข้อมูลอัตราดอกเบี้ยให้อ่านง่าย
 *
 * ข้อมูลจาก Admin เป็นรายการแบนทีละแถว แต่เงินกู้หลายประเภทมาเป็นคู่
 * "(มีเฉลี่ยคืน)" / "(ไม่มีเฉลี่ยคืน)" ของผลิตภัณฑ์เดียวกัน
 * ที่นี่จับคู่ให้เป็นแถวเดียว สมาชิกจะเทียบสองแบบได้ทันที
 */

export interface Rate {
  id: number;
  interestType: string | null;
  name: string | null;
  interestDate: string | null;
  conditions: string | null;
  interestRate: string | null;
  interestRateDual: string | null;
}

export interface RateValue {
  /** อัตราช่วงแรก (หรืออัตราเดียว) */
  rate: string;
  /** อัตราหลังช่วงโปรโมชัน — มีเฉพาะสินเชื่อดอกเบี้ยจูงใจ */
  laterRate?: string;
  /** ป้ายช่วงแรก เช่น "2 ปีแรก" */
  firstLabel?: string;
  /** ป้ายช่วงหลัง เช่น "ตั้งแต่ปีที่ 3" */
  laterLabel?: string;
}

export interface LoanRow {
  key: string;
  name: string;
  withRefund?: RateValue;
  withoutRefund?: RateValue;
  /** ไม่ได้ระบุว่ามี/ไม่มีเฉลี่ยคืน */
  plain?: RateValue;
}

export interface DepositRow {
  id: number;
  name: string;
  note: string | null;
  rate: string;
}

// รองรับคำสะกดผิดที่พบในข้อมูลจริง: "เฉลิ่ยคืน"
const REFUND_RE = /\(\s*(ไม่)?มีเฉล[ีิ]่?ยคืน\s*\)/;
const TAX_FREE_RE = /\(\s*ไม่เสียภาษี\s*\)/;

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
const stripParens = (s: string) => tidy(s.replace(/^\(|\)$/g, ""));

function toRateValue(r: Rate): RateValue {
  const value: RateValue = { rate: r.interestRate ?? "" };
  if (r.interestRateDual) {
    value.laterRate = r.interestRateDual;
    const years = (r.name ?? "").match(/คงที่\s*(\d+)\s*ปีแรก/);
    value.firstLabel = years ? `${years[1]} ปีแรก` : "ช่วงแรก";
    value.laterLabel = r.conditions ? stripParens(r.conditions) : "ช่วงถัดไป";
  }
  return value;
}

/** จับคู่เงินกู้ที่ชื่อเหมือนกันแต่ต่างกันที่ (มี/ไม่มีเฉลี่ยคืน) ให้อยู่แถวเดียว คงลำดับเดิมจาก Admin */
export function groupLoans(rates: Rate[]): LoanRow[] {
  const rows: LoanRow[] = [];
  const byName = new Map<string, LoanRow>();

  for (const r of rates) {
    const raw = r.name ?? "";
    const m = raw.match(REFUND_RE);
    const name = tidy(raw.replace(REFUND_RE, ""));
    let row = byName.get(name);
    if (!row) {
      row = { key: `loan-${r.id}`, name };
      byName.set(name, row);
      rows.push(row);
    }
    const value = toRateValue(r);
    if (!m) row.plain = value;
    else if (m[1]) row.withoutRefund = value;
    else row.withRefund = value;
  }
  return rows;
}

/** เงินฝาก: ตัด "(ไม่เสียภาษี)" ออกจากชื่อ (ถ้าทุกประเภทไม่เสียภาษีจะบอกครั้งเดียวที่หัวตาราง) */
export function tidyDeposits(rates: Rate[]): { rows: DepositRow[]; allTaxFree: boolean } {
  const allTaxFree = rates.length > 0 && rates.every((r) => TAX_FREE_RE.test(r.name ?? ""));
  const rows = rates.map((r) => ({
    id: r.id,
    name: tidy(allTaxFree ? (r.name ?? "").replace(TAX_FREE_RE, "") : r.name ?? ""),
    note: r.conditions ? stripParens(r.conditions) : null,
    rate: r.interestRate ?? "",
  }));
  return { rows, allTaxFree };
}

export const toNumber = (s: string | null | undefined) => {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) ? n : null;
};
