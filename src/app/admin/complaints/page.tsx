"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Inbox,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquareWarning,
  Phone,
  Printer,
  Save,
  Search,
  SearchCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { decodeEntities } from "@/lib/decodeEntities";
import { useContactData } from "@/lib/contactInfo";
import { printComplaintForm } from "./printForm";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
interface ComplaintRecord {
  id: number;
  trackingCode: string;
  memberId: string | null;
  name: string | null;
  tel: string | null;
  email: string | null;
  category: string;
  subject: string | null;
  complaint: string | null;
  status: Status;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type Status = "pending" | "reviewing" | "resolved" | "rejected";
type Filter = "open" | "" | Status;
type Counts = { all: number; open: number; pending: number; reviewing: number; resolved: number; rejected: number };

const CATEGORY: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  complaint: { label: "ร้องเรียน", icon: MessageSquareWarning, tone: css.catComplaint },
  suggestion: { label: "ข้อเสนอแนะ", icon: Lightbulb, tone: css.catSuggestion },
  inquiry: { label: "สอบถาม", icon: HelpCircle, tone: css.catInquiry },
};

const STATUS: Record<Status, { label: string; tone: string }> = {
  pending: { label: "รอดำเนินการ", tone: css.stPending },
  reviewing: { label: "กำลังตรวจสอบ", tone: css.stReviewing },
  resolved: { label: "เสร็จสิ้น", tone: css.stResolved },
  rejected: { label: "ไม่รับพิจารณา", tone: css.stRejected },
};

const FILTERS: { key: Filter; label: string; count: keyof Counts }[] = [
  { key: "open", label: "ต้องดำเนินการ", count: "open" },
  { key: "", label: "ทั้งหมด", count: "all" },
  { key: "resolved", label: "เสร็จสิ้น", count: "resolved" },
  { key: "rejected", label: "ไม่รับพิจารณา", count: "rejected" },
];

/** ข้อความถึงผู้แจ้งแบบสำเร็จรูป — ผู้แจ้งเห็นข้อความนี้ในหน้าติดตามสถานะ */
const NOTE_TEMPLATES = [
  {
    label: "รับเรื่องแล้ว",
    text: "สหกรณ์ได้รับเรื่องของท่านแล้ว และอยู่ระหว่างตรวจสอบข้อเท็จจริงกับฝ่ายที่เกี่ยวข้อง จะแจ้งผลให้ทราบโดยเร็วค่ะ",
  },
  {
    label: "ขอบคุณข้อเสนอแนะ",
    text: "สหกรณ์ขอขอบคุณสำหรับข้อเสนอแนะ และจะนำไปพิจารณาปรับปรุงการให้บริการต่อไปค่ะ",
  },
  {
    label: "ขอข้อมูลเพิ่ม",
    text: "เพื่อให้ตรวจสอบได้ถูกต้อง รบกวนติดต่อสหกรณ์ในเวลาทำการ พร้อมแจ้งรหัสติดตามเรื่องนี้ค่ะ",
  },
];

const PAGE_SIZE = 30;
const OVERDUE_DAYS = 7;

/* ═════════ ตัวช่วย ═════════ */
const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const isOpen = (s: Status) => s === "pending" || s === "reviewing";

/** ข้อความในฐานข้อมูลถูกเข้ารหัสอักขระพิเศษไว้ (กัน XSS) — ถอดกลับก่อนแสดง */
function decodeRecord(c: ComplaintRecord): ComplaintRecord {
  return {
    ...c,
    memberId: c.memberId && decodeEntities(c.memberId),
    name: c.name && decodeEntities(c.name),
    tel: c.tel && decodeEntities(c.tel),
    email: c.email && decodeEntities(c.email),
    subject: c.subject && decodeEntities(c.subject),
    complaint: c.complaint && decodeEntities(c.complaint),
    adminNote: c.adminNote && decodeEntities(c.adminNote),
  };
}

/* ═════════ หน้า ═════════ */
export default function AdminComplaintsPage() {
  // ที่อยู่/เบอร์ของสหกรณ์ และรายชื่อฝ่าย สำหรับหัวกระดาษและช่องมอบหมายในแบบฟอร์มพิมพ์
  const contact = useContactData();
  const [filter, setFilter] = useState<Filter>("open");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);
  const [list, setList] = useState<{ key: string; items: ComplaintRecord[]; page: number; totalPages: number; total: number } | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const viewKey = `${filter}|${search}`;
  const listLoading = !list || !list.key.startsWith(`${viewKey}|`);
  const items = useMemo(() => (list?.items ?? []).map(decodeRecord), [list]);
  const selected = items.find((c) => c.id === selectedId) ?? null;
  const noteDirty = selected !== null && note !== (selected.adminNote ?? "");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const key = `${viewKey}|${tick}`;
    (async () => {
      try {
        const params = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE) });
        if (filter) params.set("status", filter);
        if (search) params.set("search", search);
        const data = await (await fetch(`/api/admin/complaints?${params}`)).json();
        if (cancelled) return;
        setList({ key, items: data.complaints ?? [], page: 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
        if (data.counts) setCounts(data.counts);
      } catch {
        if (!cancelled) setList({ key, items: [], page: 1, totalPages: 1, total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, search, viewKey, tick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadMore = async () => {
    if (!list || list.page >= list.totalPages) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(list.page + 1), limit: String(PAGE_SIZE) });
      if (filter) params.set("status", filter);
      if (search) params.set("search", search);
      const data = await (await fetch(`/api/admin/complaints?${params}`)).json();
      setList((prev) => (prev ? { ...prev, items: [...prev.items, ...(data.complaints ?? [])], page: prev.page + 1 } : prev));
    } finally {
      setLoadingMore(false);
    }
  };

  const select = (c: ComplaintRecord) => {
    if (noteDirty && !window.confirm("ข้อความถึงผู้แจ้งยังไม่ได้บันทึก ต้องการทิ้งการแก้ไขหรือไม่?")) return;
    setSelectedId(c.id);
    setNote(c.adminNote ?? "");
  };

  const save = async (status?: Status) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...(status ? { status } : {}), adminNote: note.trim() }),
      });
      if (!res.ok) throw new Error();
      const { complaint } = await res.json();
      // อัปเดตรายการทันที ไม่ต้องรอโหลดใหม่ (รายการอาจหลุดตัวกรองเมื่อเปลี่ยนสถานะ — ให้คงไว้จนกว่าจะเปลี่ยนแท็บ)
      setList((prev) => (prev ? { ...prev, items: prev.items.map((c) => (c.id === complaint.id ? complaint : c)) } : prev));
      setNote(decodeEntities(complaint.adminNote ?? ""));
      setToast({ ok: true, text: status ? `เปลี่ยนสถานะเป็น “${STATUS[status].label}” แล้ว` : "บันทึกข้อความแล้ว" });
      if (status) {
        const fresh = await (await fetch(`/api/admin/complaints?page=1&limit=1${search ? `&search=${encodeURIComponent(search)}` : ""}`)).json();
        if (fresh.counts) setCounts(fresh.counts);
      }
    } catch {
      setToast({ ok: false, text: "บันทึกไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`ลบเรื่อง ${selected.trackingCode} ถาวรใช่หรือไม่?\nผู้แจ้งจะติดตามสถานะเรื่องนี้ไม่ได้อีก`)) return;
    try {
      const res = await fetch(`/api/admin/complaints?id=${selected.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ ok: true, text: "ลบเรื่องแล้ว" });
      setSelectedId(null);
      setTick((n) => n + 1);
    } catch {
      setToast({ ok: false, text: "ลบไม่สำเร็จ" });
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ ok: true, text: `คัดลอก ${code} แล้ว` });
    } catch { /* ไม่รองรับ — ข้าม */ }
  };

  /** ส่งออก CSV ตามตัวกรองปัจจุบันทั้งหมด (ไม่ใช่แค่ที่โหลดมาในหน้าจอ) */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const all: ComplaintRecord[] = [];
      for (let page = 1; page <= 50; page++) {
        const params = new URLSearchParams({ page: String(page), limit: "100" });
        if (filter) params.set("status", filter);
        if (search) params.set("search", search);
        const data = await (await fetch(`/api/admin/complaints?${params}`)).json();
        all.push(...(data.complaints ?? []).map(decodeRecord));
        if (page >= (data.totalPages ?? 1)) break;
      }
      const q = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
      const header = ["รหัสติดตาม", "ประเภท", "เรื่อง", "ชื่อผู้แจ้ง", "เลขสมาชิก", "เบอร์โทร", "อีเมล", "สถานะ", "รายละเอียด", "ข้อความถึงผู้แจ้ง", "วันที่แจ้ง", "วันที่ปิดเรื่อง"];
      const rows = all.map((c) =>
        [
          c.trackingCode,
          CATEGORY[c.category]?.label ?? c.category,
          q(c.subject),
          q(c.name || "ผู้ไม่ประสงค์ออกนาม"),
          q(c.memberId),
          q(c.tel),
          q(c.email),
          STATUS[c.status]?.label ?? c.status,
          q(c.complaint),
          q(c.adminNote),
          shortDate(c.createdAt),
          c.resolvedAt ? shortDate(c.resolvedAt) : "",
        ].join(",")
      );
      const blob = new Blob(["﻿" + header.join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `complaints_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ ok: false, text: "ส่งออกไม่สำเร็จ" });
    } finally {
      setExporting(false);
    }
  };

  /* ── ลำดับสถานะ (แสดงเป็นเส้นเวลา) ── */
  const steps = (c: ComplaintRecord) => {
    const reached = { pending: true, reviewing: c.status !== "pending", closed: !isOpen(c.status) };
    return [
      { key: "pending", label: "รับเรื่อง", at: c.createdAt, done: reached.pending },
      { key: "reviewing", label: "ตรวจสอบ", at: null, done: reached.reviewing },
      {
        key: "closed",
        label: c.status === "rejected" ? "ไม่รับพิจารณา" : "เสร็จสิ้น",
        at: c.resolvedAt,
        done: reached.closed,
        rejected: c.status === "rejected",
      },
    ];
  };

  const emptyText = search
    ? `ไม่พบเรื่องที่ตรงกับ “${search}”`
    : filter === "open"
      ? "ไม่มีเรื่องค้างดำเนินการ"
      : "ไม่มีเรื่องในหมวดนี้";

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}>
            <MessageSquareWarning size={22} />
          </span>
          <div>
            <h1 className={css.title}>ร้องเรียน / ข้อเสนอแนะ</h1>
            <p className={css.subtitle}>เรื่องที่ยังไม่ปิดเรียงจากรับเรื่องนานที่สุด · ข้อความถึงผู้แจ้งจะแสดงในหน้าติดตามสถานะ</p>
          </div>
        </div>
        <div className={css.headStats}>
          {(
            [
              ["pending", "รอดำเนินการ"],
              ["reviewing", "กำลังตรวจสอบ"],
              ["resolved", "เสร็จสิ้น"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className={`${css.stat} ${k === "pending" && counts && counts.pending > 0 ? css.statAlert : ""}`}>
              <span className={css.statValue}>{counts?.[k] ?? "–"}</span>
              <span className={css.statLabel}>{label}</span>
            </div>
          ))}
          <button type="button" className={css.headBtn} onClick={exportCsv} disabled={exporting}>
            {exporting ? <Loader2 size={15} className={css.spin} /> : <Download size={15} />} ส่งออก CSV
          </button>
        </div>
      </header>

      <div className={`${css.workspace} ${selected ? css.workspaceOpen : ""}`}>
        {/* ═════════ รายการ ═════════ */}
        <aside className={css.inbox}>
          <div className={css.inboxTop}>
            <label className={css.search}>
              <Search size={17} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ค้นหารหัสติดตาม ชื่อ เรื่อง เบอร์โทร"
                aria-label="ค้นหาเรื่อง"
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput("")} aria-label="ล้างคำค้นหา">
                  <X size={15} />
                </button>
              )}
            </label>
            <div className={css.tabs} role="tablist" aria-label="กรองเรื่อง">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`${css.tab} ${filter === f.key ? css.tabActive : ""} ${f.key === "open" ? css.tabOpen : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  {counts && <span className={css.tabCount}>{counts[f.count]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className={css.inboxList}>
            {listLoading ? (
              <div className={css.listState}>
                <Loader2 size={20} className={css.spin} /> กำลังโหลด…
              </div>
            ) : items.length === 0 ? (
              <div className={css.listState}>
                {filter === "open" && !search ? <CheckCircle2 size={30} /> : <Inbox size={30} />}
                <p>{emptyText}</p>
                {filter !== "" && (
                  <button type="button" className={css.linkBtn} onClick={() => setFilter("")}>
                    ดูเรื่องทั้งหมด
                  </button>
                )}
              </div>
            ) : (
              <>
                <ul className={css.items}>
                  {items.map((c) => {
                    const cat = CATEGORY[c.category] ?? CATEGORY.inquiry;
                    const CatIcon = cat.icon;
                    const age = daysSince(c.createdAt);
                    const overdue = isOpen(c.status) && age >= OVERDUE_DAYS;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className={`${css.item} ${c.id === selectedId ? css.itemActive : ""}`}
                          onClick={() => select(c)}
                        >
                          <span className={`${css.catIcon} ${cat.tone}`}>
                            <CatIcon size={17} />
                          </span>
                          <span className={css.itemMain}>
                            <span className={css.itemTop}>
                              <span className={css.itemTitle}>{c.subject || "(ไม่มีหัวข้อ)"}</span>
                              <span className={css.itemTime}>{shortDate(c.createdAt)}</span>
                            </span>
                            <span className={css.itemMeta}>
                              <span className={css.code}>{c.trackingCode}</span>
                              <span>{c.name || "ผู้ไม่ประสงค์ออกนาม"}</span>
                            </span>
                            <span className={css.itemMeta}>
                              <span className={`${css.status} ${STATUS[c.status]?.tone ?? ""}`}>{STATUS[c.status]?.label ?? c.status}</span>
                              {overdue && <span className={css.overdue}><Clock3 size={11} /> {age} วัน</span>}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {list && list.page < list.totalPages && (
                  <button type="button" className={css.moreBtn} onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2 size={16} className={css.spin} />}
                    แสดงเพิ่ม ({list.total - items.length} เรื่อง)
                  </button>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ═════════ รายละเอียด ═════════ */}
        <section className={css.detail}>
          {!selected ? (
            <div className={css.detailEmpty}>
              <MessageSquareWarning size={44} />
              <h2>เลือกเรื่องจากรายการด้านซ้าย</h2>
              <p>แท็บ “ต้องดำเนินการ” เรียงเรื่องที่รอนานที่สุดไว้บนสุด</p>
            </div>
          ) : (
            (() => {
              const cat = CATEGORY[selected.category] ?? CATEGORY.inquiry;
              const CatIcon = cat.icon;
              const open = isOpen(selected.status);
              const age = daysSince(selected.createdAt);
              return (
                <>
                  <div className={css.detailHead}>
                    <button type="button" className={css.backBtn} onClick={() => setSelectedId(null)} aria-label="กลับไปรายการ">
                      <ArrowLeft size={18} />
                    </button>
                    <div className={css.detailTitleWrap}>
                      <div className={css.detailBadges}>
                        <span className={`${css.catPill} ${cat.tone}`}>
                          <CatIcon size={13} /> {cat.label}
                        </span>
                        <span className={`${css.status} ${STATUS[selected.status]?.tone ?? ""}`}>{STATUS[selected.status]?.label}</span>
                        <button type="button" className={css.codeBtn} onClick={() => copyCode(selected.trackingCode)} title="คัดลอกรหัสติดตาม">
                          {selected.trackingCode} <Copy size={12} />
                        </button>
                      </div>
                      <h2 className={css.detailTitle}>{selected.subject || "(ไม่มีหัวข้อ)"}</h2>
                      <span className={css.detailMeta}>
                        รับเรื่อง {fullDate(selected.createdAt)}
                        {open && <> · <strong className={age >= OVERDUE_DAYS ? css.ageLate : ""}>ผ่านมา {age} วัน</strong></>}
                      </span>
                    </div>
                    <div className={css.tools}>
                      <a
                        href={`/complaints?code=${encodeURIComponent(selected.trackingCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={css.tool}
                        title="ดูหน้าติดตามสถานะที่ผู้แจ้งเห็น"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button type="button" className={css.tool} onClick={() => printComplaintForm(selected, contact.info, contact.departments.map((d) => d.name))} title="พิมพ์แบบฟอร์มรับเรื่อง">
                        <Printer size={16} />
                      </button>
                      <button type="button" className={`${css.tool} ${css.toolDanger}`} onClick={remove} title="ลบเรื่องนี้ถาวร">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={css.detailBody}>
                    {/* เส้นเวลาสถานะ */}
                    <ol className={css.steps}>
                      {steps(selected).map((s, i, arr) => (
                        <li
                          key={s.key}
                          className={`${css.step} ${s.done ? css.stepDone : ""} ${"rejected" in s && s.rejected ? css.stepRejected : ""} ${
                            s.done && (i === arr.length - 1 || !arr[i + 1].done) ? css.stepCurrent : ""
                          }`}
                        >
                          <span className={css.stepDot}>{s.done ? (("rejected" in s && s.rejected) ? <Ban size={13} /> : <CheckCircle2 size={13} />) : i + 1}</span>
                          <span className={css.stepLabel}>{s.label}</span>
                          {s.at && <span className={css.stepAt}>{shortDate(s.at)}</span>}
                        </li>
                      ))}
                    </ol>

                    {/* ผู้แจ้ง */}
                    <div className={css.person}>
                      <span className={css.personAvatar}>
                        <User size={18} />
                      </span>
                      <div className={css.personMain}>
                        <strong>{selected.name || "ผู้ไม่ประสงค์ออกนาม"}</strong>
                        <span>{selected.memberId ? `เลขสมาชิก ${selected.memberId}` : "ไม่ระบุเลขสมาชิก"}</span>
                      </div>
                      <div className={css.contactBtns}>
                        {selected.tel && (
                          <a href={`tel:${selected.tel.replace(/[^\d+]/g, "")}`} className={css.contactBtn}>
                            <Phone size={14} /> {selected.tel}
                          </a>
                        )}
                        {selected.email && (
                          <a href={`mailto:${selected.email}`} className={css.contactBtn}>
                            <Mail size={14} /> {selected.email}
                          </a>
                        )}
                        {!selected.tel && !selected.email && <span className={css.noContact}>ไม่ได้ให้ช่องทางติดต่อ</span>}
                      </div>
                    </div>

                    {/* เนื้อเรื่อง */}
                    <div className={css.message}>{selected.complaint || "ไม่มีรายละเอียดประกอบ"}</div>

                    {/* ข้อความถึงผู้แจ้ง */}
                    <div className={css.noteCard}>
                      <div className={css.noteHead}>
                        <label htmlFor="admin-note" className={css.noteLabel}>
                          ข้อความถึงผู้แจ้ง
                        </label>
                        <span className={css.noteVisible}>
                          <SearchCheck size={13} /> ผู้แจ้งเห็นข้อความนี้เมื่อติดตามสถานะด้วยรหัส
                        </span>
                      </div>
                      <div className={css.templates}>
                        {NOTE_TEMPLATES.map((t) => (
                          <button key={t.label} type="button" className={css.templateBtn} onClick={() => setNote(t.text)} title={t.text}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        id="admin-note"
                        className={css.noteInput}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder="แจ้งความคืบหน้าหรือผลการดำเนินการให้ผู้แจ้งทราบ…"
                      />
                      <div className={css.noteFoot}>
                        <span>{note.length}/2000</span>
                        {noteDirty && (
                          <button type="button" className={css.saveNote} onClick={() => save()} disabled={busy}>
                            <Save size={14} /> บันทึกข้อความ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* แถบเปลี่ยนสถานะ */}
                  <div className={css.actions}>
                    <span className={css.actionsLabel}>เปลี่ยนสถานะ{noteDirty ? " (พร้อมบันทึกข้อความ)" : ""}</span>
                    <div className={css.actionBtns}>
                      {selected.status !== "reviewing" && open && (
                        <button type="button" className={`${css.action} ${css.actionReview}`} onClick={() => save("reviewing")} disabled={busy}>
                          <SearchCheck size={16} /> รับเรื่อง / กำลังตรวจสอบ
                        </button>
                      )}
                      {open ? (
                        <>
                          <button type="button" className={`${css.action} ${css.actionReject}`} onClick={() => save("rejected")} disabled={busy}>
                            <Ban size={16} /> ไม่รับพิจารณา
                          </button>
                          <button
                            type="button"
                            className={`${css.action} ${css.actionDone}`}
                            onClick={() => {
                              if (!note.trim() && !window.confirm("ยังไม่มีข้อความถึงผู้แจ้ง ต้องการปิดเรื่องโดยไม่แจ้งผลหรือไม่?")) return;
                              save("resolved");
                            }}
                            disabled={busy}
                          >
                            {busy ? <Loader2 size={16} className={css.spin} /> : <CheckCircle2 size={16} />} ดำเนินการเสร็จสิ้น
                          </button>
                        </>
                      ) : (
                        <button type="button" className={`${css.action} ${css.actionReview}`} onClick={() => save("reviewing")} disabled={busy}>
                          เปิดเรื่องอีกครั้ง
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </section>
      </div>

      {toast && (
        <div className={`${css.toast} ${toast.ok ? css.toastOk : css.toastErr}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
