import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { MOURNING_KEY, isMourningLive, parseMourning } from "@/lib/mourningMode";
import { TABLE_LABELS } from "@/lib/auditLabels";

/* ── เวลาไทย (UTC+7) — นับ "วันนี้/เดือนนี้" ตามปฏิทินไทย ไม่ขึ้นกับเขตเวลาของเซิร์ฟเวอร์ ── */
const TH_OFFSET = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const thaiParts = (date: Date) => {
  const t = new Date(date.getTime() + TH_OFFSET);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
};
/** เวลาจริง (UTC) ของเที่ยงคืนตามเวลาไทย */
const thaiMidnight = (y: number, m: number, d = 1) => new Date(Date.UTC(y, m, d) - TH_OFFSET);
const dayKey = (date: Date) => new Date(date.getTime() + TH_OFFSET).toISOString().slice(0, 10);

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];


type TaskLevel = "urgent" | "warning" | "info" | "ok";
interface Task {
  key: string;
  level: TaskLevel;
  title: string;
  detail: string;
  href: string;
}

// GET /api/admin/dashboard — ภาพรวมสำหรับหน้าแรกของระบบจัดการ (แสดงเฉพาะส่วนที่ผู้ใช้มีสิทธิ์)
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  const isAdmin = user.userRole === "admin";
  const can = (menu: string) => isAdmin || user.menuPermissions.includes(menu);

  try {
    const now = new Date();
    const { y, m, d } = thaiParts(now);
    const startToday = thaiMidnight(y, m, d);
    const startYesterday = new Date(startToday.getTime() - DAY);
    const startMonth = thaiMidnight(y, m);
    const startLastMonth = thaiMidnight(y, m - 1);
    // ช่วงเดียวกันของเดือนก่อน (เทียบแบบยุติธรรม: วันที่ 1 ถึงวันเดียวกัน ณ เวลาเดียวกัน)
    const lastMonthSamePoint = new Date(
      Math.min(startLastMonth.getTime() + (now.getTime() - startMonth.getTime()), startMonth.getTime())
    );
    const startYear = thaiMidnight(y, 0);
    const start30 = new Date(startToday.getTime() - 29 * DAY);

    /* ═════════ ผู้เข้าชม ═════════ */
    const [
      total,
      today,
      yesterday,
      thisMonth,
      lastMonthSoFar,
      thisYear,
      firstVisit,
      dailyRaw,
      deviceRaw,
      topPagesRaw,
      translationRows,
    ] = await Promise.all([
      prisma.visitLog.count(),
      prisma.visitLog.count({ where: { visitDate: { gte: startToday } } }),
      prisma.visitLog.count({ where: { visitDate: { gte: startYesterday, lt: startToday } } }),
      prisma.visitLog.count({ where: { visitDate: { gte: startMonth } } }),
      prisma.visitLog.count({ where: { visitDate: { gte: startLastMonth, lt: lastMonthSamePoint } } }),
      prisma.visitLog.count({ where: { visitDate: { gte: startYear } } }),
      prisma.visitLog.findFirst({ orderBy: { id: "asc" }, select: { visitDate: true } }),
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT DATE_FORMAT(DATE_ADD(visitDate, INTERVAL 7 HOUR), '%Y-%m-%d') AS day, COUNT(*) AS count
        FROM visit_logs
        WHERE visitDate >= ${start30}
        GROUP BY day
      `,
      prisma.$queryRaw<{ mobile: bigint | null; total: bigint }[]>`
        SELECT SUM(userAgent REGEXP 'Mobile|Android|iPhone|iPad') AS mobile, COUNT(*) AS total
        FROM visit_logs
        WHERE visitDate >= ${start30}
      `,
      prisma.$queryRaw<{ pageUrl: string | null; count: bigint }[]>`
        SELECT pageUrl, COUNT(*) AS count
        FROM visit_logs
        WHERE visitDate >= ${startMonth}
        GROUP BY pageUrl
        ORDER BY count DESC
        LIMIT 6
      `,
      prisma.siteSetting.findMany({
        where: { key: { startsWith: "url_translation:" } },
        select: { key: true, value: true },
      }),
    ]);

    const dailyMap = new Map(dailyRaw.map((r) => [String(r.day).slice(0, 10), Number(r.count)]));
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = dayKey(new Date(start30.getTime() + i * DAY));
      return { date, count: dailyMap.get(date) ?? 0 };
    });

    const translations: Record<string, string> = {};
    for (const row of translationRows) {
      const url = row.key.replace("url_translation:", "");
      translations[url] = row.value || url;
    }

    const deviceTotal = Number(deviceRaw[0]?.total ?? 0);
    const deviceMobile = Number(deviceRaw[0]?.mobile ?? 0);

    /* ═════════ งานที่ต้องดูแล (เฉพาะเมนูที่มีสิทธิ์) ═════════ */
    const tasks: Task[] = [];
    /** ผ่านมากี่วัน (นับตามวันในปฏิทินไทย) */
    const daysAgo = (date: Date) => {
      const p = thaiParts(date);
      return Math.round((startToday.getTime() - thaiMidnight(p.y, p.m, p.d).getTime()) / DAY);
    };

    if (can("/admin/complaints")) {
      const [pending, reviewing] = await Promise.all([
        prisma.complaint.count({ where: { status: "pending" } }),
        prisma.complaint.count({ where: { status: "reviewing" } }),
      ]);
      tasks.push(
        pending + reviewing > 0
          ? {
              key: "complaints",
              level: pending > 0 ? "urgent" : "warning",
              title: `เรื่องร้องเรียนรอดำเนินการ ${pending + reviewing} เรื่อง`,
              detail: `รอรับเรื่อง ${pending} · กำลังตรวจสอบ ${reviewing}`,
              href: "/admin/complaints",
            }
          : { key: "complaints", level: "ok", title: "เรื่องร้องเรียน", detail: "ไม่มีเรื่องค้างดำเนินการ", href: "/admin/complaints" }
      );
    }

    if (can("/admin/qna")) {
      // นับแบบเดียวกับแท็บ "รอตอบ" ในหน้า admin ถาม-ตอบ: ข้อความล่าสุดของกระทู้มาจากสมาชิก
      // (รวมกรณีสมาชิกถามต่อหลังเจ้าหน้าที่ตอบไปแล้ว)
      const open = await prisma.qnaQuestion.findMany({
        where: { isActive: true, isClosed: false },
        select: {
          createdAt: true,
          replies: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 1, select: { isAdmin: true, createdAt: true } },
        },
      });
      const waitingSince = open
        .filter((q) => !q.replies[0] || !q.replies[0].isAdmin)
        .map((q) => q.replies[0]?.createdAt ?? q.createdAt)
        .sort((a, b) => a.getTime() - b.getTime());
      tasks.push(
        waitingSince.length > 0
          ? {
              key: "qna",
              level: "warning",
              title: `คำถามรอเจ้าหน้าที่ตอบ ${waitingSince.length} กระทู้`,
              detail: `รอนานสุด ${daysAgo(waitingSince[0])} วัน`,
              href: "/admin/qna",
            }
          : { key: "qna", level: "ok", title: "กระดานถาม-ตอบ", detail: "ตอบครบทุกคำถามแล้ว", href: "/admin/qna" }
      );
    }

    if (can("/admin/financial-summary")) {
      // รายการย่อของเดือนก่อนควรเผยแพร่แล้ว (ปี พ.ศ.)
      const expectY = (m === 0 ? y - 1 : y) + 543;
      const expectM = m === 0 ? 12 : m;
      const latest = await prisma.financialSummary.findFirst({
        where: { isActive: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: { year: true, month: true },
      });
      const upToDate = latest && (latest.year > expectY || (latest.year === expectY && latest.month >= expectM));
      tasks.push(
        upToDate
          ? {
              key: "financial",
              level: "ok",
              title: "รายการย่อแสดงสินทรัพย์และหนี้สิน",
              detail: `เป็นปัจจุบัน (ล่าสุด ${MONTHS_TH[latest!.month - 1]} ${latest!.year})`,
              href: "/admin/financial-summary",
            }
          : {
              key: "financial",
              level: "warning",
              title: `ยังไม่ลงรายการย่อเดือน${MONTHS_TH[expectM - 1]} ${expectY}`,
              detail: latest ? `ฉบับล่าสุดคือ ${MONTHS_TH[latest.month - 1]} ${latest.year}` : "ยังไม่มีข้อมูล",
              href: "/admin/financial-summary",
            }
      );
    }

    if (can("/admin/notifications")) {
      const popups = await prisma.notification.findMany({
        where: { isActive: true },
        select: { endDate: true },
      });
      const expired = popups.filter((p) => p.endDate && p.endDate.getTime() < startToday.getTime()).length;
      if (expired > 0) {
        tasks.push({
          key: "popups-expired",
          level: "warning",
          title: `ป๊อปอัพหมดอายุแต่ยังเปิดอยู่ ${expired} รายการ`,
          detail: "ควรปิดหรือขยายวันสิ้นสุด",
          href: "/admin/notifications",
        });
      } else if (popups.length > 0) {
        tasks.push({
          key: "popups",
          level: "info",
          title: `ป๊อปอัพที่แสดงอยู่ ${popups.length} รายการ`,
          detail: "สมาชิกเห็นเมื่อเข้าหน้าแรก",
          href: "/admin/notifications",
        });
      }
    }

    if (can("/admin/news")) {
      const latestNews = await prisma.news.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      const age = latestNews ? daysAgo(latestNews.createdAt) : null;
      tasks.push(
        age === null || age > 30
          ? {
              key: "news",
              level: "info",
              title: age === null ? "ยังไม่มีข่าวประชาสัมพันธ์" : `ไม่มีข่าวใหม่มา ${age} วัน`,
              detail: "ข่าวใหม่ช่วยให้สมาชิกกลับมาเยี่ยมชม",
              href: "/admin/news",
            }
          : {
              key: "news",
              level: "ok",
              title: "ข่าวประชาสัมพันธ์",
              detail: age === 0 ? "ลงข่าวล่าสุดวันนี้" : `ลงข่าวล่าสุดเมื่อ ${age} วันก่อน`,
              href: "/admin/news",
            }
      );
    }

    if (can("/admin/mourning")) {
      const row = await prisma.siteSetting.findUnique({ where: { key: MOURNING_KEY }, select: { value: true } });
      const mourning = parseMourning(row?.value);
      if (isMourningLive(mourning)) {
        tasks.push({
          key: "mourning",
          level: "info",
          title: "โหมดไว้อาลัยเปิดอยู่",
          detail: mourning.endsAt
            ? `หน้าเว็บแสดงเป็นโทนขาวดำ · ปิดอัตโนมัติ ${new Date(mourning.endsAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" })}`
            : "หน้าเว็บแสดงเป็นโทนขาวดำ · ยังไม่ได้กำหนดวันปิด",
          href: "/admin/mourning",
        });
      }
    }

    const levelRank: Record<TaskLevel, number> = { urgent: 0, warning: 1, info: 2, ok: 3 };
    tasks.sort((a, b) => levelRank[a.level] - levelRank[b.level]);

    /* ═════════ ความเคลื่อนไหวล่าสุด (ผู้ดูแลระบบเท่านั้น) ═════════ */
    let activity: { id: number; action: string; section: string; at: string; by: string; count: number }[] | null =
      null;
    if (isAdmin) {
      const logs = await prisma.auditLog.findMany({
        where: { tableName: { notIn: ["auth_sessions", "uploads"] } },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          action: true,
          tableName: true,
          createdAt: true,
          user: { select: { fullName: true, userName: true } },
        },
      });
      activity = [];
      for (const log of logs) {
        const by = log.user?.fullName || log.user?.userName || "ระบบ";
        const section = TABLE_LABELS[log.tableName] ?? log.tableName;
        const prev = activity[activity.length - 1];
        if (prev && prev.by === by && prev.action === log.action && prev.section === section) {
          prev.count += 1;
          continue;
        }
        if (activity.length === 8) break;
        activity.push({ id: log.id, action: log.action, section, at: log.createdAt.toISOString(), by, count: 1 });
      }
    }

    /* ═════════ ข่าวยอดนิยม ═════════ */
    const topNews = can("/admin/news")
      ? await prisma.news.findMany({
          where: { isActive: true },
          orderBy: { viewCount: "desc" },
          take: 5,
          select: { id: true, title: true, viewCount: true, createdAt: true },
        })
      : null;

    return NextResponse.json({
      user: { fullName: user.fullName, role: user.userRole },
      permissions: isAdmin ? "all" : user.menuPermissions,
      visitors: {
        today,
        yesterday,
        thisMonth,
        lastMonthSoFar,
        thisYear,
        total,
        since: firstVisit?.visitDate.toISOString() ?? null,
        daily,
        mobileShare: deviceTotal > 0 ? deviceMobile / deviceTotal : null,
        topPages: topPagesRaw.map((p) => ({ pageUrl: p.pageUrl ?? "/", count: Number(p.count) })),
        translations,
      },
      tasks,
      activity,
      topNews: topNews?.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })) ?? null,
    });
  } catch (error) {
    console.error("Failed to build admin dashboard:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
