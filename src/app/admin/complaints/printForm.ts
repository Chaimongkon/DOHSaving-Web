/**
 * แบบฟอร์มรับเรื่องร้องเรียน / ข้อเสนอแนะ (ฉบับพิมพ์ A4) — ใช้แนบแฟ้มและเสนอผู้บังคับบัญชาลงนาม
 *
 * โครงตามแบบฟอร์มรับเรื่องร้องเรียนที่ใช้กันทั่วไปในองค์กรการเงิน:
 *   หัวกระดาษ (ตราสหกรณ์ · ชื่อ · ที่อยู่ · เลขที่รับ)
 *   ส่วนที่ 1 การรับเรื่อง — ประเภท ช่องทาง ข้อมูลผู้แจ้ง รายละเอียด ผู้รับเรื่อง/มอบหมายฝ่าย
 *   ส่วนที่ 2 การดำเนินการและแจ้งผล — การดำเนินการ ผลการพิจารณา การแจ้งผู้แจ้ง ลงนามตามลำดับ
 * ช่องที่ระบบมีข้อมูลจะเติมให้ ช่องที่ต้องเขียนด้วยมือเว้นเป็นเส้นประ
 */
import { clean, type ContactInfoMap } from "@/lib/contactInfo";

export interface PrintableComplaint {
  trackingCode: string;
  category: string;
  name: string | null;
  memberId: string | null;
  tel: string | null;
  email: string | null;
  subject: string | null;
  complaint: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const ORG_NAME = "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด";
const ORG_NAME_EN = "DEPARTMENT OF HIGHWAYS SAVING AND CREDIT COOPERATIVE, LIMITED";
const LOGO_PATH = "/images/logo/logo.png";

const CATEGORIES = [
  { key: "complaint", label: "ร้องเรียน" },
  { key: "suggestion", label: "ข้อเสนอแนะ" },
  { key: "inquiry", label: "สอบถาม" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ",
  reviewing: "อยู่ระหว่างตรวจสอบ",
  resolved: "ดำเนินการเสร็จสิ้น",
  rejected: "ไม่รับพิจารณา",
};

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const thaiDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }) + (withTime ? " น." : "");

const box = (checked: boolean) => `<span class="box">${checked ? "✓" : ""}</span>`;
const dots = (n: number) => Array.from({ length: n }, () => `<div class="dots"></div>`).join("");
const value = (v: string | null | undefined, fallback = "-") => (clean(v) ? esc(v) : `<span class="muted">${fallback}</span>`);

function signature(role: string, withDate = true) {
  return `<div class="sig">
    <div class="sigLine">ลงชื่อ ........................................................</div>
    <div class="sigName">(........................................................)</div>
    <div class="sigRole">${role}</div>
    ${withDate ? `<div class="sigDate">วันที่ ........../........................../..............</div>` : ""}
  </div>`;
}

export function printComplaintForm(c: PrintableComplaint, info: ContactInfoMap, departments: string[]) {
  const win = window.open("", "_blank");
  if (!win) return;

  const origin = window.location.origin;
  const address = clean(info.address).replace(/\n/g, " ");
  const phone = clean(info.mainPhone);
  const email = clean(info.email);
  const closed = c.status === "resolved" || c.status === "rejected";
  const anonymous = !clean(c.name) || c.name === "ผู้ไม่ประสงค์ออกนาม";

  // ฝ่ายที่มอบหมาย — แบ่ง 2 คอลัมน์ ให้ติ๊กด้วยมือ
  const deptList = [...departments, "อื่น ๆ ......................................"];
  const deptHtml = deptList.map((d) => `<div>${box(false)} ${esc(d)}</div>`).join("");

  win.document.write(`<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<title>แบบฟอร์มรับเรื่อง ${esc(c.trackingCode)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 11mm 13mm 10mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Sarabun", "TH Sarabun New", sans-serif; font-size: 13.5px; line-height: 1.45; color: #111; }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }

  /* หัวกระดาษ */
  .letterhead { display: flex; align-items: center; gap: 14px; padding-bottom: 8px; border-bottom: 2.5px solid #0f1d36; }
  .letterhead img { width: 62px; height: 62px; object-fit: contain; }
  .org { flex: 1; }
  .org h1 { margin: 0; font-size: 19px; font-weight: 700; color: #0f1d36; }
  .org .en { font-size: 10.5px; letter-spacing: .3px; color: #444; }
  .org .addr { font-size: 12px; color: #333; }
  .docno { width: 190px; border: 1.5px solid #0f1d36; font-size: 13px; }
  .docno div { padding: 3px 8px; }
  .docno div + div { border-top: 1px solid #0f1d36; }
  .docno b { font-family: ui-monospace, Consolas, monospace; font-size: 13.5px; }
  .gold { height: 3px; margin-top: 2px; background: #c9a43a; }

  h2.title { margin: 8px 0 0; text-align: center; font-size: 18px; font-weight: 700; }
  .subtitle { margin: 0 0 6px; text-align: center; font-size: 13px; color: #444; }

  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #333; padding: 4px 8px; vertical-align: top; text-align: left; }
  .sec th { background: #e8ebf1; font-size: 14.5px; font-weight: 700; }
  .sub th { background: #f5f6f8; font-weight: 600; text-align: center; }
  .label { width: 135px; font-weight: 600; background: #fafafa; }
  .row-flex { display: flex; flex-wrap: wrap; gap: 4px 22px; }
  .box { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; margin-right: 4px; border: 1px solid #111; font-size: 11px; line-height: 1; vertical-align: -1px; }
  .muted { color: #777; }
  .detail { min-height: 110px; white-space: pre-wrap; font-size: 13px; line-height: 1.5; }
  .dots { height: 21px; border-bottom: 1px dotted #555; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 18px; }

  .sigs { display: flex; justify-content: space-around; gap: 18px; padding: 10px 6px 2px; break-inside: avoid; }
  .sig { text-align: center; font-size: 13px; line-height: 1.7; }
  .sigRole { font-weight: 600; }
  tr { break-inside: avoid; }
  .note { margin-top: 4px; font-size: 11.5px; color: #444; }
  .footer { margin-top: 8px; display: flex; justify-content: space-between; font-size: 10.5px; color: #666; }
  @media screen { body { background: #e5e7eb; } .page { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 14mm 15mm 14mm 18mm; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.15); } }
</style></head><body>

<!-- ═════════ หน้า 1: การรับเรื่อง ═════════ -->
<div class="page">
  <div class="letterhead">
    <img src="${origin}${LOGO_PATH}" alt="ตราสหกรณ์">
    <div class="org">
      <h1>${ORG_NAME}</h1>
      <div class="en">${ORG_NAME_EN}</div>
      <div class="addr">${esc(address)}${phone ? ` · โทร ${esc(phone)}` : ""}${email ? ` · ${esc(email)}` : ""}</div>
    </div>
    <div class="docno">
      <div>เลขที่รับ <b>${esc(c.trackingCode)}</b></div>
      <div>วันที่รับ ${thaiDate(c.createdAt)}</div>
    </div>
  </div>
  <div class="gold"></div>

  <h2 class="title">แบบฟอร์มรับเรื่องร้องเรียน / ข้อเสนอแนะ</h2>
  <p class="subtitle">สำหรับเจ้าหน้าที่ — รับเรื่อง เสนอผู้บังคับบัญชา และบันทึกผลการดำเนินการ</p>

  <table>
    <tr class="sec"><th colspan="2">ส่วนที่ 1 &nbsp;การรับเรื่อง</th></tr>
    <tr>
      <td class="label">ประเภทเรื่อง</td>
      <td><div class="row-flex">${CATEGORIES.map((k) => `<span>${box(c.category === k.key)}${k.label}</span>`).join("")}</div></td>
    </tr>
    <tr>
      <td class="label">ช่องทางรับเรื่อง</td>
      <td><div class="row-flex">
        <span>${box(true)}เว็บไซต์สหกรณ์</span><span>${box(false)}โทรศัพท์</span>
        <span>${box(false)}ยื่นด้วยตนเอง</span><span>${box(false)}หนังสือ/จดหมาย</span>
        <span>${box(false)}อื่น ๆ ....................</span>
      </div></td>
    </tr>
    <tr>
      <td class="label">วันเวลาที่รับเรื่อง</td>
      <td>${thaiDate(c.createdAt, true)}</td>
    </tr>

    <tr class="sub"><th colspan="2">ข้อมูลผู้แจ้ง</th></tr>
    <tr>
      <td class="label">ชื่อ - สกุล</td>
      <td>${anonymous ? `${box(true)}ไม่ประสงค์ออกนาม` : esc(c.name)}</td>
    </tr>
    <tr><td class="label">เลขทะเบียนสมาชิก</td><td>${value(c.memberId, "ไม่ระบุ")}</td></tr>
    <tr><td class="label">โทรศัพท์</td><td>${value(c.tel, "ไม่ระบุ")}</td></tr>
    <tr><td class="label">อีเมล</td><td>${value(c.email, "ไม่ระบุ")}</td></tr>

    <tr class="sub"><th colspan="2">รายละเอียดเรื่อง</th></tr>
    <tr><td class="label">เรื่อง</td><td><b>${value(c.subject)}</b></td></tr>
    <tr><td colspan="2" class="detail">${value(c.complaint, "ไม่มีรายละเอียดประกอบ")}</td></tr>

    <tr class="sub"><th colspan="2">ความเห็นผู้รับเรื่อง / มอบหมายฝ่ายที่รับผิดชอบ</th></tr>
    <tr><td colspan="2">
      <div class="grid2">${deptHtml}</div>
      ${dots(1)}
      <div class="sigs">${signature("ผู้รับเรื่อง")}${signature("ผู้จัดการ / ผู้บังคับบัญชา")}</div>
    </td></tr>
  </table>
  <div class="note">หมายเหตุ: ข้อมูลส่วนบุคคลของผู้แจ้งใช้เพื่อการพิจารณาเรื่องนี้เท่านั้น ห้ามเปิดเผยต่อบุคคลที่ไม่เกี่ยวข้อง</div>
  <div class="footer"><span>เลขที่รับ ${esc(c.trackingCode)} · หน้า 1/2</span><span>พิมพ์จากระบบ เมื่อ ${thaiDate(new Date().toISOString(), true)}</span></div>
</div>

<!-- ═════════ หน้า 2: การดำเนินการและแจ้งผล ═════════ -->
<div class="page">
  <table>
    <tr class="sec"><th colspan="2">ส่วนที่ 2 &nbsp;การดำเนินการและการแจ้งผล &nbsp;<span style="font-weight:400">(เลขที่รับ ${esc(c.trackingCode)})</span></th></tr>

    <tr class="sub"><th colspan="2">การดำเนินการของฝ่ายที่รับผิดชอบ</th></tr>
    <tr><td colspan="2">
      ${dots(4)}
      <div class="sigs">${signature("ผู้ดำเนินการ")}${signature("หัวหน้าฝ่าย")}</div>
    </td></tr>

    <tr class="sub"><th colspan="2">ผลการพิจารณา</th></tr>
    <tr>
      <td class="label">ผล</td>
      <td><div class="row-flex">
        <span>${box(c.status === "resolved")}ดำเนินการแก้ไข/ชี้แจงแล้วเสร็จ</span>
        <span>${box(c.status === "rejected")}ไม่รับพิจารณา</span>
        <span>${box(!closed)}อยู่ระหว่างดำเนินการ</span>
      </div></td>
    </tr>
    <tr><td class="label">สถานะในระบบ</td><td>${esc(STATUS_LABEL[c.status] ?? c.status)}${c.resolvedAt ? ` · ปิดเรื่องเมื่อ ${thaiDate(c.resolvedAt)}` : ""}</td></tr>
    <tr>
      <td class="label">ข้อความแจ้งผู้แจ้ง</td>
      <td>${clean(c.adminNote) ? `<div style="white-space:pre-wrap">${esc(c.adminNote)}</div>` : dots(4)}</td>
    </tr>

    <tr class="sub"><th colspan="2">การแจ้งผลให้ผู้แจ้งทราบ</th></tr>
    <tr>
      <td class="label">ช่องทางแจ้งผล</td>
      <td><div class="row-flex">
        <span>${box(clean(c.adminNote) !== "")}หน้าติดตามสถานะบนเว็บไซต์</span>
        <span>${box(false)}โทรศัพท์</span><span>${box(false)}อีเมล</span><span>${box(false)}หนังสือ</span>
      </div>
      <div style="margin-top:6px">วันที่แจ้งผล ........../........................../..............</div></td>
    </tr>

    <tr class="sub"><th colspan="2">ความเห็นและการลงนามรับทราบ</th></tr>
    <tr><td colspan="2">
      ${dots(2)}
      <div class="sigs">${signature("ผู้จัดการ")}${signature("ประธานกรรมการ / ผู้ได้รับมอบหมาย")}</div>
    </td></tr>
  </table>
  <div class="footer"><span>เลขที่รับ ${esc(c.trackingCode)} · หน้า 2/2</span><span>${ORG_NAME}</span></div>
</div>

<script>
  // รอโลโก้และฟอนต์โหลดเสร็จก่อนสั่งพิมพ์ ไม่อย่างนั้นหน้าพิมพ์จะไม่มีตราสหกรณ์
  window.addEventListener("load", function () {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(function () { window.print(); }, 150); });
  });
</script>
</body></html>`);
  win.document.close();
}
