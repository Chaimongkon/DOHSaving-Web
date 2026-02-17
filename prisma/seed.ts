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

  console.log("✅ Admin user created:", admin.userName);
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
