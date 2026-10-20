"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookPlus,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  FileUp,
  ImagePlus,
  Landmark,
  Loader2,
  Minus,
  MoreHorizontal,
  Paperclip,
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
import { MEETING_DOC_KINDS, type MeetingDocKind, meetingDocKind } from "@/lib/meetingDocs";
import Book from "@/app/annual-reports/Book";
import drawerCss from "../regulations/page.module.css";
import cabinetCss from "../annual-reports/page.module.css";
import own from "./page.module.css";

// รวมสามไฟล์แบบต่อชื่อคลาส: แผงแก้ไข (regulations) + ตู้หนังสือ (annual-reports) + ส่วนเพิ่มของหน้านี้
const css: Record<string, string> = Object.fromEntries(
  [...new Set([...Object.keys(drawerCss), ...Object.keys(cabinetCss), ...Object.keys(own)])].map((k) => [
    k,
    [drawerCss[k], cabinetCss[k], own[k]].filter(Boolean).join(" "),
  ])
);

/* ═════════ ชนิดข้อมูล ═════════ */
interface Doc {
  id: number;
  year: number;
  title: string;
  fileUrl: string;
  coverUrl: string | null;
  category: string;
  sortOrder: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Draft {
  id?: number;
  year: number;
  kind: MeetingDocKind;
  title: string;
  titleTouched: boolean;
  fileUrl: string;
  fileLabel: string;
  coverUrl: string;
  description: string;
  isActive: boolean;
}

type Slot = { year: number; main: Doc | null; extras: Doc[] };

const kindInfo = (k: MeetingDocKind) => MEETING_DOC_KINDS.find((x) => x.value === k)!;
/** เอกสารประชุมปีไหนควรมีแล้ว — ประชุมใหญ่ของปี N จัดต้นปี N+1 */
const expectedLatestYear = () => new Date().getFullYear() + 543 - 1;
const fileNameOf = (url: string) => decodeURIComponent(url.split("/").pop() ?? url);

const blankDraft = (year: number, kind: MeetingDocKind): Draft => ({
  year,
  kind,
  title: kindInfo(kind).titleOf(year),
  titleTouched: false,
  fileUrl: "",
  fileLabel: "",
  coverUrl: "",
  description: "",
  isActive: true,
});

/* ═════════ หน้า ═════════ */
export default function AdminMeetingDocumentsPage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<Doc[] | null>(null);
  const [views, setViews] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/admin/meeting-documents", { credentials: "include" });
    if (!res.ok) throw new Error();
    return (await res.json()) as { items: Doc[]; pageViews12m: number };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchItems();
      setItems(data.items);
      setViews(data.pageViews12m);
    } catch {
      message.error("โหลดรายการไม่สำเร็จ");
      setItems((prev) => prev ?? []);
    }
  }, [fetchItems, message]);

  useEffect(() => {
    let cancelled = false;
    fetchItems()
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setViews(data.pageViews12m);
      })
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

  /* ── ชั้นวาง: ช่องละหนึ่งปี (เล่มหลัก + เอกสารแนบ) ตั้งแต่ปีที่ควรมีล่าสุดถึงปีเก่าสุด ── */
  const slots = useMemo<Slot[]>(() => {
    if (all.length === 0) return [];
    const years = all.map((d) => d.year);
    const top = Math.max(expectedLatestYear(), ...years);
    const bottom = Math.min(...years);
    const out: Slot[] = [];
    for (let y = top; y >= bottom; y--) {
      const docs = all
        .filter((d) => d.year === y)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
      // เล่มหลัก = รายการ "เล่มเอกสารประกอบการประชุม" ที่แสดงอยู่ (ถ้าไม่มี ใช้ตัวที่ซ่อนไว้)
      const mains = docs.filter((d) => meetingDocKind(d.category) === "report");
      const main = mains.find((d) => d.isActive) ?? mains[0] ?? null;
      out.push({ year: y, main, extras: docs.filter((d) => d !== main) });
    }
    return out;
  }, [all]);

  const missingYears = slots.filter((s) => !s.main && s.extras.length === 0).map((s) => s.year);
  const noMainYears = slots.filter((s) => !s.main && s.extras.length > 0).map((s) => s.year);
  const yearsWithDocs = new Set(all.map((d) => d.year)).size;
  const latestYear = slots.find((s) => s.main || s.extras.length)?.year;
  const latestMainId = slots.find((s) => s.main?.isActive)?.main?.id;

  /* ── คำสั่งต่อเอกสาร ── */
  const setBusy = (id: number, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleActive = async (d: Doc) => {
    const next = !d.isActive;
    setBusy(d.id, true);
    setItems((prev) => prev?.map((i) => (i.id === d.id ? { ...i, isActive: next } : i)) ?? prev);
    try {
      const res = await fetch("/api/admin/meeting-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: d.id, isActive: next }),
      });
      if (!res.ok) throw new Error();
      message.success(next ? "แสดงบนหน้าเว็บแล้ว" : "ซ่อนจากหน้าเว็บแล้ว");
    } catch {
      setItems((prev) => prev?.map((i) => (i.id === d.id ? { ...i, isActive: !next } : i)) ?? prev);
      message.error("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(d.id, false);
    }
  };

  const remove = async (d: Doc) => {
    setBusy(d.id, true);
    try {
      const res = await fetch(`/api/admin/meeting-documents?id=${d.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev?.filter((i) => i.id !== d.id) ?? prev);
      message.success("ลบเอกสารแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    } finally {
      setBusy(d.id, false);
    }
  };

  const confirmDelete = (d: Doc) =>
    modal.confirm({
      title: "ลบเอกสารนี้ถาวร?",
      content: `“${d.title}” จะหายจากหน้าเว็บและกู้คืนไม่ได้ — ถ้าแค่ไม่อยากให้สมาชิกเห็นชั่วคราว ใช้ “ซ่อนจากหน้าเว็บ” แทน`,
      okText: "ลบถาวร",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: () => remove(d),
    });

  const menuOf = (d: Doc): MenuProps => ({
    items: [
      { key: "pdf", icon: <ExternalLink size={15} />, label: "เปิดไฟล์ PDF" },
      { key: "toggle", icon: d.isActive ? <EyeOff size={15} /> : <Eye size={15} />, label: d.isActive ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ" },
      { type: "divider" as const },
      { key: "delete", icon: <Trash2 size={15} />, label: "ลบถาวร…", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "pdf") window.open(d.fileUrl, "_blank", "noopener");
      if (key === "toggle") toggleActive(d);
      if (key === "delete") confirmDelete(d);
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
    if (noMainYears.length) return noMainYears[0];
    return Math.max(expectedLatestYear(), ...all.map((d) => d.year + 1));
  };
  const openNew = (year = nextYear(), kind: MeetingDocKind = "report") => setDraft(blankDraft(year, kind));
  const openEdit = (d: Doc) => {
    const kind = meetingDocKind(d.category);
    setDraft({
      id: d.id,
      year: d.year,
      kind,
      title: d.title,
      titleTouched: d.title !== kindInfo(kind).titleOf(d.year),
      fileUrl: d.fileUrl,
      fileLabel: fileNameOf(d.fileUrl),
      coverUrl: d.coverUrl ?? "",
      description: d.description ?? "",
      isActive: d.isActive,
    });
  };

  const loading = items === null;
  const alertYears = [...missingYears, ...noMainYears].sort((a, b) => b - a);

  return (
    <div className={css.page}>
      {/* ── ตู้เอกสาร: หัวตู้ → ชั้นวาง (ช่องละหนึ่งปี) ── */}
      <section className={`${css.cabinet} ${css.meetingCabinet}`} aria-labelledby="cabinet-title">
        <header className={css.crown}>
          <div className={css.plaque}>
            <span className={css.plaqueIcon}><Landmark size={24} /></span>
            <div>
              <span className={css.plaqueKicker}>ตู้เอกสาร · ประชุมใหญ่สามัญประจำปี</span>
              <h1 id="cabinet-title" className={css.plaqueTitle}>เอกสารประชุมใหญ่</h1>
            </div>
          </div>

          <dl className={css.crownStats}>
            <div>
              <dt>มีเอกสาร</dt>
              <dd>{loading ? "–" : yearsWithDocs}<small>ปี</small></dd>
            </div>
            <div>
              <dt>ปีล่าสุด</dt>
              <dd>{latestYear ?? "–"}</dd>
            </div>
            <div>
              <dt>เข้าชมหน้าเว็บ 12 เดือน</dt>
              <dd>{loading ? "–" : views.toLocaleString("th-TH")}<small>ครั้ง</small></dd>
            </div>
          </dl>

          <div className={css.crownBtns}>
            <a href="/reports/annual-meeting" target="_blank" rel="noopener noreferrer" className={css.crownGhost}>
              <ExternalLink size={16} /> ดูหน้าเว็บ
            </a>
            <button type="button" className={css.primaryBtn} onClick={() => openNew()}>
              <Plus size={18} /> เพิ่มเอกสาร
            </button>
          </div>
        </header>

        {alertYears.length > 0 && (
          <div className={css.cabinetNote}>
            <AlertTriangle size={17} />
            <span>
              <strong>ยังไม่มีเล่มเอกสารประกอบการประชุมปี {alertYears.join(", ")}</strong> — สมาชิกจะหาเอกสารประชุมของปีนี้ไม่เจอ
            </span>
            <button type="button" onClick={() => openNew(alertYears[0], "report")}>
              <BookPlus size={15} /> เพิ่มเล่มปี {alertYears[0]}
            </button>
          </div>
        )}

        <div className={css.interior}>
          {loading ? (
            <div className={css.interiorState}><Loader2 size={22} className={css.spin} /> กำลังจัดเอกสารขึ้นชั้น…</div>
          ) : all.length === 0 ? (
            <div className={css.emptyShelf}>
              <span><BookPlus size={32} /></span>
              <strong>ตู้ยังว่างอยู่</strong>
              <p>อัปโหลดเล่มเอกสารประกอบการประชุม (PDF) ระบบจะทำภาพปกให้อัตโนมัติ</p>
              <button type="button" className={css.primaryBtnSm} onClick={() => openNew()}>
                <Plus size={16} /> เพิ่มเอกสารปีแรก
              </button>
            </div>
          ) : (
            <ul className={css.shelf}>
              {slots.map((s) => (
                <li key={s.year} className={`${css.slot} ${s.main && !s.main.isActive ? css.slotHidden : ""}`}>
                  {s.main ? (
                    <button type="button" className={css.bookBtn} onClick={() => openEdit(s.main!)} aria-label={`แก้ไข${s.main.title}`}>
                      <Book year={s.year} title={s.main.title} coverUrl={s.main.coverUrl} fileUrl={s.main.fileUrl} className={css.shelfBook} />
                      {latestMainId === s.main.id && <span className={css.latestRibbon}>ล่าสุด</span>}
                      {!s.main.isActive && <span className={css.hiddenRibbon}><EyeOff size={12} /> ซ่อนอยู่</span>}
                    </button>
                  ) : (
                    <button type="button" className={css.missingSlot} onClick={() => openNew(s.year, "report")} aria-label={`เพิ่มเล่มเอกสารประกอบการประชุมปี ${s.year}`}>
                      <span className={css.missingBook}>
                        <BookPlus size={28} />
                        <b>{s.year}</b>
                      </span>
                    </button>
                  )}
                  <span className={css.plank} aria-hidden="true" />

                  <div className={css.bookInfo}>
                    <span className={`${css.yearBadge} ${s.main ? "" : css.yearBadgeEmpty}`}>พ.ศ. {s.year}</span>
                    {s.main ? (
                      <>
                        <strong className={css.bookTitle}>ประชุมใหญ่สามัญประจำปี {s.year}</strong>
                        <span className={css.bookMeta}>
                          <span className={s.main.isActive ? css.liveTag : css.offTag}>
                            {s.main.isActive ? <><i /> แสดงบนเว็บ</> : <><EyeOff size={12} /> ซ่อนอยู่</>}
                          </span>
                          <span className={css.reads}><Paperclip size={13} /> เอกสารแนบ <b>{s.extras.length}</b></span>
                        </span>
                        <div className={css.bookActions}>
                          <button type="button" className={css.editBtn} onClick={() => openEdit(s.main!)} disabled={busyIds.has(s.main.id)}>
                            <Pencil size={15} /> แก้ไขเล่ม
                          </button>
                          <Dropdown menu={menuOf(s.main)} trigger={["click"]} placement="bottomRight">
                            <button type="button" className={css.moreBtn} aria-label={`คำสั่งเพิ่มเติมของ ${s.main.title}`} disabled={busyIds.has(s.main.id)}>
                              {busyIds.has(s.main.id) ? <Loader2 size={17} className={css.spin} /> : <MoreHorizontal size={18} />}
                            </button>
                          </Dropdown>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong className={css.missingText}>ยังไม่มีเล่มเอกสาร</strong>
                        <button type="button" className={css.addHere} onClick={() => openNew(s.year, "report")}>
                          <Plus size={14} /> เพิ่มเล่มนี้
                        </button>
                      </>
                    )}

                    {/* เอกสารแนบของปีนี้ */}
                    {s.extras.length > 0 && (
                      <ul className={css.attachList}>
                        {s.extras.map((d) => (
                          <li key={d.id} className={d.isActive ? "" : css.attachHidden}>
                            <button type="button" className={css.attachMain} onClick={() => openEdit(d)} title={`แก้ไข ${d.title}`}>
                              <FileText size={14} />
                              <span>
                                <b>{kindInfo(meetingDocKind(d.category)).short}</b>
                                <small>{d.title}</small>
                              </span>
                              {!d.isActive && <EyeOff size={13} />}
                            </button>
                            <Dropdown menu={menuOf(d)} trigger={["click"]} placement="bottomRight">
                              <button type="button" className={css.attachMore} aria-label={`คำสั่งเพิ่มเติมของ ${d.title}`} disabled={busyIds.has(d.id)}>
                                {busyIds.has(d.id) ? <Loader2 size={14} className={css.spin} /> : <MoreHorizontal size={15} />}
                              </button>
                            </Dropdown>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className={css.attachAdd} onClick={() => openNew(s.year, s.main ? "agenda" : "report")}>
                      <FilePlus2 size={14} /> เพิ่มเอกสารในปีนี้
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* ลิ้นชักเก็บแฟ้มด้านล่างตู้ — ตกแต่งให้ดูเป็นตู้เอกสาร (กดไม่ได้) */}
        <div className={css.drawers} aria-hidden="true">
          <span><i /></span>
          <span><i /></span>
          <span><i /></span>
        </div>
        <span className={css.feet} aria-hidden="true" />
      </section>

      {draft && (
        <Editor
          key={editorSeq}
          initial={draft}
          all={all}
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

/* ═════════ แผงเพิ่ม/แก้ไขเอกสาร ═════════ */
function Editor({ initial, all, onClose, onSaved }: { initial: Draft; all: Doc[]; onClose: () => void; onSaved: () => void }) {
  const { message } = App.useApp();
  const isNew = !initial.id;
  const [d, setD] = useState<Draft>(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [more, setMore] = useState(Boolean(initial.description));
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
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

  /* ปี/ประเภทเปลี่ยน → ชื่อมาตรฐานเปลี่ยนตาม (จนกว่าจะพิมพ์ชื่อเอง) */
  const retitle = (patch: Partial<Pick<Draft, "year" | "kind">>) =>
    setD((prev) => {
      const next = { ...prev, ...patch };
      return prev.titleTouched ? next : { ...next, title: kindInfo(next.kind).titleOf(next.year) };
    });

  const makeCover = async (src: string | ArrayBuffer, silent = false) => {
    setCoverBusy(true);
    try {
      const url = await uploadAdminFile(await createPdfCoverFile(src), "meeting-documents");
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
    setD((prev) => ({ ...prev, fileLabel: file.name, fileUrl: "", coverUrl: "" }));
    setFileSize(file.size);
    setProgress(0);
    const buffer = file.arrayBuffer();
    try {
      const url = await uploadAdminFile(file, "meeting-documents", setProgress);
      setD((prev) => ({ ...prev, fileUrl: url }));
      setProgress(null);
      await makeCover(await buffer, true);
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
      set("coverUrl", await uploadAdminFile(file, "meeting-documents"));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "อัปโหลดภาพปกไม่สำเร็จ");
    } finally {
      setCoverBusy(false);
    }
  };

  const yearOk = Number.isInteger(d.year) && d.year >= 2500 && d.year <= 2700;
  const otherMain = d.kind === "report" ? all.find((x) => x.year === d.year && x.id !== d.id && meetingDocKind(x.category) === "report") : undefined;
  const standard = kindInfo(d.kind).titleOf(d.year);
  const problems = {
    file: !d.fileUrl ? (progress !== null ? "รออัปโหลดไฟล์ให้เสร็จก่อน" : "เลือกไฟล์ PDF") : "",
    year: !yearOk ? "ใส่ปี พ.ศ. 4 หลัก เช่น 2568" : "",
    title: !d.title.trim() ? "ใส่ชื่อเอกสาร" : "",
  };
  const blocked = Boolean(problems.file || problems.year || problems.title);

  const save = async () => {
    setTriedSave(true);
    if (blocked) return;
    setSaving(true);
    try {
      const payload = {
        year: d.year,
        category: d.kind,
        title: d.title.trim(),
        fileUrl: d.fileUrl,
        coverUrl: d.coverUrl,
        description: d.description,
        isActive: d.isActive,
      };
      const res = await fetch("/api/admin/meeting-documents", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isNew ? payload : { ...payload, id: d.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
      message.success(isNew ? `เพิ่ม${kindInfo(d.kind).short}ปี ${d.year} แล้ว` : "บันทึกการแก้ไขแล้ว");
      onSaved();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={panel} className={`${css.drawer} ${css.wideDrawer}`} role="dialog" aria-modal="true" aria-labelledby="md-editor-title" tabIndex={-1}>
        <header className={css.drawerHead}>
          <div>
            <h2 id="md-editor-title">{isNew ? "เพิ่มเอกสารประชุมใหญ่" : "แก้ไขเอกสารประชุมใหญ่"}</h2>
            <p>{isNew ? "อัปโหลด PDF → เลือกปีและประเภท → ตรวจชื่อ → บันทึก (ภาพปกทำให้อัตโนมัติ)" : d.title}</p>
          </div>
          <button type="button" className={css.closeBtn} onClick={close} aria-label="ปิด">
            <X size={20} />
          </button>
        </header>

        <div className={`${css.drawerBody} ${css.editorGrid}`}>
          {/* ── ตัวอย่างหน้าปก ── */}
          <aside className={css.previewCol}>
            <div className={css.previewStage}>
              {d.fileUrl || d.coverUrl ? (
                <Book key={`${d.coverUrl}|${d.fileUrl}`} year={d.year} title={d.title} coverUrl={d.coverUrl || null} fileUrl={d.fileUrl} className={css.previewBook} />
              ) : (
                <div className={css.previewEmpty}>
                  <Landmark size={34} />
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
            <p className={css.previewNote}>
              {d.kind === "report" ? "เล่มหลักแสดงเป็นหนังสือบนชั้นในตู้" : "เอกสารแนบแสดงเป็นรายการใต้เล่มหลักของปีเดียวกัน"}
            </p>
          </aside>

          <div className={css.formCol}>
            {/* 1. ไฟล์ */}
            <section className={css.step}>
              <h3><span>1</span> ไฟล์เอกสาร (PDF) {!isNew && <small>ลากไฟล์ใหม่มาวางเพื่อแทนฉบับเดิม</small>}</h3>
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
                        <small>กำลังอัปโหลด {Math.round(progress * 100)}%</small>
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
                  <strong>ลากไฟล์ PDF มาวางที่นี่</strong>
                  <span>หรือคลิกเพื่อเลือกไฟล์ · ไม่เกิน 100 MB</span>
                </button>
              )}
              {fileError && <p className={css.error}>{fileError}</p>}
            </section>

            {/* 2. ปี */}
            <section className={css.step}>
              <h3><span>2</span> ประชุมใหญ่ของปี พ.ศ.</h3>
              <div className={css.yearRow}>
                <button type="button" className={css.yearStep} onClick={() => retitle({ year: d.year - 1 })} aria-label="ปีก่อนหน้า"><Minus size={16} /></button>
                <input
                  className={`${css.yearInput} ${triedSave && problems.year ? css.invalid : ""}`}
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(d.year) ? "" : d.year}
                  onChange={(e) => retitle({ year: parseInt(e.target.value, 10) })}
                  aria-label="ปี พ.ศ."
                />
                <button type="button" className={css.yearStep} onClick={() => retitle({ year: d.year + 1 })} aria-label="ปีถัดไป"><Plus size={16} /></button>
              </div>
              {triedSave && problems.year && <p className={css.error}>{problems.year}</p>}
            </section>

            {/* 3. ประเภท */}
            <section className={css.step}>
              <h3><span>3</span> เอกสารประเภทไหน</h3>
              <div className={css.kindPick} role="radiogroup" aria-label="ประเภทเอกสาร">
                {MEETING_DOC_KINDS.map((k) => {
                  const on = d.kind === k.value;
                  return (
                    <button key={k.value} type="button" role="radio" aria-checked={on} className={on ? css.pickOn : css.pick} onClick={() => retitle({ kind: k.value })}>
                      {k.value === "report" ? <BookPlus size={18} /> : <FileText size={18} />}
                      <span>{k.label}</span>
                    </button>
                  );
                })}
              </div>
              {yearOk && otherMain && (
                <p className={css.warn}>
                  <AlertTriangle size={14} /> ปี {d.year} มีเล่มหลักแล้ว (“{otherMain.title}”) — ถ้าเป็นฉบับแก้ไข แนะนำให้แก้เล่มเดิม หรือเลือกเป็นเอกสารแนบ
                </p>
              )}
            </section>

            {/* 4. ชื่อ */}
            <section className={css.step}>
              <h3><span>4</span> ชื่อเอกสาร <small>ชื่อที่สมาชิกเห็นบนเว็บ</small></h3>
              <input
                className={`${css.input} ${triedSave && problems.title ? css.invalid : ""}`}
                value={d.title}
                onChange={(e) => setD((prev) => ({ ...prev, title: e.target.value, titleTouched: true }))}
                placeholder={standard || "เช่น รายงานการประชุมใหญ่สามัญประจำปี 2568"}
                maxLength={255}
              />
              {triedSave && problems.title && <p className={css.error}>{problems.title}</p>}
              {standard && d.titleTouched && d.title.trim() !== standard && (
                <p className={css.suggest}>
                  ชื่อมาตรฐาน: <b>{standard}</b>
                  <button type="button" onClick={() => setD((prev) => ({ ...prev, title: standard, titleTouched: false }))}>
                    ใช้ชื่อนี้
                  </button>
                </p>
              )}
            </section>

            <section className={css.more}>
              <button type="button" className={css.moreToggle} aria-expanded={more} onClick={() => setMore((v) => !v)}>
                <ChevronDown size={16} className={more ? css.rotated : ""} /> ตัวเลือกเพิ่มเติม <small>คำอธิบาย</small>
              </button>
              {more && (
                <div className={css.moreBody}>
                  <label className={css.field}>
                    <span>คำอธิบายสั้น ๆ (ไม่บังคับ)</span>
                    <textarea className={css.input} rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="แสดงใต้ชื่อเอกสารบนหน้าเว็บ" />
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
