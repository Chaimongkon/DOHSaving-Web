"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Tags,
  X,
} from "lucide-react";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
type Source = "manual" | "auto" | "section" | "raw";

interface Row {
  url: string;
  id: number | null;
  name: string | null;
  updatedAt: string | null;
  auto: { name: string; source: Source };
  views: number;
  broken: boolean;
}

interface Payload {
  windowDays: number;
  rows: Row[];
  totals: { manual: number; needsName: number; broken: number; coverage: number; views: number };
}

interface Preview {
  url: string;
  auto: { name: string; source: Source };
  existing: { id: number; name: string } | null;
  views: number;
  broken: boolean;
}

type Filter = "todo" | "named" | "all" | "broken";

const SOURCE: Record<Source, { label: string; tone: string }> = {
  manual: { label: "ตั้งเอง", tone: css.srcManual },
  auto: { label: "ชื่อจากระบบ", tone: css.srcAuto },
  section: { label: "เดาจาก URL", tone: css.srcGuess },
  raw: { label: "ระบบไม่รู้จัก", tone: css.srcRaw },
};

const PAGE = 30;
const fmt = (n: number) => n.toLocaleString("th-TH");
const pct = (r: number) => `${Math.round(r * 100)}%`;
/** URL ภาษาไทยเก็บแบบเข้ารหัส (%E0%B8…) — แสดงเป็นตัวอักษรให้อ่านออก */
const showUrl = (u: string) => {
  try {
    return decodeURI(u);
  } catch {
    return u;
  }
};
const thaiDate = (iso: string) => new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

/** ยังไม่มีชื่อที่ตั้งเอง และชื่อที่ระบบเดาอ่านไม่ค่อยรู้เรื่อง */
const needsName = (r: Row) => !r.name && !r.broken && r.auto.source !== "auto" && r.views > 0;

/* ═════════ แถว: ดู/แก้ชื่อในที่ ═════════ */
function MappingRow({
  row,
  maxViews,
  onSave,
  onReset,
}: {
  row: Row;
  maxViews: number;
  onSave: (url: string, name: string) => Promise<boolean>;
  onReset: (row: Row) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const shown = row.name ?? row.auto.name;
  const source: Source = row.name ? "manual" : row.auto.source;

  const start = () => {
    // ชื่อที่ระบบเดาแบบ "หมวด › ส่วนท้าย URL" — เหลือแค่ชื่อหมวดไว้ให้พิมพ์ต่อ
    setValue(row.name ?? (row.auto.source === "section" ? `${row.auto.name.split(" › ")[0]} › ` : row.auto.source === "raw" ? "" : row.auto.name));
    setEditing(true);
  };

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  const save = async () => {
    const v = value.trim();
    if (!v || v === row.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(row.url, v);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <li className={`${css.row} ${needsName(row) ? css.rowTodo : ""}`}>
      <div className={css.rowMain}>
        <div className={css.urlLine}>
          <code className={css.url} title={showUrl(row.url)}>{showUrl(row.url)}</code>
          {!row.broken && (
            <a href={row.url} target="_blank" rel="noopener noreferrer" className={css.open} aria-label={`เปิดหน้า ${row.url}`}>
              <ExternalLink size={13} />
            </a>
          )}
          {row.broken && <span className={css.brokenTag}><AlertTriangle size={12} /> ลิงก์เสีย (404)</span>}
        </div>

        {editing ? (
          <form
            className={css.editLine}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <input
              ref={input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              maxLength={120}
              placeholder="ชื่อหน้าที่อ่านเข้าใจง่าย เช่น เงินกู้สามัญ"
              aria-label={`ชื่อของ ${row.url}`}
              className={css.editInput}
            />
            <button type="submit" className={css.iconBtnPrimary} disabled={saving || !value.trim()} aria-label="บันทึก">
              {saving ? <Loader2 size={16} className={css.spin} /> : <Check size={16} />}
            </button>
            <button type="button" className={css.iconBtn} onClick={() => setEditing(false)} aria-label="ยกเลิก">
              <X size={16} />
            </button>
          </form>
        ) : (
          <div className={css.nameLine}>
            <span className={source === "manual" || source === "auto" ? css.name : css.nameWeak}>{shown}</span>
            <span className={`${css.src} ${SOURCE[source].tone}`}>{SOURCE[source].label}</span>
            {row.name && row.updatedAt && <span className={css.meta}>แก้ไข {thaiDate(row.updatedAt)}</span>}
          </div>
        )}
        {row.name && !editing && row.auto.name !== row.name && (
          <p className={css.autoHint}>ถ้าไม่ตั้งเอง ระบบจะแสดงว่า “{row.auto.name}”</p>
        )}
      </div>

      <div className={css.views} title={`เข้าชม ${fmt(row.views)} ครั้ง`}>
        <strong>{fmt(row.views)}</strong>
        <span className={css.viewsBar}><span style={{ width: `${maxViews ? Math.max(row.views ? 3 : 0, (row.views / maxViews) * 100) : 0}%` }} /></span>
      </div>

      {!editing && (
        <div className={css.actions}>
          <button type="button" className={needsName(row) ? css.btnPrimarySm : css.btnSm} onClick={start}>
            <Pencil size={14} /> {row.name ? "แก้ชื่อ" : "ตั้งชื่อ"}
          </button>
          {row.id !== null && (
            <button type="button" className={css.btnGhostSm} onClick={() => onReset(row)} title="ลบชื่อที่ตั้งเอง แล้วใช้ชื่อจากระบบ">
              <RotateCcw size={14} /> ใช้ชื่อจากระบบ
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/* ═════════ หน้า ═════════ */
export default function UrlMappingsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<Filter | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  // ฟอร์มเพิ่ม URL เอง
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/url-mappings");
        if (!res.ok) throw new Error();
        const json: Payload = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ชื่อที่ระบบจะแสดงของ URL ที่กำลังพิมพ์
  useEffect(() => {
    const raw = newUrl.trim();
    const t = setTimeout(async () => {
      if (!raw) {
        setPreview(null);
        setPreviewError("");
        return;
      }
      try {
        const res = await fetch(`/api/admin/url-mappings?preview=${encodeURIComponent(raw)}`);
        const json = await res.json();
        if (!res.ok) {
          setPreview(null);
          setPreviewError(json.error || "URL ไม่ถูกต้อง");
        } else {
          setPreview(json);
          setPreviewError("");
        }
      } catch {
        setPreview(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [newUrl]);

  const counts = useMemo(() => {
    const rows = data?.rows ?? [];
    return {
      todo: rows.filter(needsName).length,
      named: rows.filter((r) => r.name).length,
      all: rows.length,
      broken: rows.filter((r) => r.broken && r.views > 0).length,
    };
  }, [data]);

  // ค่าเริ่มต้น: มีงานค้าง → "ควรตั้งชื่อ" ไม่มี → "ตั้งชื่อแล้ว"
  const active: Filter = filter ?? (counts.todo > 0 ? "todo" : "named");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.rows ?? [])
      .filter((r) =>
        active === "todo" ? needsName(r) : active === "named" ? !!r.name : active === "broken" ? r.broken && r.views > 0 : true
      )
      .filter((r) => !q || showUrl(r.url).toLowerCase().includes(q) || (r.name ?? r.auto.name).toLowerCase().includes(q));
  }, [data, active, query]);

  const maxViews = useMemo(() => Math.max(1, ...(data?.rows ?? []).map((r) => r.views)), [data]);

  const save = async (url: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/url-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, thaiName: name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ text: json.error || "บันทึกไม่สำเร็จ", error: true });
        return false;
      }
      setToast({ text: json.created ? `ตั้งชื่อ ${showUrl(json.url)} แล้ว` : `แก้ชื่อ ${showUrl(json.url)} แล้ว` });
      setTick((n) => n + 1);
      return true;
    } catch {
      setToast({ text: "เชื่อมต่อไม่สำเร็จ", error: true });
      return false;
    }
  };

  const reset = async (row: Row) => {
    if (row.id === null) return;
    if (!window.confirm(`ลบชื่อที่ตั้งเองของ ${row.url} ใช่หรือไม่?\nหลังลบ ระบบจะแสดงเป็น “${row.auto.name}”`)) return;
    const res = await fetch(`/api/admin/url-mappings?id=${row.id}`, { method: "DELETE" }).catch(() => null);
    setToast(res?.ok ? { text: "กลับไปใช้ชื่อจากระบบแล้ว" } : { text: "ลบไม่สำเร็จ", error: true });
    if (res?.ok) setTick((n) => n + 1);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newName.trim()) return;
    setAdding(true);
    const ok = await save(newUrl, newName);
    setAdding(false);
    if (ok) {
      setNewUrl("");
      setNewName("");
    }
  };

  if (failed) {
    return (
      <div className={css.page}>
        <div className={css.state}><AlertTriangle size={28} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={css.page}>
        <div className={css.state}><Loader2 size={24} className={css.spin} /> กำลังโหลด…</div>
      </div>
    );
  }

  const t = data.totals;
  const FILTERS: [Filter, string, number][] = [
    ["todo", "ควรตั้งชื่อ", counts.todo],
    ["named", "ตั้งชื่อแล้ว", counts.named],
    ["all", "ทั้งหมด", counts.all],
    ["broken", "ลิงก์เสีย", counts.broken],
  ];

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Tags size={22} /></span>
          <div>
            <h1 className={css.title}>ตั้งชื่อหน้าเว็บ</h1>
            <p className={css.subtitle}>ชื่อที่แสดงแทน URL ในหน้าสถิติการเข้าชมและแดชบอร์ด · ข้อมูลการเข้าชม {data.windowDays} วันล่าสุด</p>
          </div>
        </div>
        <a href="/admin/page-analytics" className={css.headLink}>
          <BarChart3 size={15} /> ดูสถิติการเข้าชม
        </a>
      </header>

      {/* ── ตัวเลขหลัก ── */}
      <section className={css.kpis}>
        <div className={`${css.kpi} ${css.kpiAccent}`}>
          <span className={css.kpiLabel}>การเข้าชมที่แสดงเป็นชื่ออ่านง่าย</span>
          <span className={css.kpiValue}>{pct(t.coverage)}</span>
          <span className={css.meter}><span style={{ width: pct(t.coverage) }} /></span>
        </div>
        <button type="button" className={`${css.kpi} ${css.kpiBtn} ${t.needsName ? css.kpiWarn : ""}`} onClick={() => { setFilter("todo"); setLimit(PAGE); }}>
          <span className={css.kpiLabel}>ควรตั้งชื่อ</span>
          <span className={css.kpiValue}>{fmt(t.needsName)}</span>
          <span className={css.kpiFoot}>หน้าที่มีคนเข้า แต่ชื่อยังเดาจาก URL</span>
        </button>
        <button type="button" className={`${css.kpi} ${css.kpiBtn}`} onClick={() => { setFilter("named"); setLimit(PAGE); }}>
          <span className={css.kpiLabel}>ตั้งชื่อเองแล้ว</span>
          <span className={css.kpiValue}>{fmt(t.manual)}</span>
          <span className={css.kpiFoot}>รายการ</span>
        </button>
        <button type="button" className={`${css.kpi} ${css.kpiBtn}`} onClick={() => { setFilter("broken"); setLimit(PAGE); }}>
          <span className={css.kpiLabel}>ลิงก์เสียที่มีคนเข้า</span>
          <span className={css.kpiValue}>{fmt(t.broken)}</span>
          <span className={css.kpiFoot}>ลิงก์เก่า/พิมพ์ผิด ผู้ใช้เจอหน้า 404</span>
        </button>
      </section>

      {/* ── เพิ่ม URL เอง ── */}
      <section className={css.card}>
        <h2 className={css.cardTitle}><Link2 size={17} /> เพิ่มชื่อให้ URL</h2>
        <p className={css.cardHint}>วางลิงก์เต็มของหน้าเว็บ หรือพิมพ์เฉพาะ path ก็ได้ ระบบตัดโดเมนและส่วน ?… ให้เอง</p>
        <form className={css.addForm} onSubmit={add}>
          <label className={css.field}>
            <span>URL</span>
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="/services/loan หรือ https://…/services/loan" className={css.input} />
          </label>
          <label className={css.field}>
            <span>ชื่อที่ต้องการแสดง</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น เงินกู้สามัญ" maxLength={120} className={css.input} />
          </label>
          <button type="submit" className={css.btnPrimary} disabled={adding || !newUrl.trim() || !newName.trim() || !!previewError}>
            {adding ? <Loader2 size={16} className={css.spin} /> : <Check size={16} />} บันทึกชื่อ
          </button>
        </form>
        {previewError && <p className={css.previewErr}><AlertTriangle size={14} /> {previewError}</p>}
        {preview && (
          <p className={css.preview}>
            <code className={css.urlSm}>{showUrl(preview.url)}</code>
            {preview.existing ? (
              <>ตั้งชื่อไว้แล้วว่า <b>“{preview.existing.name}”</b> · บันทึกจะแทนชื่อเดิม</>
            ) : (
              <>ตอนนี้แสดงเป็น <b>“{preview.auto.name}”</b> <span className={`${css.src} ${SOURCE[preview.auto.source].tone}`}>{SOURCE[preview.auto.source].label}</span></>
            )}
            <span className={css.meta}>· เข้าชม {fmt(preview.views)} ครั้งใน {data.windowDays} วัน</span>
            {preview.broken && <span className={css.brokenTag}><AlertTriangle size={12} /> ไม่ใช่หน้าที่มีอยู่ในเว็บ</span>}
          </p>
        )}
      </section>

      {/* ── รายการ ── */}
      <section className={css.card}>
        <div className={css.toolbar}>
          <div className={css.seg} role="group" aria-label="กรองรายการ">
            {FILTERS.map(([k, label, n]) => (
              <button key={k} type="button" aria-pressed={active === k} className={active === k ? css.segOn : ""} onClick={() => { setFilter(k); setLimit(PAGE); }}>
                {label} <span className={css.segCount}>{fmt(n)}</span>
              </button>
            ))}
          </div>
          <label className={css.search}>
            <Search size={16} />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="ค้นหา URL หรือชื่อ" aria-label="ค้นหา URL หรือชื่อ" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="ล้าง"><X size={14} /></button>}
          </label>
        </div>

        {active === "todo" && visible.length > 0 && (
          <p className={css.tip}>เรียงตามจำนวนครั้งที่มีคนเข้า ตั้งชื่อแถวบน ๆ ก่อนจะเห็นผลในหน้าสถิติมากที่สุด กด Enter เพื่อบันทึก</p>
        )}
        {active === "broken" && visible.length > 0 && (
          <p className={css.tip}>ลิงก์เหล่านี้ไม่มีหน้าอยู่จริง มักมาจากลิงก์เก่าที่ยังแชร์อยู่ ควรแก้ลิงก์ต้นทางหรือทำ redirect มากกว่าตั้งชื่อ</p>
        )}

        {visible.length === 0 ? (
          <div className={css.empty}>
            {active === "todo" && !query ? (
              <><Check size={22} /> ทุกหน้าที่มีคนเข้ามีชื่ออ่านง่ายแล้ว</>
            ) : (
              "ไม่พบรายการ"
            )}
          </div>
        ) : (
          <>
            <div className={css.listHead} aria-hidden>
              <span>URL และชื่อที่แสดง</span>
              <span>เข้าชม {data.windowDays} วัน</span>
              <span />
            </div>
            <ul className={css.list}>
              {visible.slice(0, limit).map((r) => (
                <MappingRow key={r.url} row={r} maxViews={maxViews} onSave={save} onReset={reset} />
              ))}
            </ul>
            {visible.length > limit && (
              <button type="button" className={css.more} onClick={() => setLimit((n) => n + PAGE)}>
                แสดงเพิ่ม ({fmt(visible.length - limit)} รายการ)
              </button>
            )}
          </>
        )}
      </section>

      {toast && <div className={`${css.toast} ${toast.error ? css.toastErr : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}
