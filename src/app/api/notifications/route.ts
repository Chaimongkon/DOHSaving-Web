import { NextResponse } from "next/server";

// Mock data สำหรับ dev — ลบออกเมื่อต่อ DB จริง
const mockNotifications = [
  {
    id: 1,
    imagePath: "/images/promo/app-download.svg",
    urlLink: null,
  },
];

// GET /api/notifications — ดึง notification ที่ active สำหรับ popup dialog
export async function GET() {
  try {
    // เมื่อต่อ DB จริง ให้ uncomment ด้านล่างแล้วลบ mockNotifications
    // const { default: prisma } = await import("@/lib/prisma");
    // const notifications = await prisma.notification.findMany({
    //   where: { isActive: true },
    //   orderBy: { createdAt: "desc" },
    //   select: {
    //     id: true,
    //     imagePath: true,
    //     urlLink: true,
    //   },
    // });
    // return NextResponse.json(notifications);

    return NextResponse.json(mockNotifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json([], { status: 500 });
  }
}
