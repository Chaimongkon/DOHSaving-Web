import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // สร้าง Admin User
  const hashedPassword = await bcrypt.hash("admin1234", 12);

  const admin = await prisma.user.upsert({
    where: { userName: "admin" },
    update: {},
    create: {
      fullName: "ผู้ดูแลระบบ",
      userName: "admin",
      password: hashedPassword,
      userRole: "admin",
      isActive: true,
      department: "IT",
    },
  });

  console.log("✅ Admin user ensured:", admin.userName);

  // สร้างค่า Default URL Mappings
  const defaultMappings: Record<string, string> = {
    "/": "หน้าหลัก (Home)",
    "/about": "เกี่ยวกับเรา (About)",
    "/services": "บริการ (Services)",
    "/services/general-loan": "บริการ (Services) - เงินกู้สหกรณ์ฯ",
    "/services/welfare-a": "บริการ (Services) - สวัสดิการแบบ ก.",
    "/services/welfare-b": "บริการ (Services) - สวัสดิการแบบ ข.",
    "/services/member-associate": "บริการ (Services) - สมาชิกสมทบ",
    "/news": "ข่าวสาร (News)",
    "/forms": "ดาวน์โหลดแบบฟอร์ม",
    "/documents": "เอกสารดาวน์โหลด (Documents)",
    "/contact": "ติดต่อเรา (Contact)",
    "/interest-rates": "อัตราดอกเบี้ย (Interest Rates)",
    "/qna": "ถาม-ตอบ (Q&A)",
    "/download-app": "ดาวน์โหลดแอป (Download App)",
  };

  let mappedCount = 0;
  for (const [url, thName] of Object.entries(defaultMappings)) {
    const key = `url_translation:${url}`;
    await prisma.siteSetting.upsert({
      where: { key },
      update: {}, // Don't overwrite existing user changes on subsequent seeds
      create: {
        key,
        value: thName,
        remark: `คำแปลชื่อหน้าของ URL: ${url}`,
      },
    });
    mappedCount++;
  }
  console.log(`✅ Seeded ${mappedCount} URL translations`);
  console.log("   Username: admin");
  console.log("   Password: admin1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
