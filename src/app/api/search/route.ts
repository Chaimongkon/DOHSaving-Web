import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createSmartSearch } from "@/lib/smartSearch";
import { decodeEntities } from "@/lib/decodeEntities";
import { maskPlain } from "@/lib/qnaPrivacy";
import { groupForms } from "@/lib/formGroups";
import { SEARCH_MAX_LENGTH } from "@/lib/siteEventTypes";

// GET /api/search?q= — public: ค้นจากหน้าหลักครั้งเดียว ได้ทั้งแบบฟอร์ม กระทู้ถาม-ตอบ และข่าว
// ใช้ระบบค้นหาเดียวกับหน้าแบบฟอร์ม/ถาม-ตอบ (ยอมคำผิด คำความหมายเดียวกัน ประโยคยาว)
export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, SEARCH_MAX_LENGTH);
  if (q.length < 2) return Response.json({ forms: [], qna: [], news: [], total: 0 });

  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [forms, questions, news, downloads] = await Promise.all([
      prisma.form.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, title: true, group: true, category: true, fileUrl: true },
      }),
      prisma.qnaQuestion.findMany({
        where: { isActive: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          body: true,
          replies: { where: { isActive: true, isAdmin: true }, select: { body: true } },
        },
      }),
      prisma.news.findMany({
        where: { isActive: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, category: true, createdAt: true },
      }),
      prisma.$queryRaw<{ target: string; c: bigint }[]>`
        SELECT target, COUNT(*) c FROM site_events
        WHERE type = 'form_download' AND createdAt >= ${since}
        GROUP BY target`.catch(() => []),
    ]);

    // แบบฟอร์ม: ค้นทีละฉบับ แล้วรวมชื่อเดียวกัน (ปุ่มดาวน์โหลดแยกประเภทสมาชิก)
    const formHits = createSmartSearch(forms, (f) => `${f.title} ${f.group} ${f.category}`)(q).items;
    const hitTitles = new Set(formHits.map((f) => f.title));
    const formGroups = groupForms(forms.filter((f) => hitTitles.has(f.title)));
    // เรียงตามความเกี่ยวข้อง แล้วตามยอดดาวน์โหลด 90 วัน (ฉบับที่สมาชิกใช้บ่อยขึ้นก่อน)
    const order = [...new Set(formHits.map((f) => f.title.normalize("NFC").replace(/\s+/g, " ").trim()))];
    const counts = new Map(downloads.map((r) => [Number(r.target), Number(r.c)]));
    const used = (g: (typeof formGroups)[number]) => g.variants.reduce((n, v) => n + (counts.get(v.id) ?? 0), 0);
    formGroups.sort((a, b) => used(b) - used(a) || order.indexOf(a.title) - order.indexOf(b.title));

    const qnaHits = createSmartSearch(questions, (x) => [x.title, x.body, ...x.replies.map((r) => r.body)].map(decodeEntities).join(" "))(q).items;
    const newsHits = createSmartSearch(news.filter((n) => n.title), (n) => n.title ?? "")(q).items;

    return Response.json(
      {
        forms: formGroups.slice(0, 4),
        formsTotal: formGroups.length,
        qna: qnaHits.slice(0, 3).map((x) => ({ id: x.id, title: maskPlain(decodeEntities(x.title)), answered: x.replies.length > 0 })),
        qnaTotal: qnaHits.length,
        news: newsHits.slice(0, 3).map((n) => ({ id: n.id, title: decodeEntities(n.title ?? ""), createdAt: n.createdAt.toISOString() })),
        newsTotal: newsHits.length,
        total: formGroups.length + qnaHits.length + newsHits.length,
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Home search failed:", error);
    return Response.json({ error: "ค้นหาไม่สำเร็จ" }, { status: 500 });
  }
}
