import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { SECTION_LABELS, isKnownSection, resolvePageNames, sectionOf } from "@/lib/pageNames";

/* ── ช่วงเวลา (ตามปฏิทินไทย UTC+7) ── */
const TH = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const thaiMidnight = (y: number, m: number, d = 1) => new Date(Date.UTC(y, m, d) - TH);
const dayKey = (d: Date) => new Date(d.getTime() + TH).toISOString().slice(0, 10);

type Period = "7d" | "30d" | "90d" | "month" | "lastmonth";
const PERIODS: Period[] = ["7d", "30d", "90d", "month", "lastmonth"];

function rangeOf(period: Period, now = new Date()) {
  const t = new Date(now.getTime() + TH);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const tomorrow = thaiMidnight(y, m, t.getUTCDate() + 1);
  let start: Date;
  let end: Date = now;
  switch (period) {
    case "7d":
      start = new Date(tomorrow.getTime() - 7 * DAY);
      break;
    case "30d":
      start = new Date(tomorrow.getTime() - 30 * DAY);
      break;
    case "90d":
      start = new Date(tomorrow.getTime() - 90 * DAY);
      break;
    case "lastmonth":
      start = thaiMidnight(y, m - 1);
      end = thaiMidnight(y, m);
      break;
    default:
      start = thaiMidnight(y, m);
  }
  // ช่วงก่อนหน้าที่ยาวเท่ากัน (เดือนนี้ → ช่วงเดียวกันของเดือนก่อน เพื่อเทียบอย่างยุติธรรม)
  const span = end.getTime() - start.getTime();
  const prevStart = period === "month" || period === "lastmonth" ? thaiMidnight(y, m - (period === "month" ? 1 : 2)) : new Date(start.getTime() - span);
  const prevEnd = new Date(Math.min(prevStart.getTime() + span, start.getTime()));
  return { start, end, prevStart, prevEnd };
}

// GET /api/admin/page-analytics?period=7d|30d|90d|month|lastmonth
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const raw = new URL(req.url).searchParams.get("period") as Period;
    const period: Period = PERIODS.includes(raw) ? raw : "30d";
    const { start, end, prevStart, prevEnd } = rangeOf(period);

    const [pageRows, prevRows, dailyRows, heatRows, deviceRows] = await Promise.all([
      prisma.$queryRaw<{ pageUrl: string | null; c: bigint }[]>`
        SELECT pageUrl, COUNT(*) c FROM visit_logs
        WHERE visitDate >= ${start} AND visitDate < ${end}
        GROUP BY pageUrl ORDER BY c DESC LIMIT 400`,
      prisma.$queryRaw<{ pageUrl: string | null; c: bigint }[]>`
        SELECT pageUrl, COUNT(*) c FROM visit_logs
        WHERE visitDate >= ${prevStart} AND visitDate < ${prevEnd}
        GROUP BY pageUrl`,
      prisma.$queryRaw<{ d: string; c: bigint }[]>`
        SELECT DATE_FORMAT(DATE_ADD(visitDate, INTERVAL 7 HOUR), '%Y-%m-%d') d, COUNT(*) c FROM visit_logs
        WHERE visitDate >= ${start} AND visitDate < ${end}
        GROUP BY d`,
      // วันในสัปดาห์ (1=อาทิตย์ … 7=เสาร์) × ชั่วโมง ตามเวลาไทย
      prisma.$queryRaw<{ wd: number; h: number; c: bigint }[]>`
        SELECT DAYOFWEEK(DATE_ADD(visitDate, INTERVAL 7 HOUR)) wd, HOUR(DATE_ADD(visitDate, INTERVAL 7 HOUR)) h, COUNT(*) c
        FROM visit_logs WHERE visitDate >= ${start} AND visitDate < ${end}
        GROUP BY wd, h`,
      prisma.$queryRaw<{ mobile: bigint | null; total: bigint }[]>`
        SELECT SUM(userAgent REGEXP 'Mobile|Android|iPhone|iPad') mobile, COUNT(*) total FROM visit_logs
        WHERE visitDate >= ${start} AND visitDate < ${end}`,
    ]);

    const norm = (u: string | null) => (u || "/").split("?")[0] || "/";
    const prevMap = new Map<string, number>();
    for (const r of prevRows) prevMap.set(norm(r.pageUrl), (prevMap.get(norm(r.pageUrl)) ?? 0) + Number(r.c));

    const views = new Map<string, number>();
    for (const r of pageRows) views.set(norm(r.pageUrl), (views.get(norm(r.pageUrl)) ?? 0) + Number(r.c));

    const total = dailyRows.reduce((n, r) => n + Number(r.c), 0);
    const prevTotal = [...prevMap.values()].reduce((a, b) => a + b, 0);
    const names = await resolvePageNames([...views.keys()]);

    const pages = [...views.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([url, v]) => ({
        url,
        name: names[url] ?? url,
        section: sectionOf(url),
        views: v,
        prev: prevMap.get(url) ?? 0,
        broken: !isKnownSection(url),
      }));

    /* ── หมวด ── */
    const sectionMap = new Map<string, { views: number; prev: number }>();
    for (const p of pages) {
      if (p.broken) continue;
      const s = sectionMap.get(p.section) ?? { views: 0, prev: 0 };
      s.views += p.views;
      sectionMap.set(p.section, s);
    }
    for (const [url, v] of prevMap) {
      const sec = sectionOf(url);
      if (!isKnownSection(url)) continue;
      const s = sectionMap.get(sec) ?? { views: 0, prev: 0 };
      s.prev += v;
      sectionMap.set(sec, s);
    }
    const sections = [...sectionMap.entries()]
      .filter(([, v]) => v.views > 0)
      .sort((a, b) => b[1].views - a[1].views)
      .map(([key, v]) => ({ key, label: SECTION_LABELS[key] ?? `/${key}`, ...v }));

    /* ── รายวัน (เติมวันที่ไม่มีข้อมูลเป็น 0) ── */
    const dailyMap = new Map(dailyRows.map((r) => [String(r.d).slice(0, 10), Number(r.c)]));
    const daily: { date: string; views: number }[] = [];
    for (let t = start.getTime(); t < end.getTime(); t += DAY) {
      const k = dayKey(new Date(t));
      daily.push({ date: k, views: dailyMap.get(k) ?? 0 });
    }
    const peak = daily.reduce((a, b) => (b.views > a.views ? b : a), { date: "", views: 0 });

    /* ── ช่วงเวลาที่คนเข้า ── */
    const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const r of heatRows) heatmap[Number(r.wd) - 1][Number(r.h)] = Number(r.c);

    const mobile = Number(deviceRows[0]?.mobile ?? 0);
    const deviceTotal = Number(deviceRows[0]?.total ?? 0);

    return NextResponse.json({
      period,
      range: { start: start.toISOString(), end: end.toISOString(), prevStart: prevStart.toISOString(), prevEnd: prevEnd.toISOString() },
      totals: {
        views: total,
        prevViews: prevTotal,
        perDay: daily.length ? total / daily.length : 0,
        peak,
        mobileShare: deviceTotal ? mobile / deviceTotal : null,
        pagesVisited: pages.filter((p) => !p.broken).length,
      },
      daily,
      heatmap,
      sections,
      pages,
    });
  } catch (error) {
    console.error("Failed to fetch page analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
}
