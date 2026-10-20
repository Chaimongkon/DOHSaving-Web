"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  BookPlus,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  ImagePlus,
  Loader2,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { App, Dropdown, type MenuProps } from "antd";
import { createPdfCoverFile } from "@/lib/pdfCover";
import { MAX_PDF_BYTES, formatBytes, isPdfFile, uploadAdminFile } from "@/lib/adminUpload";
import Book from "@/app/annual-reports/Book";
import base from "../regulations/page.module.css";
import own from "./page.module.css";

// รวมสองไฟล์แบบต่อชื่อคลาส — คลาสที่มีทั้งสองไฟล์ได้สไตล์จากทั้งคู่
const css: Record<string, string> = Object.fromEntries(
  [...new Set([...Object.keys(base), ...Object.keys(own)])].map((k) => [k, [base[k], own[k]].filter(Boolean).join(" ")])
);

/* ═════════ ชนิดข้อมูล ═════════ */
interface Report {
  id: number;
  year: number;
  title: string;
  coverUrl: string | null;
  fileUrl: string;
  legacyPath: string | null;
  description: string | null;
  isActive: boolean;
  reads12m?: number;
}

interface Draft {
  id?: number;
  year: number;
  title: string;
  titleTouched: boolean;
  fileUrl: string;
  fileLabel: string;
  coverUrl: string;
  description: string;
  legacyPath: string;
  isActive: boolean;
}

const standardTitle = (year: number) => `รายงานประจำปี ${year}`;
/** รายงานของปีไหนควรมีแล้ว — รายงานปี N ออกในปี N+1 (หลังปิดบัญชี/ประชุมใหญ่) */
const expectedLatestYear = () => new Date().getFullYear() + 543 - 1;
const fileNameOf = (url: string) => decodeURIComponent(url.split("/").pop() ?? url);

const blankDraft = (year: number): Draft => ({
  year,
  title: standardTitle(year),
  titleTouched: false,
  fileUrl: "",
  fileLabel: "",
  coverUrl: "",
  description: "",
  legacyPath: "",
  isActive: true,
});

/* ═════════ หน้า ═════════ */
export default function AdminAnnualReportsPage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<Report[] | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/admin/annual-reports", { credentials: "include" });
    if (!res.ok) throw new Error();
    return (await res.json()) as Report[];
  }, []);

  const load = useCallback(async () => {
    try {
      setItems(await fetchItems());
    } catch {
      message.error("โหลดรายการไม่สำเร็จ");
      setItems((prev) => prev ?? []);
    }
  }, [fetchItems, message]);

  useEffect(() => {
    let cancelled = false;
    fetchItems()
      .then((data) => !cancelled && setItems(data))
      .catch(() => {
        if (cancelled) return;
        message.error("โหลดรายการไม่สำเร็จ");
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchItems, message]);

  const all = useMemo(() => items ?? [], [items]);
  const totalReads = all.reduce((n, r) => n + (r.reads12m ?? 0), 0);
  const latestActive = all.find((r) => r.isActive);
  const latestYear = latestActive?.year ?? all[0]?.year;

  /* ── ชั้นหนังสือ: ทุกปีตั้งแต่ปีที่ควรมีล่าสุด ถึงปีเก่าสุด (ปีที่ขาดเป็นช่องว่าง) ── */
  const shelf = useMemo(() => {
    if (all.length === 0) return [] as ({ kind: "report"; report: Report } | { kind: "missing"; year: number })[];
    const years = all.map((r) => r.year);
    const top = Math.max(expectedLatestYear(), ...years);
    const bottom = Math.min(...years);
    const out: ({ kind: "report"; report: Report } | { kind: "missing"; year: number })[] = [];
    for (let y = top; y >= bottom; y--) {
      const reports = all.filter((r) => r.year === y);
      if (reports.length) reports.forEach((report) => out.push({ kind: "report", report }));
      else out.push({ kind: "missing", year: y });
    }
    return out;
  }, [all]);
  const missingYears = shelf.filter((s) => s.kind === "missing").map((s) => (s as { year: number }).year);

  /* ── คำสั่งต่อเล่ม ── */
  const setBusy = (id: number, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleActive = async (r: Report) => {
    const next = !r.isActive;
    setBusy(r.id, true);
    setItems((prev) => prev?.map((i) => (i.id === r.id ? { ...i, isActive: next } : i)) ?? prev);
    try {
      const res = await fetch("/api/admin/annual-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: r.id, isActive: next }),
      });
      if (!res.ok) throw new Error();
      message.success(next ? "แสดงบนหน้าเว็บแล้ว" : "ซ่อนจากหน้าเว็บแล้ว");
    } catch {
      setItems((prev) => prev?.map((i) => (i.id === r.id ? { ...i, isActive: !next } : i)) ?? prev);
      message.error("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(r.id, false);
    }
  };

  const remove = async (r: Report) => {
    setBusy(r.id, true);
    try {
      const res = await fetch(`/api/admin/annual-reports?id=${r.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev?.filter((i) => i.id !== r.id) ?? prev);
      message.success("ลบรายงานแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    } finally {
      setBusy(r.id, false);
    }
  };

  const confirmDelete = (r: Report) =>
    modal.confirm({
      title: `ลบ${r.title}ถาวร?`,
      content: "eBook เล่มนี้จะหายจากหน้าเว็บและกู้คืนไม่ได้ — ถ้าแค่ไม่อยากให้สมาชิกเห็นชั่วคราว ใช้ “ซ่อนจากหน้าเว็บ” แทน",
      okText: "ลบถาวร",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: () => remove(r),
    });

  const menuOf = (r: Report): MenuProps => ({
    items: [
      { key: "ebook", icon: <BookOpen size={15} />, label: "เปิดอ่านแบบ eBook" },
      { key: "pdf", icon: <ExternalLink size={15} />, label: "เปิดไฟล์ PDF" },
      { key: "toggle", icon: r.isActive ? <EyeOff size={15} /> : <Eye size={15} />, label: r.isActive ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ" },
      { type: "divider" as const },
      { key: "delete", icon: <Trash2 size={15} />, label: "ลบถาวร…", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "ebook") window.open(`/annual-reports/${r.id}`, "_blank", "noopener");
      if (key === "pdf") window.open(r.fileUrl, "_blank", "noopener");
      if (key === "toggle") toggleActive(r);
      if (key === "delete") confirmDelete(r);
    },
  });

  /* ── ตัวแก้ไข ── */
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [editorSeq, setEditorSeq] = useState(0);
  const setDraft = (next: Draft | null) => {
    setDraftState(next);
    if (next) setEditorSeq((n) => n + 1);
  };
  const nextYear = () => {
    if (missingYears.length) return missingYears[0];
    return Math.max(expectedLatestYear(), ...all.map((r) => r.year + 1));
  };
  const openNew = (year = nextYear()) => setDraft(blankDraft(year));
  const openEdit = (r: Report) =>
    setDraft({
      id: r.id,
      year: r.year,
      title: r.title,
      titleTouched: r.title !== standardTitle(r.year),
      fileUrl: r.fileUrl,
      fileLabel: fileNameOf(r.fileUrl),
      coverUrl: r.coverUrl ?? "",
      description: r.description ?? "",
      legacyPath: r.legacyPath ?? "",
      isActive: r.isActive,
    });

  const loading = items === null;

  return (
    <div className={css.page}>
      {/* ── ตู้หนังสือ: หัวตู้ (ป้ายชื่อ + สรุป + ปุ่ม) → ชั้นวาง ── */}
      <section className={`${css.cabinet} ${css.oakCase}`} aria-labelledby="cabinet-title">
        <header className={css.crown}>
          <div className={css.plaque}>
            <span className={css.plaqueIcon}><BookOpen size={24} /></span>
            <div>
              <span className={css.plaqueKicker}>ตู้หนังสือ · eBook</span>
              <h1 id="cabinet-title" className={css.plaqueTitle}>รายงานประจำปี</h1>
            </div>
          </div>

          <dl className={css.crownStats}>
            <div>
              <dt>ทั้งหมด</dt>
              <dd>{loading ? "–" : all.length}<small>เล่ม</small></dd>
            </div>
            <div>
              <dt>ปีล่าสุด</dt>
              <dd>{latestYear ?? "–"}</dd>
            </div>
            <div>
              <dt>เปิดอ่าน 12 เดือน</dt>
              <dd>{loading ? "–" : totalReads.toLocaleString("th-TH")}<small>ครั้ง</small></dd>
            </div>
          </dl>

          <div className={css.crownBtns}>
            <a href="/annual-reports" target="_blank" rel="noopener noreferrer" className={css.crownGhost}>
              <ExternalLink size={16} /> ดูหน้าเว็บ
            </a>
            <button type="button" className={css.primaryBtn} onClick={() => openNew()}>
              <Plus size={18} /> เพิ่มรายงาน
            </button>
          </div>
        </header>

        {missingYears.length > 0 && (
          <div className={css.cabinetNote}>
            <AlertTriangle size={17} />
            <span>
              <strong>ยังไม่มีรายงานปี {missingYears.join(", ")}</strong> — ชั้นหนังสือบนเว็บจะขาดปีนี้ไป
            </span>
            <button type="button" onClick={() => openNew(missingYears[0])}>
              <BookPlus size={15} /> เพิ่มรายงานปี {missingYears[0]}
            </button>
          </div>
        )}

        <div className={css.interior}>
          {/* เงาสะท้อนกระจกหน้าตู้ (ไม่รับการคลิก) */}
          <span className={css.glass} aria-hidden="true" />
          {loading ? (
            <div className={css.interiorState}><Loader2 size={22} className={css.spin} /> กำลังจัดหนังสือขึ้นชั้น…</div>
          ) : all.length === 0 ? (
            <div className={css.emptyShelf}>
              <span><BookPlus size={32} /></span>
              <strong>ตู้ยังว่างอยู่</strong>
              <p>อัปโหลดไฟล์ PDF ระบบจะทำภาพปกและ eBook ให้อัตโนมัติ</p>
              <button type="button" className={css.primaryBtnSm} onClick={() => openNew()}>
                <Plus size={16} /> เพิ่มรายงานเล่มแรก
              </button>
            </div>
          ) : (
            <ul className={css.shelf}>
              {shelf.map((s) =>
                s.kind === "missing" ? (
                  <li key={`missing-${s.year}`} className={css.slot}>
                    <button type="button" className={css.missingSlot} onClick={() => openNew(s.year)} aria-label={`เพิ่มรายงานปี ${s.year}`}>
                      <span className={css.missingBook}>
                        <BookPlus size={28} />
                        <b>{s.year}</b>
                      </span>
                    </button>
                    <span className={css.plank} aria-hidden="true" />
                    <div className={css.bookInfo}>
                      <span className={`${css.yearBadge} ${css.yearBadgeEmpty}`}>พ.ศ. {s.year}</span>
                      <strong className={css.missingText}>ยังไม่มีรายงาน</strong>
                      <button type="button" className={css.addHere} onClick={() => openNew(s.year)}>
                        <Plus size={14} /> เพิ่มเล่มนี้
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={s.report.id} className={`${css.slot} ${s.report.isActive ? "" : css.slotHidden}`}>
                    <button type="button" className={css.bookBtn} onClick={() => openEdit(s.report)} aria-label={`แก้ไข${s.report.title}`}>
                      <Book year={s.report.year} title={s.report.title} coverUrl={s.report.coverUrl} fileUrl={s.report.fileUrl} className={css.shelfBook} />
                      {latestActive?.id === s.report.id && <span className={css.latestRibbon}>ล่าสุด</span>}
                      {!s.report.isActive && <span className={css.hiddenRibbon}><EyeOff size={12} /> ซ่อนอยู่</span>}
                    </button>
                    <span className={css.plank} aria-hidden="true" />
                    <div className={css.bookInfo}>
                      <span className={css.yearBadge}>พ.ศ. {s.report.year}</span>
                      <strong className={css.bookTitle}>{s.report.title}</strong>
                      <span className={css.bookMeta}>
                        <span className={s.report.isActive ? css.liveTag : css.offTag}>
                          {s.report.isActive ? <><i /> แสดงบนเว็บ</> : <><EyeOff size={12} /> ซ่อนอยู่</>}
                        </span>
                        <span className={css.reads} title="จำนวนครั้งที่เปิดหน้า eBook ใน 12 เดือนล่าสุด">
                          <BookOpen size={13} /> อ่าน <b>{(s.report.reads12m ?? 0).toLocaleString("th-TH")}</b> ครั้ง
                        </span>
                      </span>
                      <div className={css.bookActions}>
                        <button type="button" className={css.editBtn} onClick={() => openEdit(s.report)} disabled={busyIds.has(s.report.id)}>
                          <Pencil size={15} /> แก้ไข
                        </button>
                        <Dropdown menu={menuOf(s.report)} trigger={["click"]} placement="bottomRight">
                          <button type="button" className={css.moreBtn} aria-label={`คำสั่งเพิ่มเติมของ ${s.report.title}`} disabled={busyIds.has(s.report.id)}>
                            {busyIds.has(s.report.id) ? <Loader2 size={17} className={css.spin} /> : <MoreHorizontal size={18} />}
                          </button>
                        </Dropdown>
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
        <span className={css.plinth} aria-hidden="true" />
      </section>

      {draft && (
        <Editor
          key={editorSeq}
          initial={draft}
          all={all}
          missingYears={missingYears}
          onClose={() => setDraft(null)}
          onSaved={() => {
            load();
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}

/* ═════════ แผงเพิ่ม/แก้ไขรายงาน ═════════ */
function Editor({
  initial,
  all,
  missingYears,
  onClose,
  onSaved,
}: {
  initial: Draft;
  all: Report[];
  missingYears: number[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const isNew = !initial.id;
  const [d, setD] = useState<Draft>(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [more, setMore] = useState(Boolean(initial.description || initial.legacyPath));
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const busy = progress !== null || coverBusy;

  const close = useCallback(() => {
    if (dirty && !window.confirm("ยังไม่ได้บันทึก — ปิดโดยไม่บันทึกใช่ไหม?")) return;
    onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ปีเปลี่ยน → ชื่อมาตรฐานเปลี่ยนตาม (จนกว่าจะพิมพ์ชื่อเอง) */
  const setYear = (year: number) =>
    setD((prev) => ({ ...prev, year, title: prev.titleTouched ? prev.title : standardTitle(year) }));

  /* ภาพปกจากหน้าแรกของ PDF */
  const makeCover = async (src: string | ArrayBuffer, silent = false) => {
    setCoverBusy(true);
    try {
      const url = await uploadAdminFile(await createPdfCoverFile(src), "annual-reports");
      setD((prev) => ({ ...prev, coverUrl: url }));
    } catch {
      if (!silent) message.error("สร้างภาพปกไม่สำเร็จ");
    } finally {
      setCoverBusy(false);
    }
  };

  const pickPdf = async (file: File | undefined) => {
    if (!file) return;
    setFileError("");
    if (!isPdfFile(file)) {
      setFileError("รองรับเฉพาะไฟล์ PDF");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setFileError("ไฟล์ใหญ่เกิน 100 MB");
      return;
    }
    const keepCover = Boolean(d.coverUrl) && !isNew;
    setD((prev) => ({ ...prev, fileLabel: file.name, fileUrl: "", coverUrl: keepCover ? prev.coverUrl : "" }));
    setFileSize(file.size);
    setProgress(0);
    const buffer = file.arrayBuffer();
    try {
      const url = await uploadAdminFile(file, "annual-reports", setProgress);
      setD((prev) => ({ ...prev, fileUrl: url }));
      setProgress(null);
      // ไฟล์ใหม่ → ทำปกจากหน้าแรกให้เลย (ยกเว้นแก้ไขเล่มที่ตั้งปกเองไว้แล้ว)
      if (!keepCover) await makeCover(await buffer, true);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      setD((prev) => ({ ...prev, fileLabel: initial.fileLabel, fileUrl: initial.fileUrl, coverUrl: initial.coverUrl }));
      setProgress(null);
    }
  };

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("รองรับเฉพาะไฟล์รูปภาพ");
      return;
    }
    setCoverBusy(true);
    try {
      set("coverUrl", await uploadAdminFile(file, "annual-reports"));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "อัปโหลดภาพปกไม่สำเร็จ");
    } finally {
      setCoverBusy(false);
    }
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const sameYear = all.filter((r) => r.year === d.year && r.id !== d.id);
  const yearOk = Number.isInteger(d.year) && d.year >= 2500 && d.year <= 2700;
  const nonStandard = d.title.trim() !== "" && !d.title.includes("รายงานประจำปี");
  const problems = {
    file: !d.fileUrl ? (progress !== null ? "รออัปโหลดไฟล์ให้เสร็จก่อน" : "เลือกไฟล์ PDF") : "",
    year: !yearOk ? "ใส่ปี พ.ศ. 4 หลัก เช่น 2568" : "",
    title: !d.title.trim() ? "ใส่ชื่อรายงาน" : "",
  };
  const blocked = Boolean(problems.file || problems.year || problems.title);

  const save = async () => {
    setTriedSave(true);
    if (blocked) return;
    setSaving(true);
    try {
      const payload = {
        year: d.year,
        title: d.title.trim(),
        fileUrl: d.fileUrl,
        coverUrl: d.coverUrl,
        description: d.description,
        legacyPath: d.legacyPath,
        isActive: d.isActive,
      };
      const res = await fetch("/api/admin/annual-reports", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isNew ? payload : { ...payload, id: d.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
      message.success(isNew ? `เพิ่ม${d.title.trim()}แล้ว` : "บันทึกการแก้ไขแล้ว");
      onSaved();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={panel} className={`${css.drawer} ${css.wideDrawer}`} role="dialog" aria-modal="true" aria-labelledby="ar-editor-title" tabIndex={-1}>
        <header className={css.drawerHead}>
          <div>
            <h2 id="ar-editor-title">{isNew ? "เพิ่มรายงานประจำปี" : "แก้ไขรายงานประจำปี"}</h2>
            <p>{isNew ? "อัปโหลด PDF → ตรวจปีและชื่อ → บันทึก (ภาพปกและ eBook ทำให้อัตโนมัติ)" : d.title}</p>
          </div>
          <button type="button" className={css.closeBtn} onClick={close} aria-label="ปิด">
            <X size={20} />
          </button>
        </header>

        <div className={`${css.drawerBody} ${css.editorGrid}`}>
          {/* ── ตัวอย่างหนังสือ ── */}
          <aside className={css.previewCol}>
            <div className={css.previewStage}>
              {d.fileUrl || d.coverUrl ? (
                <Book key={`${d.coverUrl}|${d.fileUrl}`} year={d.year} title={d.title} coverUrl={d.coverUrl || null} fileUrl={d.fileUrl} className={css.previewBook} />
              ) : (
                <div className={css.previewEmpty}>
                  <BookOpen size={34} />
                  <span>ภาพปกจะแสดงที่นี่</span>
                </div>
              )}
              {coverBusy && (
                <span className={css.coverBusy}><Loader2 size={14} className={css.spin} /> กำลังทำภาพปก…</span>
              )}
            </div>
            <div className={css.coverBtns}>
              <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ""; }} />
              <button type="button" className={css.ghostBtn} onClick={() => coverInput.current?.click()} disabled={busy}>
                <ImagePlus size={14} /> ใช้ภาพปกของตัวเอง
              </button>
              {d.fileUrl && (
                <button type="button" className={css.ghostBtn} onClick={() => makeCover(d.fileUrl)} disabled={busy}>
                  <RefreshCw size={14} /> ใช้หน้าแรกของ PDF
                </button>
              )}
            </div>
            <p className={css.previewNote}>ตัวอย่างแบบที่สมาชิกเห็นบนชั้นหนังสือ</p>
          </aside>

          <div className={css.formCol}>
            {/* 1. ไฟล์ */}
            <section className={css.step}>
              <h3><span>1</span> ไฟล์รายงาน (PDF) {!isNew && <small>ลากไฟล์ใหม่มาวางเพื่อแทนฉบับเดิม</small>}</h3>
              <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pickPdf(e.target.files?.[0]); e.target.value = ""; }} />
              {d.fileLabel ? (
                <div
                  className={`${css.fileRow} ${dragOver ? css.dropOver : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); pickPdf(e.dataTransfer.files?.[0]); }}
                >
                  <FileText size={22} className={css.fileIcon} />
                  <div className={css.fileInfo}>
                    <strong title={d.fileLabel}>{d.fileLabel}</strong>
                    {progress !== null ? (
                      <>
                        <span className={css.progress}><span style={{ width: `${Math.round(progress * 100)}%` }} /></span>
                        <small>กำลังอัปโหลด {Math.round(progress * 100)}% — ไฟล์รายงานมักใหญ่ อาจใช้เวลาสักครู่</small>
                      </>
                    ) : (
                      <small className={css.ok}>
                        <CheckCircle2 size={14} /> อัปโหลดแล้ว{fileSize ? ` · ${formatBytes(fileSize)}` : ""}
                      </small>
                    )}
                  </div>
                  <div className={css.fileBtns}>
                    {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"><Eye size={14} /> เปิดดู</a>}
                    <button type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
                      <Upload size={14} /> เปลี่ยนไฟล์
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${css.drop} ${dragOver ? css.dropOver : ""} ${triedSave && problems.file ? css.invalid : ""}`}
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); pickPdf(e.dataTransfer.files?.[0]); }}
                >
                  <FileUp size={30} />
                  <strong>ลากไฟล์ PDF รายงานประจำปีมาวางที่นี่</strong>
                  <span>หรือคลิกเพื่อเลือกไฟล์ · ไม่เกิน 100 MB</span>
                </button>
              )}
              {fileError && <p className={css.error}>{fileError}</p>}
            </section>

            {/* 2. ปี */}
            <section className={css.step}>
              <h3><span>2</span> รายงานของปี พ.ศ.</h3>
              <div className={css.yearRow}>
                <button type="button" className={css.yearStep} onClick={() => setYear(d.year - 1)} aria-label="ปีก่อนหน้า"><Minus size={16} /></button>
                <input
                  className={`${css.yearInput} ${triedSave && problems.year ? css.invalid : ""}`}
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(d.year) ? "" : d.year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  aria-label="ปี พ.ศ."
                />
                <button type="button" className={css.yearStep} onClick={() => setYear(d.year + 1)} aria-label="ปีถัดไป"><Plus size={16} /></button>
                {isNew && missingYears.filter((y) => y !== d.year).slice(0, 3).map((y) => (
                  <button key={y} type="button" className={css.yearChip} onClick={() => setYear(y)}>
                    ปีที่ยังขาด {y}
                  </button>
                ))}
              </div>
              {triedSave && problems.year && <p className={css.error}>{problems.year}</p>}
              {yearOk && sameYear.length > 0 && (
                <p className={css.warn}>
                  <AlertTriangle size={14} /> มี “{sameYear[0].title}” ของปี {d.year} อยู่แล้ว — ถ้าเป็นฉบับแก้ไข แนะนำให้แก้เล่มเดิมแทนการเพิ่มใหม่
                </p>
              )}
            </section>

            {/* 3. ชื่อ */}
            <section className={css.step}>
              <h3><span>3</span> ชื่อรายงาน</h3>
              <input
                className={`${css.input} ${triedSave && problems.title ? css.invalid : ""}`}
                value={d.title}
                onChange={(e) => setD((prev) => ({ ...prev, title: e.target.value, titleTouched: true }))}
                placeholder={standardTitle(d.year)}
                maxLength={255}
              />
              {triedSave && problems.title && <p className={css.error}>{problems.title}</p>}
              {(nonStandard || (d.titleTouched && d.title.trim() !== standardTitle(d.year))) && (
                <p className={css.suggest}>
                  ชื่อมาตรฐาน: <b>{standardTitle(d.year)}</b>
                  <button type="button" onClick={() => setD((prev) => ({ ...prev, title: standardTitle(prev.year), titleTouched: false }))}>
                    ใช้ชื่อนี้
                  </button>
                </p>
              )}
            </section>

            {/* ขั้นสูง */}
            <section className={css.more}>
              <button type="button" className={css.moreToggle} aria-expanded={more} onClick={() => setMore((v) => !v)}>
                <ChevronDown size={16} className={more ? css.rotated : ""} /> ตัวเลือกเพิ่มเติม <small>คำอธิบาย · ลิงก์จากเว็บเก่า</small>
              </button>
              {more && (
                <div className={css.moreBody}>
                  <label className={css.field}>
                    <span>คำอธิบายสั้น ๆ (ไม่บังคับ)</span>
                    <textarea className={css.input} rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="เช่น ผลการดำเนินงานและงบการเงินประจำปี" />
                  </label>
                  <label className={css.field}>
                    <span>ชื่อไฟล์บนเว็บเก่า (legacy path)</span>
                    <input className={css.input} value={d.legacyPath} onChange={(e) => set("legacyPath", e.target.value)} placeholder="เช่น a1710c90-bb47-46d6-bae2-8335eccefc1e.pdf" />
                    <small>ให้ลิงก์เก่า /BusinessReport/File/Pdf/… ยังเปิดเล่มนี้ได้ · รายงานใหม่ไม่ต้องกรอก</small>
                  </label>
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className={css.drawerFoot}>
          <button
            type="button"
            role="switch"
            aria-checked={d.isActive}
            className={`${css.switch} ${d.isActive ? css.switchOn : ""}`}
            onClick={() => set("isActive", !d.isActive)}
          >
            <span className={css.switchKnob} />
            <span className={css.switchLabel}>{d.isActive ? "แสดงบนเว็บ" : "บันทึกแบบซ่อน"}</span>
          </button>
          <div className={css.footBtns}>
            <button type="button" className={css.secondaryBtn} onClick={close}>ยกเลิก</button>
            <button type="button" className={css.primaryBtn} onClick={save} disabled={saving || busy}>
              {saving ? <Loader2 size={16} className={css.spin} /> : <CheckCircle2 size={16} />} บันทึก
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
