"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  Eye,
  FileDown,
  FolderOpen,
  Info,
  Loader2,
  Search,
  SearchX,
  Trophy,
  X,
} from "lucide-react";
import { SEARCH_PAGES } from "@/lib/siteEventTypes";
import base from "../page-analytics/page.module.css";
import own from "./page.module.css";

const css = { ...base, ...own };

/* ═════════ ชนิดข้อมูล ═════════ */
interface Pair {
  cur: number;
  prev: number;
}

interface FormRow {
  id: number;
  title: string;
  category: string | null;
  group: string | null;
  removed: boolean;
  downloads: number;
  views: number;
}

interface Miss {
  term: string;
  page: string;
  pageLabel: string;
  count: number;
  last: string;
}

interface Payload {
  days: number;
  trackingSince: string | null;
  partial: boolean;
  totals: { formEvents: Pair; downloads: number; views: number; groupViews: Pair; misses: Pair; missTerms: number };
  topForms: FormRow[];
  unused: { id: number; title: string; category: string; group: string }[];
  groups: { key: string; label: string; views: number; prev: number }[];
  misses: Miss[];
}

const PERIODS = [
  { days: 7, label: "7 วัน" },
  { days: 30, label: "30 วัน" },
  { days: 90, label: "90 วัน" },
  { days: 365, label: "1 ปี" },
];

const fmt = (n: number) => Math.round(n).toLocaleString("th-TH");
const change = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev : null);
const thaiDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

/** ลิงก์ลองค้นคำเดียวกันบนหน้าเว็บ (เฉพาะหน้าที่รับ ?q=) */
const tryHref = (m: Miss) => {
  const page = SEARCH_PAGES[m.page];
  if (!page) return null;
  return m.page === "forms" || m.page === "qna" ? `${page.href}?q=${encodeURIComponent(m.term)}` : page.href;
};

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className={css.deltaNew}>ใหม่</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`${css.delta} ${up ? css.up : css.down}`}>
      <Icon size={13} />
      {up ? "+" : "−"}
      {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

/* ═════════ หน้า ═════════ */
export default function SearchInsightsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [missPage, setMissPage] = useState("");
  const [formQuery, setFormQuery] = useState("");
  const [missLimit, setMissLimit] = useState(20);
  const [formLimit, setFormLimit] = useState(20);
  const [clearing, setClearing] = useState<string | null>(null);
  const [cleared, setCleared] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/search-insights?days=${days}`);
        if (!res.ok) throw new Error();
        const json: Payload = await res.json();
        if (!cancelled) {
          setData(json);
          setFailed(false);
          setCleared(new Set());
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const loading = !data || data.days !== days;
  const t = data?.totals;
  const keyOf = (m: Miss) => `${m.page}|${m.term}`;

  const misses = useMemo(
    () => (data?.misses ?? []).filter((m) => !cleared.has(keyOf(m)) && (!missPage || m.page === missPage)),
    [data, cleared, missPage]
  );
  const missPages = useMemo(() => [...new Set((data?.misses ?? []).map((m) => m.page))], [data]);

  const forms = useMemo(() => {
    const q = formQuery.trim().toLowerCase();
    return (data?.topForms ?? []).filter(
      (f) => !q || `${f.title} ${f.category ?? ""} ${f.group ?? ""}`.toLowerCase().includes(q)
    );
  }, [data, formQuery]);

  const clearTerm = async (m: Miss) => {
    const key = keyOf(m);
    setClearing(key);
    try {
      const res = await fetch("/api/admin/search-insights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: m.term, page: m.page }),
      });
      if (res.ok) setCleared((prev) => new Set(prev).add(key));
    } finally {
      setClearing(null);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      ["คำค้น", "หน้า", "จำนวนครั้ง", "ค้นล่าสุด"].join(","),
      ...misses.map((m) => [q(m.term), q(m.pageLabel), m.count, q(thaiDate(m.last, true))].join(",")),
      "",
      ["แบบฟอร์ม", "ประเภทสมาชิก", "หมวด", "ดาวน์โหลด", "เปิดดู"].join(","),
      ...data.topForms.map((f) => [q(f.title), q(f.category ?? ""), q(f.group ?? ""), f.downloads, f.views].join(",")),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `search-insights_${days}d_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const partial = data?.partial ?? true;
  const groupMax = Math.max(...(data?.groups ?? []).map((g) => g.views), 1);
  const formMax = Math.max(...(data?.topForms ?? []).map((f) => f.downloads + f.views), 1);
  const missMax = Math.max(...misses.map((m) => m.count), 1);

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Search size={22} /></span>
          <div>
            <h1 className={css.title}>สมาชิกมองหาอะไร</h1>
            <p className={css.subtitle}>แบบฟอร์มที่ถูกใช้ · หมวดที่เปิด · คำค้นที่หาไม่เจอ — ใช้ปรับชื่อเอกสารและเติมสิ่งที่ขาด</p>
          </div>
        </div>
        <div className={css.headActions}>
          <div className={css.periods} role="group" aria-label="ช่วงเวลา">
            {PERIODS.map((p) => (
              <button key={p.days} type="button" aria-pressed={days === p.days} className={days === p.days ? css.periodOn : ""} onClick={() => setDays(p.days)}>
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
        <div className={css.state}><Loader2 size={24} className={css.spin} /> กำลังโหลด…</div>
      ) : (
        <>
          {partial && (
            <div className={css.notice}>
              <Info size={17} />
              <span>
                {data.trackingSince
                  ? <>เริ่มเก็บข้อมูลเมื่อ <strong>{thaiDate(data.trackingSince)}</strong> ยังไม่ครบช่วงที่เลือก ตัวเลขจึงยังน้อยและการเทียบช่วงก่อนยังไม่มีความหมาย</>
                  : <>ยังไม่มีข้อมูล — ระบบจะเริ่มนับเมื่อสมาชิกเปิดแบบฟอร์ม เปิดหมวด หรือค้นหาบนเว็บ</>}
              </span>
            </div>
          )}

          {/* ── ตัวเลขหลัก ── */}
          <section className={css.kpis}>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><FileDown size={15} /> ดาวน์โหลดแบบฟอร์ม</span>
              <span className={css.kpiValue}>{fmt(t.downloads)}</span>
              <span className={css.kpiFoot}>+ เปิดดู {fmt(t.views)} ครั้ง</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><Eye size={15} /> ใช้แบบฟอร์มรวม</span>
              <span className={css.kpiValue}>{fmt(t.formEvents.cur)}</span>
              <span className={css.kpiFoot}><Delta value={change(t.formEvents.cur, t.formEvents.prev)} /> เทียบ {days} วันก่อนหน้า</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><FolderOpen size={15} /> เปิดหมวดแบบฟอร์ม</span>
              <span className={css.kpiValue}>{fmt(t.groupViews.cur)}</span>
              <span className={css.kpiFoot}><Delta value={change(t.groupViews.cur, t.groupViews.prev)} /> เทียบ {days} วันก่อนหน้า</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}><SearchX size={15} /> ค้นหาแล้วไม่เจอ</span>
              <span className={css.kpiValue}>{fmt(t.misses.cur)}</span>
              <span className={css.kpiFoot}>{fmt(t.missTerms)} คำที่ต่างกัน</span>
            </div>
          </section>

          {/* ── คำค้นที่หาไม่เจอ ── */}
          <section className={css.card}>
            <div className={css.tableHead}>
              <h2 className={css.cardTitle}><SearchX size={17} /> คำค้นที่หาไม่เจอ <small>{fmt(misses.length)} คำ</small></h2>
              {missPages.length > 1 && (
                <div className={css.filters}>
                  <div className={css.seg} role="group" aria-label="กรองหน้า">
                    <button type="button" aria-pressed={!missPage} className={!missPage ? css.segOn : ""} onClick={() => setMissPage("")}>ทุกหน้า</button>
                    {missPages.map((p) => (
                      <button key={p} type="button" aria-pressed={missPage === p} className={missPage === p ? css.segOn : ""} onClick={() => setMissPage(p)}>
                        {SEARCH_PAGES[p]?.label ?? p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className={css.hint}>
              คำที่ถูกค้นบ่อยคือสิ่งที่สมาชิกต้องการแต่หาไม่เจอ — เพิ่มคำนั้นในชื่อหรือคำอธิบายของแบบฟอร์ม/เอกสาร
              หรือเพิ่มเอกสารที่ขาด แล้วกด “จัดการแล้ว” เพื่อเอาออกจากรายการ (ตัวเลขยาว ๆ เช่นเลขสมาชิก ถูกปิดเป็น ••• ก่อนเก็บ)
            </p>

            {misses.length === 0 ? (
              <p className={css.empty}>ไม่มีคำค้นที่หาไม่เจอในช่วงนี้</p>
            ) : (
              <>
                <div className={css.tableWrap}>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>คำค้น</th>
                        <th className={css.hideSm}>ค้นที่หน้า</th>
                        <th className={css.shareCol}>จำนวนครั้ง</th>
                        <th className={css.hideSm}>ค้นล่าสุด</th>
                        <th className={css.actionCol} aria-label="จัดการ" />
                      </tr>
                    </thead>
                    <tbody>
                      {misses.slice(0, missLimit).map((m, i) => {
                        const href = tryHref(m);
                        const key = keyOf(m);
                        return (
                          <tr key={key}>
                            <td className={css.rank}>{i + 1}</td>
                            <td>
                              {href ? (
                                <a href={href} target="_blank" rel="noopener noreferrer" className={css.termLink} title="ลองค้นคำนี้บนเว็บ">
                                  <span className={css.term}>{m.term}</span>
                                </a>
                              ) : (
                                <span className={css.term}>{m.term}</span>
                              )}
                            </td>
                            <td className={css.hideSm}><span className={css.pageTag}>{m.pageLabel}</span></td>
                            <td className={css.shareCol}>
                              <span className={css.shareBar}><span style={{ width: `${(m.count / missMax) * 100}%` }} /></span>
                              <span className={`${css.shareNum} ${m.count >= 5 ? css.hot : ""}`}><strong>{fmt(m.count)}</strong></span>
                            </td>
                            <td className={css.hideSm}><span className={css.when}>{thaiDate(m.last, true)}</span></td>
                            <td className={css.actionCol}>
                              <button type="button" className={css.clearBtn} onClick={() => clearTerm(m)} disabled={clearing === key} title="เอาคำนี้ออกจากรายการ">
                                {clearing === key ? <Loader2 size={13} className={css.spin} /> : <Check size={13} />} จัดการแล้ว
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {misses.length > missLimit && (
                  <button type="button" className={css.more} onClick={() => setMissLimit((n) => n + 50)}>
                    แสดงเพิ่ม ({fmt(misses.length - missLimit)} คำ)
                  </button>
                )}
              </>
            )}
          </section>

          <section className={css.row2}>
            {/* หมวดแบบฟอร์ม */}
            <div className={css.card}>
              <h2 className={css.cardTitle}><FolderOpen size={17} /> หมวดแบบฟอร์มที่เปิด</h2>
              {t.groupViews.cur === 0 ? (
                <p className={css.empty}>ยังไม่มีการเปิดหมวดในช่วงนี้</p>
              ) : (
                <ul className={css.sections}>
                  {data.groups.map((g) => (
                    <li key={g.key}>
                      <a href={`/forms?group=${g.key}`} target="_blank" rel="noopener noreferrer" className={`${css.sectionRow} ${css.sectionLink}`}>
                        <span className={css.sectionName}>{g.label}</span>
                        <span className={css.sectionBar}><span style={{ width: `${(g.views / groupMax) * 100}%` }} /></span>
                        <span className={css.sectionNum}>{fmt(g.views)}</span>
                        <span className={css.sectionShare}>{Math.round((g.views / Math.max(1, t.groupViews.cur)) * 100)}%</span>
                        <Delta value={change(g.views, g.prev)} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className={css.hint}>หมวดที่คนเปิดมาก ควรอยู่ในเมนูหรือหน้าแรกให้เข้าถึงง่าย</p>
            </div>

            {/* อันดับแบบฟอร์ม */}
            <div className={css.card}>
              <h2 className={css.cardTitle}><Trophy size={17} /> แบบฟอร์มยอดนิยม</h2>
              {data.topForms.length === 0 ? (
                <p className={css.empty}>ยังไม่มีการดาวน์โหลดในช่วงนี้</p>
              ) : (
                <ol className={css.movers}>
                  {data.topForms.slice(0, 10).map((f) => (
                    <li key={f.id}>
                      <span className={css.moverName} title={f.title}>{f.title}</span>
                      <span className={css.moverNums}>{f.category ?? ""}</span>
                      <span className={`${css.moverDiff} ${css.up}`}>{fmt(f.downloads + f.views)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          {/* ── ทุกแบบฟอร์ม ── */}
          {data.topForms.length > 0 && (
            <section className={css.card}>
              <div className={css.tableHead}>
                <h2 className={css.cardTitle}>แบบฟอร์มที่มีคนใช้ <small>{fmt(forms.length)} รายการ</small></h2>
                <div className={css.filters}>
                  <label className={css.search}>
                    <Search size={15} />
                    <input value={formQuery} onChange={(e) => { setFormQuery(e.target.value); setFormLimit(20); }} placeholder="ค้นหาชื่อแบบฟอร์ม" aria-label="ค้นหาแบบฟอร์ม" />
                    {formQuery && <button type="button" onClick={() => setFormQuery("")} aria-label="ล้าง"><X size={13} /></button>}
                  </label>
                </div>
              </div>
              <div className={css.tableWrap}>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>แบบฟอร์ม</th>
                      <th className={css.num}>ดาวน์โหลด</th>
                      <th className={`${css.num} ${css.hideSm}`}>เปิดดู</th>
                      <th className={css.shareCol}>รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.slice(0, formLimit).map((f, i) => (
                      <tr key={f.id}>
                        <td className={css.rank}>{i + 1}</td>
                        <td>
                          <span className={`${css.pageName} ${f.removed ? css.removed : ""}`}>{f.title}</span>
                          {!f.removed && <span className={css.formMeta}>{[f.category, f.group].filter(Boolean).join(" · ")}</span>}
                        </td>
                        <td className={css.num}><strong>{fmt(f.downloads)}</strong></td>
                        <td className={`${css.num} ${css.hideSm}`}>{fmt(f.views)}</td>
                        <td className={css.shareCol}>
                          <span className={css.shareBar}><span style={{ width: `${((f.downloads + f.views) / formMax) * 100}%` }} /></span>
                          <span className={css.shareNum}>{fmt(f.downloads + f.views)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {forms.length > formLimit && (
                <button type="button" className={css.more} onClick={() => setFormLimit((n) => n + 50)}>
                  แสดงเพิ่ม ({fmt(forms.length - formLimit)} รายการ)
                </button>
              )}
            </section>
          )}

          {/* ── ไม่มีใครเปิด ── */}
          {!partial && data.unused.length > 0 && (
            <section className={`${css.card} ${css.warnCard}`}>
              <h2 className={css.cardTitle}><AlertTriangle size={17} /> แบบฟอร์มที่ไม่มีใครเปิดใน {days} วัน <small>{fmt(data.unused.length)} รายการ</small></h2>
              <p className={css.hint}>อาจเลิกใช้แล้ว ชื่อซ้ำกับฉบับอื่น หรือชื่อไม่ตรงกับที่สมาชิกเข้าใจ — ลองทบทวนในเมนู “แบบฟอร์มต่างๆ”</p>
              <ul className={css.unused}>
                {data.unused.map((f) => (
                  <li key={f.id}>
                    {f.title}
                    <small>{f.category} · {f.group}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
