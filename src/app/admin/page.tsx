"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileDown,
  Flame,
  GalleryHorizontal,
  Globe2,
  History,
  Info,
  type LucideIcon,
  MessageSquareWarning,
  MessagesSquare,
  Monitor,
  Newspaper,
  Scale,
  ScrollText,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูลจาก /api/admin/dashboard ═════════ */
type TaskLevel = "urgent" | "warning" | "info" | "ok";
interface DashboardData {
  user: { fullName: string; role: string };
  permissions: "all" | string[];
  visitors: {
    today: number;
    yesterday: number;
    thisMonth: number;
    lastMonthSoFar: number;
    thisYear: number;
    total: number;
    since: string | null;
    daily: { date: string; count: number }[];
    mobileShare: number | null;
    topPages: { pageUrl: string; count: number }[];
    translations: Record<string, string>;
  };
  tasks: { key: string; level: TaskLevel; title: string; detail: string; href: string }[];
  activity: { id: number; action: string; section: string; at: string; by: string; count: number }[] | null;
  topNews: { id: number; title: string | null; viewCount: number; createdAt: string }[] | null;
}

/* ═════════ ทางลัด (แสดงเฉพาะเมนูที่มีสิทธิ์) ═════════ */
const SHORTCUTS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/news", label: "ข่าวประชาสัมพันธ์", icon: Newspaper },
  { href: "/admin/qna", label: "ตอบกระดานถาม-ตอบ", icon: MessagesSquare },
  { href: "/admin/complaints", label: "ร้องเรียน/เสนอแนะ", icon: MessageSquareWarning },
  { href: "/admin/forms", label: "แบบฟอร์ม", icon: FileDown },
  { href: "/admin/regulations", label: "ระเบียบ/ประกาศ", icon: ScrollText },
  { href: "/admin/financial-summary", label: "รายการย่อ", icon: Scale },
  { href: "/admin/notifications", label: "ป๊อปอัพแจ้งเตือน", icon: BellRing },
  { href: "/admin/slides", label: "สไลด์หน้าแรก", icon: GalleryHorizontal },
];

const TASK_ICON: Record<TaskLevel, LucideIcon> = {
  urgent: AlertTriangle,
  warning: Clock3,
  info: Info,
  ok: CheckCircle2,
};

const ACTION_LABEL: Record<string, string> = {
  create: "เพิ่ม",
  update: "แก้ไข",
  delete: "ลบ",
  reorder: "จัดลำดับ",
};

/* ═════════ ตัวช่วยจัดรูปแบบ ═════════ */
const fmt = (n: number) => n.toLocaleString("th-TH");

const thaiDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", ...opts });

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return thaiDate(iso, { day: "numeric", month: "short" });
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }));
  if (h < 12) return "สวัสดีตอนเช้า";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

/** ชื่อหน้าที่อ่านง่าย (ใช้ชื่อที่ตั้งไว้ใน "ตั้งค่าแสดงชื่อ URL") */
function pageName(url: string, translations: Record<string, string>) {
  const clean = url.split("?")[0].split("#")[0] || "/";
  if (translations[clean]) return translations[clean];
  if (clean === "/") return "หน้าแรก";
  for (const [key, value] of Object.entries(translations).sort((a, b) => b[0].length - a[0].length)) {
    if (key !== "/" && clean.startsWith(key)) {
      const rest = clean.slice(key.length);
      return rest ? `${value} › ${decodeURIComponent(rest.replace(/^\//, ""))}` : value;
    }
  }
  return decodeURIComponent(clean);
}

/** เปลี่ยนแปลงเทียบช่วงก่อน — คืน null เมื่อไม่มีฐานให้เทียบ */
function change(current: number, previous: number) {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

function Delta({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className={css.deltaMuted}>{label}</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`${css.delta} ${up ? css.deltaUp : css.deltaDown}`}>
      <Icon size={14} />
      {up ? "+" : "−"}
      {Math.abs(value * 100).toFixed(0)}% <span className={css.deltaLabel}>{label}</span>
    </span>
  );
}

/* ═════════ กราฟผู้เข้าชม 30 วัน ═════════ */
function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 220;
  const PAD = { top: 16, right: 8, bottom: 26, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d.count), 1);
  // เส้นกริดที่ตัวเลขกลม ๆ
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [0, niceMax / 2, niceMax];
  const avg = data.reduce((s, d) => s + d.count, 0) / Math.max(data.length, 1);

  const slot = innerW / data.length;
  const barW = Math.max(slot - 4, 2);
  const yOf = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;

  const label = (iso: string) => {
    const [, mm, dd] = iso.split("-");
    return `${Number(dd)}/${Number(mm)}`;
  };

  if (data.every((d) => d.count === 0)) {
    return (
      <div className={css.empty}>
        <BarChart3 size={40} />
        <p>ยังไม่มีผู้เข้าชมในช่วง 30 วันที่ผ่านมา</p>
      </div>
    );
  }

  const h = hover !== null ? data[hover] : null;

  return (
    <div className={css.chartWrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={css.chart}
        role="img"
        aria-label={`การเข้าชม 30 วันล่าสุด เฉลี่ย ${Math.round(avg)} ครั้งต่อวัน สูงสุด ${max} ครั้ง`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yOf(t)} y2={yOf(t)} className={css.gridLine} />
            <text x={PAD.left - 8} y={yOf(t) + 4} className={css.axisText} textAnchor="end">
              {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : t}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const top = yOf(d.count);
          const bh = PAD.top + innerH - top;
          const r = Math.min(4, bh / 2, barW / 2);
          // แท่งมุมบนโค้ง ฐานตรงติดแกน
          const path =
            bh <= 0
              ? ""
              : `M${x},${top + bh} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + bh} Z`;
          const isToday = i === data.length - 1;
          return (
            <g key={d.date}>
              {path && (
                <path
                  d={path}
                  className={`${css.bar} ${hover === i ? css.barHover : ""} ${isToday ? css.barToday : ""}`}
                />
              )}
              {(i % 5 === 4 || isToday) && (
                <text x={x + barW / 2} y={H - 8} className={css.axisText} textAnchor="middle">
                  {isToday ? "วันนี้" : label(d.date)}
                </text>
              )}
              {/* พื้นที่ชี้ใหญ่กว่าแท่ง */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          );
        })}

        <line x1={PAD.left} x2={W - PAD.right} y1={yOf(avg)} y2={yOf(avg)} className={css.avgLine} />
      </svg>

      {h && hover !== null && (
        <div
          className={css.tooltip}
          style={{
            left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
            top: `${(yOf(h.count) / H) * 100}%`,
          }}
        >
          <strong>{fmt(h.count)} ครั้ง</strong>
          <span>{thaiDate(`${h.date}T12:00:00+07:00`, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      )}

      <p className={css.chartNote}>
        <span className={css.avgKey} /> เฉลี่ย {fmt(Math.round(avg))} ครั้ง/วัน · สูงสุด {fmt(max)} ครั้ง
      </p>
    </div>
  );
}

/* ═════════ หน้าแดชบอร์ด ═════════ */
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error(String(res.status));
        const json: DashboardData = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shortcuts = useMemo(() => {
    if (!data) return [];
    const perms = data.permissions;
    return SHORTCUTS.filter((s) => perms === "all" || perms.includes(s.href));
  }, [data]);

  const todayText = new Date().toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (failed) {
    return (
      <div className={css.page}>
        <div className={css.empty}>
          <AlertTriangle size={40} />
          <p>โหลดข้อมูลแดชบอร์ดไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={css.page}>
        <div className={css.skeletonHead} />
        <div className={css.kpis}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${css.skeleton} ${css.skeletonKpi}`} />
          ))}
        </div>
        <div className={`${css.skeleton} ${css.skeletonChart}`} />
      </div>
    );
  }

  const v = data.visitors;
  const attention = data.tasks.filter((t) => t.level === "urgent" || t.level === "warning").length;
  const mobilePct = v.mobileShare !== null ? Math.round(v.mobileShare * 100) : null;
  const topMax = Math.max(...v.topPages.map((p) => p.count), 1);

  const kpis = [
    {
      label: "เข้าชมวันนี้",
      value: v.today,
      icon: Eye,
      tone: css.toneOrange,
      foot: <Delta value={change(v.today, v.yesterday)} label="เทียบเมื่อวาน" />,
    },
    {
      label: "เดือนนี้",
      value: v.thisMonth,
      icon: CalendarDays,
      tone: css.toneBlue,
      foot: <Delta value={change(v.thisMonth, v.lastMonthSoFar)} label="เทียบช่วงเดียวกันเดือนก่อน" />,
    },
    {
      label: "ปีนี้",
      value: v.thisYear,
      icon: TrendingUp,
      tone: css.toneGreen,
      foot: <span className={css.deltaMuted}>ตั้งแต่ 1 มกราคม</span>,
    },
    {
      label: "ทั้งหมด",
      value: v.total,
      icon: Globe2,
      tone: css.toneGold,
      foot: (
        <span className={css.deltaMuted}>
          {v.since ? `เริ่มเก็บ ${thaiDate(v.since, { day: "numeric", month: "short", year: "numeric" })}` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div>
          <p className={css.headDate}>{todayText}</p>
          <h1 className={css.headTitle}>
            {greeting()}, {data.user.fullName}
          </h1>
          <p className={css.headSub}>
            {attention > 0
              ? `มี ${attention} เรื่องที่ควรดูแลวันนี้`
              : "ทุกอย่างเรียบร้อยดี ไม่มีงานค้าง"}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={css.viewSite}>
          <ExternalLink size={16} /> เปิดดูหน้าเว็บไซต์
        </a>
      </header>

      {/* ── ตัวเลขหลัก ── */}
      <section className={css.kpis} aria-label="สถิติผู้เข้าชม">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${css.kpi} ${k.tone}`}>
              <div className={css.kpiTop}>
                <span className={css.kpiLabel}>{k.label}</span>
                <span className={css.kpiIcon}>
                  <Icon size={18} />
                </span>
              </div>
              <div className={css.kpiValue}>
                {fmt(k.value)} <small>ครั้ง</small>
              </div>
              <div className={css.kpiFoot}>{k.foot}</div>
            </div>
          );
        })}
      </section>

      {/* ── กราฟ + งานที่ต้องดูแล ── */}
      <section className={css.rowMain}>
        <div className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}>
              <BarChart3 size={18} /> การเข้าชม 30 วันล่าสุด
            </h2>
            <span className={css.cardHint}>ชี้ที่แท่งเพื่อดูตัวเลขรายวัน</span>
          </div>
          <DailyChart data={v.daily} />
        </div>

        <div className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}>
              <CheckCircle2 size={18} /> งานที่ต้องดูแล
            </h2>
            {attention > 0 && <span className={css.badge}>{attention}</span>}
          </div>
          {data.tasks.length === 0 ? (
            <div className={css.emptySmall}>ไม่มีรายการสำหรับเมนูที่คุณดูแล</div>
          ) : (
            <ul className={css.tasks}>
              {data.tasks.map((t) => {
                const Icon = TASK_ICON[t.level];
                return (
                  <li key={t.key}>
                    <Link href={t.href} className={`${css.task} ${css[`task_${t.level}`]}`}>
                      <span className={css.taskIcon}>
                        <Icon size={18} />
                      </span>
                      <span className={css.taskText}>
                        <strong>{t.title}</strong>
                        <span>{t.detail}</span>
                      </span>
                      <ArrowRight size={16} className={css.taskGo} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── หน้ายอดนิยม · อุปกรณ์/ข่าว · ความเคลื่อนไหว ── */}
      <section className={css.rowThree}>
        <div className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}>
              <Flame size={18} /> หน้ายอดนิยมเดือนนี้
            </h2>
            <Link href="/admin/page-analytics" className={css.cardLink}>
              ดูทั้งหมด
            </Link>
          </div>
          {v.topPages.length === 0 ? (
            <div className={css.emptySmall}>ยังไม่มีข้อมูลเดือนนี้</div>
          ) : (
            <ol className={css.topPages}>
              {v.topPages.map((p, i) => (
                <li key={p.pageUrl}>
                  <div className={css.topRow}>
                    <span className={css.topRank}>{i + 1}</span>
                    <span className={css.topName} title={p.pageUrl}>
                      {pageName(p.pageUrl, v.translations)}
                    </span>
                    <span className={css.topCount}>{fmt(p.count)}</span>
                  </div>
                  <div className={css.meter}>
                    <span style={{ width: `${(p.count / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className={css.stack}>
          {mobilePct !== null && (
            <div className={css.card}>
              <div className={css.cardHead}>
                <h2 className={css.cardTitle}>
                  <Users size={18} /> สมาชิกเข้าชมจากอุปกรณ์ใด
                </h2>
                <span className={css.cardHint}>30 วัน</span>
              </div>
              <div
                className={css.split}
                role="img"
                aria-label={`มือถือ ${mobilePct}% คอมพิวเตอร์ ${100 - mobilePct}%`}
              >
                <span className={css.splitMobile} style={{ width: `${mobilePct}%` }} />
                <span className={css.splitDesktop} />
              </div>
              <div className={css.splitLegend}>
                <span>
                  <i className={css.dotMobile} /> <Smartphone size={15} /> มือถือ/แท็บเล็ต <strong>{mobilePct}%</strong>
                </span>
                <span>
                  <i className={css.dotDesktop} /> <Monitor size={15} /> คอมพิวเตอร์ <strong>{100 - mobilePct}%</strong>
                </span>
              </div>
            </div>
          )}

          {data.topNews && data.topNews.length > 0 && (
            <div className={css.card}>
              <div className={css.cardHead}>
                <h2 className={css.cardTitle}>
                  <Newspaper size={18} /> ข่าวที่มีคนอ่านมากที่สุด
                </h2>
              </div>
              <ol className={css.newsList}>
                {data.topNews.map((n) => (
                  <li key={n.id}>
                    <span className={css.newsTitle}>{n.title || "(ไม่มีชื่อ)"}</span>
                    <span className={css.newsViews}>
                      <Eye size={13} /> {fmt(n.viewCount)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {data.activity && (
          <div className={css.card}>
            <div className={css.cardHead}>
              <h2 className={css.cardTitle}>
                <History size={18} /> ความเคลื่อนไหวล่าสุด
              </h2>
            </div>
            {data.activity.length === 0 ? (
              <div className={css.emptySmall}>ยังไม่มีการแก้ไขข้อมูล</div>
            ) : (
              <ul className={css.feed}>
                {data.activity.map((a) => (
                  <li key={a.id}>
                    <span className={css.feedAvatar}>{a.by.replace(/^ฝ่าย/, "").charAt(0)}</span>
                    <span className={css.feedText}>
                      <strong>{a.by}</strong> {ACTION_LABEL[a.action] ?? a.action} {a.section}
                      {a.count > 1 && ` ${a.count} รายการ`}
                      <span className={css.feedTime}>{relativeTime(a.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── ทางลัด ── */}
      {shortcuts.length > 0 && (
        <section className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}>ทางลัดจัดการเนื้อหา</h2>
          </div>
          <div className={css.shortcuts}>
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href} className={css.shortcut}>
                  <span className={css.shortcutIcon}>
                    <Icon size={20} />
                  </span>
                  {s.label}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
