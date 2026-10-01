/**
 * แก้ค่า contact_info ที่ผิด และเพิ่มฟิลด์เวลาทำการแบบมีโครงสร้าง
 * รันครั้งเดียว: npx tsx scripts/fix-contact-info.ts
 * พิมพ์ค่าเดิมออกมาก่อนเสมอ เผื่อต้องย้อนกลับ
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });

const UPDATES: Record<string, string> = {
  // fax2 ถูกแก้ทับจนเป็นเบอร์เดียวกับ fax1 — คืนค่าตามที่หน้า /contact/map ระบุไว้
  fax2: "02-644-4825",
  // เวลาทำการแบบมีโครงสร้าง ให้ทั้งข้อความที่แสดงและ logic เปิด/ปิด อ่านจากที่เดียวกัน
  openTime: "08:30",
  closeTime: "16:30",
  financeCloseTime: "15:30",
};

async function main() {
  const keys = Object.keys(UPDATES);

  const before = await prisma.contactInfo.findMany({ where: { key: { in: keys } }, orderBy: { key: "asc" } });
  console.log("── ค่าเดิมก่อนแก้ ──");
  if (before.length === 0) console.log("  (ยังไม่มีคีย์เหล่านี้ในฐานข้อมูล)");
  for (const row of before) console.log(`  ${row.key} = ${JSON.stringify(row.value)}`);

  for (const [key, value] of Object.entries(UPDATES)) {
    await prisma.contactInfo.upsert({
      where: { key },
      update: { value, updatedBy: "fix-contact-info" },
      create: { key, value, updatedBy: "fix-contact-info" },
    });
  }

  const after = await prisma.contactInfo.findMany({ where: { key: { in: keys } }, orderBy: { key: "asc" } });
  console.log("── ค่าใหม่หลังแก้ ──");
  for (const row of after) console.log(`  ${row.key} = ${JSON.stringify(row.value)}`);

  const phones = await prisma.contactInfo.findMany({
    where: { key: { in: ["mainPhone", "phone", "phoneSub1", "phoneSub2", "fax1", "fax2"] } },
    orderBy: { key: "asc" },
  });
  console.log("── เบอร์โทร/แฟกซ์ทั้งหมดในฐานข้อมูลตอนนี้ ──");
  for (const row of phones) console.log(`  ${row.key} = ${JSON.stringify(row.value)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
