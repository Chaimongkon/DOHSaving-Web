import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { ensureSiteEventsTable } from "@/lib/siteEvents";
import { FORM_GROUP_LABELS, SEARCH_PAGES } from "@/lib/siteEventTypes";
import { createSmartSearch } from "@/lib/smartSearch";
import { decodeEntities } from "@/lib/decodeEntities";

const DAY = 24 * 60 * 60 * 1000;
const PERIODS = [7, 30, 90, 365];

// GET /api/admin/search-insights?days=7|30|90|365
// แบบฟอร์มที่ถูกเปิด/ดาวน์โหลด · หมวดที่เปิด · คำค้นที่ไม่พบผลลัพธ์
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    await ensureSiteEventsTable();
    const raw = Number(new URL(req.url).searchParams.get("days"));
    const days = PERIODS.includes(raw) ? raw : 30;
    const now = Date.now();
    const start = new Date(now - days * DAY);
    const prevStart = new Date(now - 2 * days * DAY);

    const [formRows, groupRows, missRows, totalRows, firstRow, forms] = await Promise.all([
      prisma.$queryRaw<{ target: string; downloads: bigint; views: bigint }[]>`
        SELECT target, SUM(meta = 'download') downloads, SUM(meta = 'view') views
        FROM site_events WHERE type = 'form_download' AND createdAt >= ${start}
        GROUP BY target`,
      prisma.$queryRaw<{ target: string; c: bigint; prev: bigint }[]>`
        SELECT target, SUM(createdAt >= ${start}) c, SUM(createdAt < ${start}) prev
        FROM site_events WHERE type = 'form_group' AND createdAt >= ${prevStart}
        GROUP BY target`,
      prisma.$queryRaw<{ target: string; meta: string | null; c: bigint; last: Date }[]>`
        SELECT target, meta, COUNT(*) c, MAX(createdAt) last
        FROM site_events WHERE type = 'search_miss' AND createdAt >= ${start}
        GROUP BY target, meta ORDER BY c DESC, last DESC LIMIT 300`,
      prisma.$queryRaw<{ type: string; cur: bigint; prev: bigint }[]>`
        SELECT type, SUM(createdAt >= ${start}) cur, SUM(createdAt < ${start}) prev
        FROM site_events WHERE createdAt >= ${prevStart}
        GROUP BY type`,
      prisma.$queryRaw<{ first: Date | null }[]>`SELECT MIN(createdAt) first FROM site_events`,
      prisma.form.findMany({
        where: { isActive: true },
        select: { id: true, title: true, category: true, group: true, fileUrl: true },
      }),
    ]);

    const formById = new Map(forms.map((f) => [String(f.id), f]));
    const used = new Set<string>();
    const topForms = formRows
      .map((r) => {
        const form = formById.get(r.target);
        used.add(r.target);
        return {
          id: Number(r.target),
          title: form?.title ?? `แบบฟอร์ม #${r.target} (ถูกลบแล้ว)`,
          category: form?.category ?? null,
          group: form?.group ?? null,
          removed: !form,
          downloads: Number(r.downloads ?? 0),
          views: Number(r.views ?? 0),
        };
      })
      .sort((a, b) => b.downloads + b.views - (a.downloads + a.views));

    // แบบฟอร์มที่เปิดใช้อยู่แต่ไม่มีใครเปิดในช่วงนี้ — ชื่ออาจหายาก หรือเลิกใช้แล้ว
    const unused = forms
      .filter((f) => f.fileUrl && !used.has(String(f.id)))
      .map((f) => ({ id: f.id, title: f.title, category: f.category, group: f.group }))
      .sort((a, b) => a.group.localeCompare(b.group, "th") || a.title.localeCompare(b.title, "th"));

    const groups = Object.entries(FORM_GROUP_LABELS)
      .map(([key, label]) => {
        const row = groupRows.find((r) => r.target === key);
        return { key, label, views: Number(row?.c ?? 0), prev: Number(row?.prev ?? 0) };
      })
      .sort((a, b) => b.views - a.views);

    // คำที่เคยหาไม่เจอ (หน้าแบบฟอร์ม/ถาม-ตอบ) — ลองค้นด้วยระบบค้นหาปัจจุบัน ว่าตอนนี้เจอแล้วหรือยัง
    // (กระทู้ที่ตั้งหลังจากค้นไม่เจอ ก็นับว่าเจอแล้ว)
    const searchForms = createSmartSearch(forms, (f) => `${f.title} ${f.group} ${f.category}`);
    const qnaRows = missRows.some((r) => r.meta === "qna")
      ? await prisma.qnaQuestion.findMany({
          where: { isActive: true },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          select: { title: true, body: true, replies: { where: { isActive: true, isAdmin: true }, select: { body: true } } },
        })
      : [];
    const searchQna = createSmartSearch(qnaRows, (q) => [q.title, q.body, ...q.replies.map((r) => r.body)].map(decodeEntities).join(" "));
    const misses = missRows.map((r) => {
      const page = r.meta ?? "";
      const found = page === "forms" ? searchForms(r.target) : page === "qna" ? searchQna(r.target) : null;
      return {
        term: r.target,
        page,
        pageLabel: SEARCH_PAGES[page]?.label ?? (page || "-"),
        count: Number(r.c),
        last: new Date(r.last).toISOString(),
        nowFound: found && found.items.length
          ? { count: found.items.length, exact: found.exact, titles: [...new Set(found.items.map((f) => f.title))].slice(0, 2) }
          : null,
      };
    });

    const total = (type: string) => {
      const row = totalRows.find((r) => r.type === type);
      return { cur: Number(row?.cur ?? 0), prev: Number(row?.prev ?? 0) };
    };

    const first = firstRow[0]?.first ? new Date(firstRow[0].first) : null;

    return NextResponse.json({
      days,
      trackingSince: first?.toISOString() ?? null,
      // เก็บข้อมูลยังไม่ครบช่วงที่เลือก → ตัวเลขยังน้อย และ "ไม่มีใครเปิด" ยังสรุปไม่ได้
      partial: !first || first > start,
      totals: {
        formEvents: total("form_download"),
        downloads: topForms.reduce((n, f) => n + f.downloads, 0),
        views: topForms.reduce((n, f) => n + f.views, 0),
        groupViews: total("form_group"),
        misses: total("search_miss"),
        missTerms: new Set(misses.map((m) => m.term)).size,
        missesNowFound: misses.filter((m) => m.nowFound).length,
      },
      topForms,
      unused,
      groups,
      misses,
    });
  } catch (error) {
    console.error("Failed to fetch search insights:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// DELETE /api/admin/search-insights { term, page } — ล้างคำค้นที่จัดการแล้ว (เช่น เพิ่มแบบฟอร์ม/แก้ชื่อแล้ว)
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json().catch(() => ({}));
    const term = typeof body.term === "string" ? body.term : "";
    const page = typeof body.page === "string" ? body.page : "";
    if (!term) return NextResponse.json({ error: "term required" }, { status: 400 });

    await ensureSiteEventsTable();
    const removed = await prisma.$executeRaw`
      DELETE FROM site_events WHERE type = 'search_miss' AND target = ${term} AND meta = ${page}`;
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    console.error("Failed to clear search term:", error);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
