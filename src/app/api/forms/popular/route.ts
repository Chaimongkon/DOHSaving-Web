import prisma from "@/lib/prisma";
import { groupForms } from "@/lib/formGroups";

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
const LIMIT = 6;

// GET /api/forms/popular — public: แบบฟอร์มที่ถูกเปิด/ดาวน์โหลดมากที่สุด 90 วันล่าสุด (รวมทุกประเภทสมาชิกของชื่อเดียวกัน)
export async function GET() {
  try {
    const since = new Date(Date.now() - WINDOW_DAYS * DAY);
    const [rows, forms] = await Promise.all([
      prisma.$queryRaw<{ target: string; c: bigint }[]>`
        SELECT target, COUNT(*) c FROM site_events
        WHERE type = 'form_download' AND createdAt >= ${since}
        GROUP BY target`.catch(() => []),
      prisma.form.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, title: true, group: true, category: true, fileUrl: true },
      }),
    ]);

    const counts = new Map(rows.map((r) => [Number(r.target), Number(r.c)]));
    const items = groupForms(forms)
      .map((g) => ({ ...g, count: g.variants.reduce((n, v) => n + (counts.get(v.id) ?? 0), 0) }))
      // ข้าม "แบบฟอร์มอื่นๆ" — ชื่อไม่บอกว่าใช้ทำอะไร
      .filter((g) => g.count > 0 && !/^(แบบฟอร์ม)?อื่น\s*ๆ?$/.test(g.title.replace(/\s/g, "")))
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMIT);

    return Response.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (error) {
    console.error("Failed to fetch popular forms:", error);
    return Response.json({ items: [] }, { status: 500 });
  }
}
