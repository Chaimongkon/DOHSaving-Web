"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cookie,
  ExternalLink,
  Info,
  Loader2,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { RETENTION_YEARS } from "@/lib/retentionPolicy";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
type Choice = "all" | "none" | "custom";

interface Stats {
  total: number;
  accepted: number;
  rejected: number;
  acceptRate: number;
  choices: Record<Choice, number>;
  device: Record<"mobile" | "desktop", { total: number; accepted: number }>;
  monthly: { month: string; accepted: number; rejected: number }[];
  ipUnknownRate: number;
  changed: number;
  since: string | null;
  visits30: number;
  anonVisits30: number;
}

interface RecordRow {
  id: number;
  userId: string;
  consentStatus: boolean;
  choice: Choice;
  cookieCategories: { analytics?: boolean; marketing?: boolean; preferences?: boolean } | null;
  ip: string;
  device: "mobile" | "desktop";
  createdAt: string;
  updatedAt: string;
}

interface Payload {
  stats: Stats;
  records: RecordRow[];
  recordTotal: number;
  page: number;
  totalPages: number;
}

const CHOICE: Record<Choice, { label: string; tone: string }> = {
  all: { label: "ยอมรับทั้งหมด", tone: css.chAll },
  none: { label: "จำเป็นเท่านั้น", tone: css.chNone },
  custom: { label: "เลือกเอง", tone: css.chCustom },
};

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y + 543).slice(2)}`;
};

const fmt = (n: number) => n.toLocaleString("th-TH");
const pct = (r: number) => `${Math.round(r * 100)}%`;
const thaiDate = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

/* ═════════ กราฟรายเดือน (แท่งซ้อน ยอมรับ/ปฏิเสธ) ═════════ */
function MonthlyChart({ data }: { data: Stats["monthly"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 230;
  const P = { top: 14, right: 8, bottom: 26, left: 42 };
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;
  const max = Math.max(...data.map((d) => d.accepted + d.rejected), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / step) * step;
  const y = (v: number) => P.top + innerH - (v / niceMax) * innerH;
  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.min(46, slot * 0.62);
  const GAP = 2; // ช่องว่างระหว่างส่วนซ้อน
  const h = hover !== null ? data[hover] : null;

  return (
    <div className={css.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={css.chart} role="img" aria-label="จำนวนการตัดสินใจรายเดือน แยกยอมรับและปฏิเสธ" onMouseLeave={() => setHover(null)}>
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
          const yAcc = y(d.accepted);
          const accH = P.top + innerH - yAcc;
          const yTop = y(d.accepted + d.rejected);
          const rejH = Math.max(0, yAcc - yTop - GAP);
          return (
            <g key={d.month} className={hover === i ? css.barHover : undefined}>
              {/* ยอมรับ: ฐาน */}
              <rect x={x} y={yAcc} width={barW} height={accH} className={css.barAccept} />
              {/* ปฏิเสธ: ซ้อนด้านบน มุมบนโค้ง */}
              {rejH > 0 && (
                <path
                  d={`M${x},${yAcc - GAP} V${yTop + 4} Q${x},${yTop} ${x + 4},${yTop} H${x + barW - 4} Q${x + barW},${yTop} ${x + barW},${yTop + 4} V${yAcc - GAP} Z`}
                  className={css.barReject}
                />
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className={css.axis}>
                {monthLabel(d.month)}
              </text>
              <rect x={P.left + i * slot} y={P.top} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div className={css.tooltip} style={{ left: `${((P.left + hover * slot + slot / 2) / W) * 100}%`, top: `${(y(h.accepted + h.rejected) / H) * 100}%` }}>
          <strong>{monthLabel(h.month)}</strong>
          <span><i className={css.keyAccept} /> ยอมรับ {fmt(h.accepted)}</span>
          <span><i className={css.keyReject} /> ปฏิเสธ {fmt(h.rejected)}</span>
          <span>อัตรายอมรับ {pct(h.accepted / Math.max(1, h.accepted + h.rejected))}</span>
        </div>
      )}
      <div className={css.legend}>
        <span><i className={css.keyAccept} /> ยอมรับคุกกี้</span>
        <span><i className={css.keyReject} /> ปฏิเสธ (จำเป็นเท่านั้น)</span>
      </div>
    </div>
  );
}

/* ═════════ หน้า ═════════ */
export default function CookieConsentPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "accepted" | "rejected">("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const res = await fetch(`/api/admin/cookie-consent?${params}`);
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
  }, [search, status, page, tick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const remove = async (r: RecordRow) => {
    if (!window.confirm(`ลบบันทึกความยินยอมของผู้เข้าชม ${r.userId.slice(0, 8)}… ใช่หรือไม่?\nใช้เมื่อเจ้าของข้อมูลขอลบข้อมูลของตนเท่านั้น`)) return;
    const res = await fetch(`/api/admin/cookie-consent?id=${r.id}`, { method: "DELETE" });
    setToast(res.ok ? "ลบบันทึกแล้ว (บันทึกไว้ในประวัติการแก้ไขระบบ)" : "ลบไม่สำเร็จ");
    if (res.ok) setTick((n) => n + 1);
  };

  if (failed) {
    return (
      <div className={css.page}>
        <div className={css.state}><AlertTriangle size={32} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div>
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

  const s = data.stats;
  const choiceTotal = Math.max(1, s.choices.all + s.choices.none + s.choices.custom);
  const devRate = (k: "mobile" | "desktop") => s.device[k].accepted / Math.max(1, s.device[k].total);

  /* ── ข้อควรปรับปรุง: คำนวณจากข้อมูลจริง + สิ่งที่ตรวจพบในระบบ ── */
  const checks: { level: "warn" | "info" | "ok"; title: string; detail: string }[] = [
    s.ipUnknownRate > 0.3
      ? {
          level: "warn",
          title: `${pct(s.ipUnknownRate)} ของบันทึกไม่มี IP จริง`,
          detail: "ถ้าเพิ่งตั้ง TRUST_PROXY_HEADERS=true บนเซิร์ฟเวอร์ ตัวเลขนี้จะค่อย ๆ ลดลงตามบันทึกใหม่ · ถ้ายังไม่ได้ตั้ง ให้เพิ่มใน .env.local แล้ว restart (IIS ส่ง IP จริงมาให้ แต่ระบบยังไม่ได้อ่าน)",
        }
      : { level: "ok", title: "บันทึก IP ได้ปกติ", detail: "ใช้ตรวจสอบย้อนหลังและกันการส่งซ้ำได้" },
    {
      level: "ok",
      title: "การนับผู้เข้าชมเคารพความยินยอมแล้ว",
      detail: `ผู้ที่ไม่ยินยอมคุกกี้วิเคราะห์ถูกนับแบบไม่เก็บ IP และข้อมูลอุปกรณ์ · 30 วันล่าสุด ${fmt(s.anonVisits30)} จาก ${fmt(s.visits30)} ครั้ง (${pct(s.anonVisits30 / Math.max(1, s.visits30))}) เป็นแบบไม่ระบุตัวตน (ข้อมูลก่อนวันปรับระบบยังเป็นแบบเดิม)`,
    },
    {
      level: "ok",
      title: "เอาหมวดคุกกี้การตลาดออกแล้ว",
      detail: "แบนเนอร์และนโยบายคุกกี้เหลือเฉพาะหมวดที่ใช้จริง (จำเป็น · วิเคราะห์ · ตั้งค่า) บันทึกเก่าที่เคยเลือกหมวดนี้ยังแสดงไว้เป็นหลักฐาน",
    },
    {
      level: "ok",
      title: `ลบข้อมูลเกิน ${RETENTION_YEARS} ปีอัตโนมัติ`,
      detail: `ประวัติการเข้าชมและบันทึกความยินยอมที่เกิน ${RETENTION_YEARS} ปีถูกลบวันละครั้ง และระบุระยะเวลานี้ในหน้านโยบายคุกกี้แล้ว`,
    },  ];

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Cookie size={22} /></span>
          <div>
            <h1 className={css.title}>ความยินยอมการใช้คุกกี้</h1>
            <p className={css.subtitle}>
              สถิติการตัดสินใจของผู้เข้าชม และหลักฐานความยินยอมตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)
              {s.since && ` · เริ่มเก็บ ${new Date(s.since).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
            </p>
          </div>
        </div>
        <a href="/cookie-policy" target="_blank" rel="noopener noreferrer" className={css.headLink}>
          <ExternalLink size={15} /> นโยบายคุกกี้
        </a>
      </header>

      {/* ── ตัวเลขหลัก ── */}
      <section className={css.kpis}>
        <div className={css.kpi}>
          <span className={css.kpiLabel}>ผู้เข้าชมที่ตัดสินใจแล้ว</span>
          <span className={css.kpiValue}>{fmt(s.total)}</span>
          <span className={css.kpiFoot}>เปลี่ยนใจภายหลัง {fmt(s.changed)} ราย</span>
        </div>
        <div className={`${css.kpi} ${css.kpiAccent}`}>
          <span className={css.kpiLabel}>อัตราการยอมรับ</span>
          <span className={css.kpiValue}>{pct(s.acceptRate)}</span>
          <span className={css.kpiFoot}>ยอมรับ {fmt(s.accepted)} ราย</span>
        </div>
        <div className={css.kpi}>
          <span className={css.kpiLabel}>เลือกเฉพาะที่จำเป็น</span>
          <span className={css.kpiValue}>{fmt(s.rejected)}</span>
          <span className={css.kpiFoot}>{pct(s.rejected / Math.max(1, s.total))} ของทั้งหมด</span>
        </div>
        <div className={css.kpi}>
          <span className={css.kpiLabel}>กดตั้งค่าเลือกเอง</span>
          <span className={css.kpiValue}>{fmt(s.choices.custom)}</span>
          <span className={css.kpiFoot}>{pct(s.choices.custom / choiceTotal)} ของทั้งหมด · ใช้หน้าตั้งค่าคุกกี้</span>
        </div>
      </section>

      <section className={css.row}>
        {/* กราฟรายเดือน */}
        <div className={css.card}>
          <h2 className={css.cardTitle}>การตัดสินใจรายเดือน</h2>
          <MonthlyChart data={s.monthly} />
        </div>

        <div className={css.stack}>
          {/* รูปแบบการตัดสินใจ */}
          <div className={css.card}>
            <h2 className={css.cardTitle}>ผู้เข้าชมเลือกอย่างไร</h2>
            <div className={css.split} role="img" aria-label="สัดส่วนรูปแบบการตัดสินใจ">
              {(Object.keys(CHOICE) as Choice[]).map((k) =>
                s.choices[k] > 0 ? (
                  <span key={k} className={CHOICE[k].tone} style={{ flexGrow: s.choices[k] }} title={`${CHOICE[k].label} ${fmt(s.choices[k])}`} />
                ) : null
              )}
            </div>
            <ul className={css.choiceList}>
              {(Object.keys(CHOICE) as Choice[]).map((k) => (
                <li key={k}>
                  <i className={`${css.dot} ${CHOICE[k].tone}`} />
                  <span>{CHOICE[k].label}</span>
                  <strong>{fmt(s.choices[k])}</strong>
                  <em>{pct(s.choices[k] / choiceTotal)}</em>
                </li>
              ))}
            </ul>
          </div>

          {/* แยกตามอุปกรณ์ */}
          <div className={css.card}>
            <h2 className={css.cardTitle}>อัตรายอมรับตามอุปกรณ์</h2>
            {(["mobile", "desktop"] as const).map((k) => (
              <div key={k} className={css.devRow}>
                <span className={css.devLabel}>
                  {k === "mobile" ? <Smartphone size={15} /> : <Monitor size={15} />}
                  {k === "mobile" ? "มือถือ/แท็บเล็ต" : "คอมพิวเตอร์"}
                  <small>{fmt(s.device[k].total)} ราย</small>
                </span>
                <span className={css.devBar}><span style={{ width: pct(devRate(k)) }} /></span>
                <strong>{pct(devRate(k))}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ข้อควรปรับปรุง ── */}
      <section className={css.card}>
        <h2 className={css.cardTitle}><ShieldCheck size={18} /> ตรวจสอบตาม PDPA — สิ่งที่ควรปรับปรุง</h2>
        <ul className={css.checks}>
          {checks.map((c) => (
            <li key={c.title} className={css[`check_${c.level}`]}>
              <span className={css.checkIcon}>
                {c.level === "warn" ? <AlertTriangle size={17} /> : c.level === "ok" ? <CheckCircle2 size={17} /> : <Info size={17} />}
              </span>
              <span className={css.checkText}>
                <strong>{c.title}</strong>
                <span>{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── บันทึกความยินยอม ── */}
      <section className={css.card}>
        <div className={css.tableHead}>
          <div>
            <h2 className={css.cardTitle}>บันทึกความยินยอม</h2>
            <p className={css.cardHint}>
              ใช้เป็นหลักฐานเมื่อถูกตรวจสอบ และค้นหาด้วยรหัสผู้เข้าชมเมื่อเจ้าของข้อมูลขอดูหรือลบข้อมูลของตน · IP แสดงแบบปิดบางส่วน
            </p>
          </div>
          <div className={css.filters}>
            <label className={css.search}>
              <Search size={16} />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="รหัสผู้เข้าชม" aria-label="ค้นหารหัสผู้เข้าชม" />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput("")} aria-label="ล้าง"><X size={14} /></button>
              )}
            </label>
            <div className={css.seg} role="group" aria-label="กรองสถานะ">
              {([["", "ทั้งหมด"], ["accepted", "ยอมรับ"], ["rejected", "จำเป็นเท่านั้น"]] as const).map(([k, label]) => (
                <button key={k} type="button" aria-pressed={status === k} className={status === k ? css.segOn : ""} onClick={() => { setStatus(k); setPage(1); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data.records.length === 0 ? (
          <div className={css.state}>ไม่พบบันทึก</div>
        ) : (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>รหัสผู้เข้าชม</th>
                  <th>การตัดสินใจ</th>
                  <th>หมวดที่อนุญาต</th>
                  <th>อุปกรณ์</th>
                  <th>IP</th>
                  <th>ตัดสินใจล่าสุด</th>
                  <th aria-label="จัดการ" />
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td><code className={css.code} title={r.userId}>{r.userId.slice(0, 8)}…</code></td>
                    <td><span className={`${css.pill} ${CHOICE[r.choice].tone}`}>{CHOICE[r.choice].label}</span></td>
                    <td className={css.cats}>
                      {r.cookieCategories?.analytics && <span>วิเคราะห์</span>}
                      {r.cookieCategories?.preferences && <span>ตั้งค่า</span>}
                      {r.cookieCategories?.marketing && <span>การตลาด</span>}
                      {r.choice === "none" && <em>—</em>}
                    </td>
                    <td>{r.device === "mobile" ? <Smartphone size={15} aria-label="มือถือ" /> : <Monitor size={15} aria-label="คอมพิวเตอร์" />}</td>
                    <td className={css.muted}>{r.ip}</td>
                    <td className={css.muted}>
                      {thaiDate(r.updatedAt)}
                      {new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60000 && <small className={css.changedTag}>เปลี่ยนใจ</small>}
                    </td>
                    <td>
                      <button type="button" className={css.del} onClick={() => remove(r)} title="ลบบันทึก (ตามคำขอเจ้าของข้อมูล)">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={css.pager}>
          <span>{fmt(data.recordTotal)} รายการ · หน้า {data.page}/{data.totalPages}</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="หน้าก่อน"><ChevronLeft size={16} /></button>
            <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="หน้าถัดไป"><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {toast && <div className={css.toast} role="status">{toast}</div>}
    </div>
  );
}
