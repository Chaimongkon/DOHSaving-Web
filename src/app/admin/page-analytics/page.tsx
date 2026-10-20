"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Flame,
  LayoutGrid,
  Loader2,
  Search,
  Smartphone,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
type Period = "7d" | "30d" | "90d" | "month" | "lastmonth";

interface PageRow {
  url: string;
  name: string;
  section: string;
  views: number;
  prev: number;
  broken: boolean;
}

interface Payload {
  period: Period;
  range: { start: string; end: string; prevStart: string; prevEnd: string };
  totals: {
    views: number;
    prevViews: number;
    perDay: number;
    peak: { date: string; views: number };
    mobileShare: number | null;
    pagesVisited: number;
  };
  daily: { date: string; views: number }[];
  heatmap: number[][];
  sections: { key: string; label: string; views: number; prev: number }[];
  pages: PageRow[];
}

const PERIODS: { key: Period; label: string; compare: string }[] = [
  { key: "7d", label: "7 วัน", compare: "7 วันก่อนหน้า" },
  { key: "30d", label: "30 วัน", compare: "30 วันก่อนหน้า" },
  { key: "90d", label: "90 วัน", compare: "90 วันก่อนหน้า" },
  { key: "month", label: "เดือนนี้", compare: "ช่วงเดียวกันเดือนก่อน" },
  { key: "lastmonth", label: "เดือนที่แล้ว", compare: "เดือนก่อนหน้านั้น" },
];

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WEEKDAYS_FULL = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

const fmt = (n: number) => Math.round(n).toLocaleString("th-TH");
const pct = (r: number) => `${Math.round(r * 100)}%`;
const change = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev : null);
const thaiDay = (d: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", ...opts });
const thaiRange = (a: string, b: string) => {
  const o: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" };
  return `${new Date(a).toLocaleDateString("th-TH", o)} – ${new Date(new Date(b).getTime() - 1).toLocaleDateString("th-TH", o)}`;
};

function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className={css.deltaNew}>ใหม่</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`${css.delta} ${up ? css.up : css.down}`}>
      <Icon size={13} />
      {up ? "+" : "−"}
      {Math.abs(Math.round(value * 100))}%{suffix && <em> {suffix}</em>}
    </span>
  );
}

/* ═════════ กราฟรายวัน ═════════ */
function DailyChart({ data }: { data: Payload["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const H = 220;
  const P = { top: 12, right: 6, bottom: 24, left: 40 };
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;
  const max = Math.max(...data.map((d) => d.views), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / step) * step;
  const avg = data.reduce((s, d) => s + d.views, 0) / Math.max(1, data.length);
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(28, slot - (data.length > 60 ? 1 : 3)));
  const y = (v: number) => P.top + innerH - (v / niceMax) * innerH;
  const labelEvery = Math.ceil(data.length / 8);
  const h = hover !== null ? data[hover] : null;

  return (
    <div className={css.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={css.chart} role="img" aria-label={`การเข้าชมรายวัน เฉลี่ย ${Math.round(avg)} ครั้งต่อวัน`} onMouseLeave={() => setHover(null)}>
        {[0, niceMax / 2, niceMax].map((t) => (
          <g key={t}>
            <line x1={P.left} x2={W - P.right} y1={y(t)} y2={y(t)} className={css.grid} />
            <text x={P.left - 8} y={y(t) + 4} textAnchor="end" className={css.axis}>
              {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = P.left + i * slot + (slot - barW) / 2;
          const top = y(d.views);
          const bh = P.top + innerH - top;
          const r = Math.min(3, bh / 2, barW / 2);
          const weekend = [0, 6].includes(new Date(`${d.date}T12:00:00+07:00`).getDay());
          return (
            <g key={d.date}>
              {bh > 0 && (
                <path
                  d={`M${x},${top + bh} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + bh} Z`}
                  className={`${css.bar} ${weekend ? css.barWeekend : ""} ${hover === i ? css.barHover : ""}`}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 7} textAnchor="middle" className={css.axis}>
                  {thaiDay(d.date)}
                </text>
              )}
              <rect x={P.left + i * slot} y={P.top} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
        <line x1={P.left} x2={W - P.right} y1={y(avg)} y2={y(avg)} className={css.avgLine} />
      </svg>
      {h && hover !== null && (
        <div className={css.tooltip} style={{ left: `${((P.left + hover * slot + slot / 2) / W) * 100}%`, top: `${(y(h.views) / H) * 100}%` }}>
          <strong>{fmt(h.views)} ครั้ง</strong>
          <span>{thaiDay(h.date, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      )}
      <div className={css.legend}>
        <span><i className={css.keyWeekday} /> วันทำการ</span>
        <span><i className={css.keyWeekend} /> เสาร์–อาทิตย์</span>
        <span><i className={css.keyAvg} /> เฉลี่ย {fmt(avg)} ครั้ง/วัน</span>
      </div>
    </div>
  );
}

/* ═════════ ตารางช่วงเวลา (วัน × ชั่วโมง) ═════════ */
function Heatmap({ data }: { data: number[][] }) {
  const max = Math.max(...data.flat(), 1);
  // เรียง จันทร์ → อาทิตย์ (คนทำงาน)
  const order = [1, 2, 3, 4, 5, 6, 0];
  let best = { wd: 1, h: 9, v: 0 };
  data.forEach((row, wd) => row.forEach((v, h) => { if (v > best.v) best = { wd, h, v }; }));
  const level = (v: number) => (v === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));

  return (
    <div>
      <div className={css.heat} role="table" aria-label="จำนวนการเข้าชมตามวันและชั่วโมง">
        <div className={css.heatCorner} />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className={css.heatHour}>{h % 3 === 0 ? h : ""}</div>
        ))}
        {order.map((wd) => (
          <React.Fragment key={wd}>
            <div className={css.heatDay}>{WEEKDAYS[wd]}</div>
            {data[wd].map((v, h) => (
              <div
                key={h}
                className={`${css.cell} ${css[`l${level(v)}`]}`}
                title={`${WEEKDAYS_FULL[wd]} ${String(h).padStart(2, "0")}:00–${String(h + 1).padStart(2, "0")}:00 · ${fmt(v)} ครั้ง`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className={css.heatFoot}>
        <span className={css.heatScale}>
          น้อย {[1, 2, 3, 4, 5].map((l) => <i key={l} className={css[`l${l}`]} />)} มาก
        </span>
        {best.v > 0 && (
          <span className={css.heatBest}>
            <Clock size={14} /> คนเข้ามากที่สุด: <strong>{WEEKDAYS_FULL[best.wd]} {String(best.h).padStart(2, "0")}:00–{String(best.h + 1).padStart(2, "0")}:00 น.</strong>
          </span>
        )}
      </div>
    </div>
  );
}

/* ═════════ หน้า ═════════ */
export default function PageAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");
  const [sort, setSort] = useState<"views" | "change">("views");
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/page-analytics?period=${period}`);
        if (!res.ok) throw new Error();
        const json: Payload = await res.json();
        if (!cancelled) {
          setData(json);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = !data || data.period !== period;
  const t = data?.totals;
  const compareLabel = PERIODS.find((p) => p.key === period)?.compare ?? "";

  const livePages = useMemo(() => (data?.pages ?? []).filter((p) => !p.broken), [data]);
  const brokenPages = useMemo(() => (data?.pages ?? []).filter((p) => p.broken), [data]);

  // มาแรง / ลดลง — เทียบช่วงก่อนหน้า เฉพาะหน้าที่มีคนเข้าพอสมควร (กันตัวเลขกระโดดจากฐานเล็ก)
  const movers = useMemo(() => {
    const MIN = 20;
    const rows = livePages.filter((p) => Math.max(p.views, p.prev) >= MIN).map((p) => ({ ...p, diff: p.views - p.prev }));
    return {
      up: [...rows].filter((r) => r.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5),
      down: [...rows].filter((r) => r.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5),
    };
  }, [livePages]);

  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = livePages.filter(
      (p) => (!section || p.section === section) && (!q || p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q))
    );
    if (sort === "change") rows.sort((a, b) => (b.views - b.prev) - (a.views - a.prev));
    return rows;
  }, [livePages, query, section, sort]);

  const exportCsv = () => {
    if (!data) return;
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      ["อันดับ", "ชื่อหน้า", "URL", "หมวด", "เข้าชม", `เข้าชม (${compareLabel})`, "เปลี่ยนแปลง %"].join(","),
      ...livePages.map((p, i) =>
        [i + 1, q(p.name), q(p.url), q(data.sections.find((s) => s.key === p.section)?.label ?? p.section), p.views, p.prev, p.prev ? Math.round(((p.views - p.prev) / p.prev) * 100) : ""].join(",")
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionMax = Math.max(...(data?.sections ?? []).map((s) => s.views), 1);
  const pageMax = Math.max(...livePages.map((p) => p.views), 1);

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><BarChart3 size={22} /></span>
          <div>
            <h1 className={css.title}>สถิติการเข้าชมหน้าเว็บ</h1>
            <p className={css.subtitle}>
              {data ? `${thaiRange(data.range.start, data.range.end)} · เทียบกับ${compareLabel}` : "หน้าไหนคนใช้มาก ใช้ช่วงเวลาไหน และอะไรมาแรง"}
            </p>
          </div>
        </div>
        <div className={css.headActions}>
          <div className={css.periods} role="group" aria-label="ช่วงเวลา">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" aria-pressed={period === p.key} className={period === p.key ? css.periodOn : ""} onClick={() => { setPeriod(p.key); setLimit(25); }}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className={css.headBtn} onClick={exportCsv} disabled={loading}>
            <Download size={15} /> CSV
          </button>
        </div>
      </header>

      {failed ? (
        <div className={css.state}><AlertTriangle size={28} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div>
      ) : loading || !t || !data ? (
        <div className={css.state}><Loader2 size={24} className={css.spin} /> กำลังคำนวณสถิติ…</div>
      ) : (
        <>
          {/* ── ตัวเลขหลัก ── */}
          <section className={css.kpis}>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><Eye size={15} /> เข้าชมทั้งหมด</span>
              <span className={css.kpiValue}>{fmt(t.views)}</span>
              <span className={css.kpiFoot}><Delta value={change(t.views, t.prevViews)} suffix={`เทียบ${compareLabel}`} /></span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><CalendarDays size={15} /> เฉลี่ยต่อวัน</span>
              <span className={css.kpiValue}>{fmt(t.perDay)}</span>
              <span className={css.kpiFoot}>{fmt(t.pagesVisited)} หน้าที่มีคนเข้า</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><Flame size={15} /> วันที่คนเข้ามากที่สุด</span>
              <span className={css.kpiValue}>{t.peak.views ? fmt(t.peak.views) : "–"}</span>
              <span className={css.kpiFoot}>{t.peak.date ? thaiDay(t.peak.date, { weekday: "long", day: "numeric", month: "short" }) : "—"}</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><Smartphone size={15} /> ใช้มือถือ</span>
              <span className={css.kpiValue}>{t.mobileShare !== null ? pct(t.mobileShare) : "–"}</span>
              <span className={css.kpiFoot}>ที่เหลือใช้คอมพิวเตอร์</span>
            </div>
          </section>

          {/* ── แนวโน้มรายวัน ── */}
          <section className={css.card}>
            <h2 className={css.cardTitle}><BarChart3 size={17} /> การเข้าชมรายวัน</h2>
            <DailyChart data={data.daily} />
          </section>

          <section className={css.row2}>
            {/* หมวด */}
            <div className={css.card}>
              <h2 className={css.cardTitle}><LayoutGrid size={17} /> ส่วนของเว็บที่คนใช้</h2>
              <ul className={css.sections}>
                {data.sections.slice(0, 12).map((s) => (
                  <li key={s.key}>
                    <button type="button" className={`${css.sectionRow} ${section === s.key ? css.sectionOn : ""}`} onClick={() => setSection(section === s.key ? "" : s.key)} title="กรองตารางด้านล่างตามหมวดนี้">
                      <span className={css.sectionName}>{s.label}</span>
                      <span className={css.sectionBar}><span style={{ width: `${(s.views / sectionMax) * 100}%` }} /></span>
                      <span className={css.sectionNum}>{fmt(s.views)}</span>
                      <span className={css.sectionShare}>{pct(s.views / Math.max(1, t.views))}</span>
                      <Delta value={change(s.views, s.prev)} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ช่วงเวลา */}
            <div className={css.card}>
              <h2 className={css.cardTitle}><Clock size={17} /> ช่วงเวลาที่คนเข้าเว็บ</h2>
              <Heatmap data={data.heatmap} />
              <p className={css.hint}>ใช้วางเวลาประกาศข่าวหรือป๊อปอัพ ให้ตรงช่วงที่สมาชิกเข้าเว็บมากที่สุด</p>
            </div>
          </section>

          {/* ── มาแรง / ลดลง ── */}
          <section className={css.row2}>
            {([
              ["up", "มาแรง", TrendingUp, movers.up],
              ["down", "ลดลง", TrendingDown, movers.down],
            ] as const).map(([k, label, Icon, rows]) => (
              <div key={k} className={css.card}>
                <h2 className={css.cardTitle}><Icon size={17} /> {label} <small>เทียบ{compareLabel}</small></h2>
                {rows.length === 0 ? (
                  <p className={css.empty}>ไม่มีหน้าที่เปลี่ยนแปลงชัดเจน</p>
                ) : (
                  <ol className={css.movers}>
                    {rows.map((p) => (
                      <li key={p.url}>
                        <span className={css.moverName} title={p.url}>{p.name}</span>
                        <span className={css.moverNums}>{fmt(p.prev)} → <strong>{fmt(p.views)}</strong></span>
                        <span className={`${css.moverDiff} ${p.diff > 0 ? css.up : css.down}`}>{p.diff > 0 ? "+" : "−"}{fmt(Math.abs(p.diff))}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </section>

          {/* ── ตารางทุกหน้า ── */}
          <section className={css.card}>
            <div className={css.tableHead}>
              <h2 className={css.cardTitle}>ทุกหน้า <small>{fmt(tableRows.length)} หน้า</small></h2>
              <div className={css.filters}>
                <label className={css.search}>
                  <Search size={15} />
                  <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(25); }} placeholder="ค้นหาชื่อหน้าหรือ URL" aria-label="ค้นหาหน้า" />
                  {query && <button type="button" onClick={() => setQuery("")} aria-label="ล้าง"><X size={13} /></button>}
                </label>
                <select value={section} onChange={(e) => { setSection(e.target.value); setLimit(25); }} className={css.select} aria-label="กรองหมวด">
                  <option value="">ทุกหมวด</option>
                  {data.sections.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <div className={css.seg} role="group" aria-label="เรียงลำดับ">
                  <button type="button" aria-pressed={sort === "views"} className={sort === "views" ? css.segOn : ""} onClick={() => setSort("views")}>เข้าชมมากสุด</button>
                  <button type="button" aria-pressed={sort === "change"} className={sort === "change" ? css.segOn : ""} onClick={() => setSort("change")}>เพิ่มขึ้นมากสุด</button>
                </div>
              </div>
            </div>

            <div className={css.tableWrap}>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>หน้า</th>
                    <th className={css.num}>เข้าชม</th>
                    <th className={css.shareCol}>สัดส่วน</th>
                    <th className={css.num}>เทียบช่วงก่อน</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(0, limit).map((p, i) => (
                    <tr key={p.url}>
                      <td className={css.rank}>{i + 1}</td>
                      <td>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className={css.pageLink}>
                          <span className={css.pageName}>{p.name}</span>
                          <span className={css.pageUrl}>{p.url} <ExternalLink size={11} /></span>
                        </a>
                      </td>
                      <td className={css.num}><strong>{fmt(p.views)}</strong></td>
                      <td className={css.shareCol}>
                        <span className={css.shareBar}><span style={{ width: `${(p.views / pageMax) * 100}%` }} /></span>
                        <span className={css.shareNum}>{(p.views / Math.max(1, t.views) * 100).toFixed(1)}%</span>
                      </td>
                      <td className={css.num}><Delta value={change(p.views, p.prev)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableRows.length > limit && (
              <button type="button" className={css.more} onClick={() => setLimit((n) => n + 50)}>
                แสดงเพิ่ม ({fmt(tableRows.length - limit)} หน้า)
              </button>
            )}
          </section>

          {/* ── ลิงก์ที่ไม่มีหน้าอยู่จริง ── */}
          {brokenPages.length > 0 && (
            <section className={`${css.card} ${css.warnCard}`}>
              <h2 className={css.cardTitle}><AlertTriangle size={17} /> ลิงก์ที่ไม่มีหน้าอยู่จริง <small>{fmt(brokenPages.reduce((n, p) => n + p.views, 0))} ครั้ง</small></h2>
              <p className={css.hint}>
                มีคนเข้า URL เหล่านี้แต่เว็บไม่มีหน้ารองรับ (เจอหน้า “ไม่พบหน้า”) ส่วนใหญ่มาจากลิงก์ของเว็บเก่าที่ยังถูกแชร์หรือบันทึกไว้
                ควรทำทางเปลี่ยนเส้นทางไปหน้าใหม่ที่ตรงกัน
              </p>
              <ul className={css.broken}>
                {brokenPages.slice(0, 12).map((p) => (
                  <li key={p.url}><code>{p.url}</code><span>{fmt(p.views)} ครั้ง</span></li>
                ))}
              </ul>
            </section>
          )}

          <p className={css.note}>
            นับเป็นจำนวนครั้งที่เปิดหน้า (ไม่ใช่จำนวนคน) · ไม่รวมหน้าในระบบจัดการ · ผู้ที่ไม่ยินยอมคุกกี้วิเคราะห์ถูกนับแบบไม่ระบุตัวตน
            · ชื่อหน้าแก้ได้ที่เมนู “ตั้งค่าแสดงชื่อ URL” (ข่าว กระทู้ และหน้าบริการใช้ชื่อจริงให้อัตโนมัติ)
          </p>
        </>
      )}
    </div>
  );
}
