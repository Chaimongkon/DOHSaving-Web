/**
 * ตั้งค่า "ขั้นตอนแบบข้อความ" ของหน้าบริการ
 *
 *   npx tsx scripts/service-steps-setup.ts          → ดูว่าจะเปลี่ยนอะไร (ไม่เขียนฐานข้อมูล)
 *   npx tsx scripts/service-steps-setup.ts --apply  → ทำจริง
 *
 * 1. เพิ่มคอลัมน์ service_pages.steps (TEXT NULL) ถ้ายังไม่มี — เท่ากับที่ `prisma db push` จะทำ
 * 2. ใส่ขั้นตอนของ /services/online-withdraw (ถอดจากรูป infographic) — เฉพาะเมื่อยังไม่มีขั้นตอน
 * 3. แก้ชื่อเอกสารที่ซ้ำกัน: formId 8 คือ "แบบฟอร์มถอนเงิน" แต่ถูกตั้งชื่อเป็น "บันทึกข้อความถอนเงิน"
 *
 * รันซ้ำได้ — ข้อที่ทำไปแล้วจะถูกข้าม
 */
import "dotenv/config";
import prisma from "../src/lib/prisma";
import { serializeSteps, type ServiceStep } from "../src/lib/serviceSteps";

const APPLY = process.argv.includes("--apply");
const SLUG = "online-withdraw";
const WITHDRAW_FORM_ID = 8;

async function main() {
  console.log(APPLY ? "== APPLY ==" : "== DRY RUN (ใส่ --apply เพื่อทำจริง) ==");

  // ── 1. คอลัมน์ ──
  const cols = await prisma.$queryRawUnsafe<{ Field: string }[]>("SHOW COLUMNS FROM service_pages LIKE 'steps'");
  if (cols.length) {
    console.log("✓ คอลัมน์ steps มีอยู่แล้ว");
  } else {
    console.log("+ เพิ่มคอลัมน์ service_pages.steps TEXT NULL");
    if (APPLY) await prisma.$executeRawUnsafe("ALTER TABLE service_pages ADD COLUMN steps TEXT NULL AFTER formGroup");
    else {
      console.log("  (dry run: หยุดตรงนี้ เพราะขั้นต่อไปต้องมีคอลัมน์ก่อน)");
      return;
    }
  }

  const page = await prisma.servicePage.findUnique({ where: { slug: SLUG } });
  if (!page) {
    console.log(`! ไม่พบหน้า ${SLUG} — ข้าม`);
    return;
  }

  let links: { label: string; url: string; formId?: number }[] = [];
  try {
    links = JSON.parse(page.downloadLinks || "[]");
  } catch {
    links = [];
  }

  // ── 3. ชื่อเอกสารซ้ำ ──
  const formIdx = links.findIndex((l) => l.formId === WITHDRAW_FORM_ID);
  let linksChanged = false;
  if (formIdx >= 0 && links[formIdx].label === "บันทึกข้อความถอนเงิน") {
    console.log(`+ เปลี่ยนชื่อเอกสาร #${formIdx + 1} (formId ${WITHDRAW_FORM_ID}) → "แบบฟอร์มถอนเงิน"`);
    links[formIdx] = { ...links[formIdx], label: "แบบฟอร์มถอนเงิน" };
    linksChanged = true;
  } else {
    console.log("✓ ชื่อเอกสารไม่ต้องแก้");
  }

  // ── 2. ขั้นตอน (ถอดข้อความจากรูป infographic) ──
  const steps: ServiceStep[] = [
    {
      title: "กรอกใบถอนเงิน",
      detail:
        "กรอกรายละเอียดให้ครบถ้วน\nหากไม่มีแบบฟอร์ม สามารถเขียนคำขอเป็นลายลักษณ์อักษรได้ หรือดาวน์โหลดแบบฟอร์มได้ที่ปุ่มด้านล่าง",
      ...(formIdx >= 0 ? { docIndex: formIdx } : {}),
    },
    { title: "แนบสำเนาบัตรประชาชน", detail: "ลงนามรับรองสำเนาถูกต้อง" },
    { title: "แนบสำเนาหน้าสมุดบัญชีเงินฝากสหกรณ์", detail: "ลงนามรับรองสำเนาถูกต้อง" },
    {
      title: "แนบสำเนาหน้าสมุดบัญชีธนาคารปลายทาง",
      detail: "เฉพาะธนาคารกรุงไทย และธนาคารไทยพาณิชย์\nลงนามรับรองสำเนาถูกต้อง",
    },
    {
      title: "ส่งเอกสารทาง LINE",
      detail: "LINE ID: dohcoop2\nLINE Official Account: @dohsaving",
      linkLabel: "เพิ่มเพื่อน LINE @dohsaving",
      linkUrl: "https://line.me/R/ti/p/@dohsaving",
    },
  ];

  const current = (page as unknown as { steps?: string | null }).steps;
  const setSteps = !current;
  console.log(setSteps ? `+ ใส่ขั้นตอน ${steps.length} ขั้น` : "✓ มีขั้นตอนอยู่แล้ว — ไม่เขียนทับ");

  if (!APPLY || (!setSteps && !linksChanged)) return;
  await prisma.servicePage.update({
    where: { id: page.id },
    data: {
      ...(linksChanged ? { downloadLinks: JSON.stringify(links) } : {}),
      ...(setSteps ? { steps: serializeSteps(steps) } : {}),
    },
  });
  console.log("✔ บันทึกแล้ว");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
