import prisma from "@/lib/prisma";

// GET /api/festival/active — ดึง theme ที่ active และอยู่ในช่วงวันที่ปัจจุบัน
export async function GET() {
  try {
    // ใช้ start-of-day UTC สำหรับเทียบ
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

    const theme = await prisma.festivalTheme.findFirst({
      where: {
        isActive: true,
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!theme) {
      return Response.json(null);
    }

    return Response.json(theme);
  } catch (error) {
    console.error("Failed to fetch active festival theme:", error);
    return Response.json(null);
  }
}
