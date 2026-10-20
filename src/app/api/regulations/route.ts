import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getUploadFileSize } from "@/lib/uploadFileSize";

const DAY_MS = 24 * 60 * 60 * 1000;
const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;
/** เลขวันของวันที่โพสต์ตามเวลาไทย — ใช้เทียบว่าโพสต์วันเดียวกันหรือไม่ */
const postDay = (date: Date) => Math.floor((date.getTime() + THAI_OFFSET_MS) / DAY_MS);

// GET /api/regulations?type=statute — fetch active regulations by type (ไม่ระบุ type = ทุกประเภท)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.typeForm = type;

    const rows = await prisma.regulation.findMany({
      where,
      select: {
        id: true,
        title: true,
        typeForm: true,
        typeMember: true,
        filePath: true,
        imagePath: true,
        description: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    // โพสต์ใหม่สุดอยู่บน: เรียงตามวันที่โพสต์ (ใหม่ → เก่า)
    // รายการที่โพสต์วันเดียวกันเรียงตาม "ลำดับการแสดงผล" ที่แอดมินตั้ง — ชุดที่ลงพร้อมกันจึงยังอยู่ในลำดับเดิม
    rows.sort(
      (a, b) =>
        (a.typeMember ?? "").localeCompare(b.typeMember ?? "", "th") ||
        postDay(b.createdAt) - postDay(a.createdAt) ||
        a.sortOrder - b.sortOrder ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );

    const withSize = await Promise.all(
      rows.map(async (row) => {
        // createdAt ใช้แค่จัดลำดับ ไม่ส่งออก
        const item: Partial<typeof row> = { ...row };
        delete item.createdAt;
        return { ...item, fileSize: await getUploadFileSize(row.filePath) };
      })
    );
    return Response.json(withSize);
  } catch (error) {
    console.error("Failed to fetch regulations:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
