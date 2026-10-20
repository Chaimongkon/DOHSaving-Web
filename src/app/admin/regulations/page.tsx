/* eslint-disable @next/next/no-img-element -- ปกเอกสารเป็น data URL ที่สร้างจาก PDF ในเบราว์เซอร์ ใช้ next/image ไม่ได้ */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Scale,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { App, Popconfirm } from "antd";
import { getPdfCoverDataUrl, renderPdfFirstPage } from "@/lib/pdfCover";
import { MAX_PDF_BYTES, formatBytes, isPdfFile, titleFromFileName, uploadAdminFile } from "@/lib/adminUpload";
import PdfThumb from "@/components/admin/PdfThumb";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูลและค่าคงที่ ═════════ */
interface RegItem {
  id: number;
  title: string | null;
  typeForm: string | null;
  typeMember: string | null;
  filePath: string | null;
  imagePath: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type TypeKey = "statute" | "rules" | "announcements";

const TYPES: { key: TypeKey; label: string; desc: string; icon: React.ElementType }[] = [
  { key: "announcements", label: "ประกาศ", desc: "หลักเกณฑ์ เงื่อนไข ประกาศต่าง ๆ", icon: Megaphone },
  { key: "rules", label: "ระเบียบ", desc: "ระเบียบว่าด้วยเงินกู้ เงินฝาก สวัสดิการ", icon: Scale },
  { key: "statute", label: "ข้อบังคับ", desc: "ข้อบังคับของสหกรณ์", icon: BookOpen },
];

/** ค่าที่บันทึก = ชื่อเต็ม (หน้าเว็บใช้จัดแท็บ) · ชิปแสดงชื่อสั้น */
const MEMBERS: { value: string; short: string }[] = [
  { value: "สมาชิกสามัญประเภท ก", short: "สามัญ ก" },
  { value: "สมาชิกสามัญประเภท ข", short: "สามัญ ข" },
  { value: "สมาชิกสมทบ", short: "สมทบ" },
  { value: "สมาชิกสามัญประเภท ก ข สมทบ", short: "ทุกประเภท (ก ข สมทบ)" },
  { value: "สหกรณ์ฯ", short: "สหกรณ์ฯ (ทั่วไป)" },
];
const shortOf = (v: string | null) => MEMBERS.find((m) => m.value === v)?.short ?? v ?? "ไม่ระบุกลุ่ม";

const NEW_DAYS = 14;
const DAY = 86400000;
const TH = 7 * 3600000;

const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });
const fileNameOf = (url: string) => decodeURIComponent(url.split("/").pop() ?? url);
const postDay = (iso: string) => Math.floor((new Date(iso).getTime() + TH) / DAY);

/** ลำดับเดียวกับหน้าเว็บ: ลงใหม่สุดอยู่บน · ลงวันเดียวกันเรียงตาม "ลำดับการแสดงผล" */
const publicOrder = (a: RegItem, b: RegItem) =>
  postDay(b.createdAt) - postDay(a.createdAt) ||
  a.sortOrder - b.sortOrder ||
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** เทียบชื่อแบบหลวม ๆ — ไม่สนช่องว่าง เครื่องหมาย และปี พ.ศ. (ใช้หาฉบับเก่าของเอกสารเดียวกัน) */
const looseTitle = (s: string) =>
  s
    .replace(/พ\.?\s*ศ\.?\s*\d{4}/g, "")
    .replace(/(ฉบับที่|ครั้งที่)\s*\d+/g, "")
    .replace(/[\s.,ฯ"'“”()\-–_/]/g, "")
    .toLowerCase();

interface Draft {
  id?: number;
  title: string;
  typeForm: TypeKey;
  members: string[];
  filePath: string;
  fileLabel: string;
  imagePath: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const blankDraft = (typeForm: TypeKey, members: string[] = []): Draft => ({
  title: "",
  typeForm,
  members,
  filePath: "",
  fileLabel: "",
  imagePath: "",
  description: "",
  sortOrder: 0,
  isActive: true,
});

/* ═════════ หน้า ═════════ */
export default function AdminRegulationsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<RegItem[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [type, setType] = useState<TypeKey | null>(null);
  const [member, setMember] = useState("");
  const [query, setQuery] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/regulations", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data: RegItem[] = await res.json();
      setItems(data);
      setLoadedAt(Date.now());
    } catch {
      message.error("โหลดรายการไม่สำเร็จ");
      setItems((prev) => prev ?? []);
    }
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/regulations", { credentials: "include" });
        if (!res.ok) throw new Error();
        const data: RegItem[] = await res.json();
        if (cancelled) return;
        setItems(data);
        setLoadedAt(Date.now());
      } catch {
        if (!cancelled) {
          message.error("โหลดรายการไม่สำเร็จ");
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [message]);

  const all = useMemo(() => items ?? [], [items]);

  // เปิดมาที่ประเภทที่ลงล่าสุด (งานส่วนใหญ่คือลงประกาศ)
  const activeType: TypeKey = type ?? ([...all].sort(publicOrder)[0]?.typeForm as TypeKey) ?? "announcements";

  const byType = useMemo(() => all.filter((i) => i.typeForm === activeType), [all, activeType]);

  const memberChips = useMemo(() => {
    const present = new Set(byType.map((i) => i.typeMember ?? ""));
    const known = MEMBERS.filter((m) => present.has(m.value)).map((m) => m.value);
    const other = [...present].filter((v) => !MEMBERS.some((m) => m.value === v));
    return [...known, ...other];
  }, [byType]);
  const activeMember = memberChips.includes(member) ? member : "";

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byType
      .filter((i) => activeMember === "" || (i.typeMember ?? "") === activeMember)
      .filter((i) => !q || `${i.title ?? ""} ${i.description ?? ""} ${fileNameOf(i.filePath ?? "")}`.toLowerCase().includes(q))
      .sort(publicOrder);
  }, [byType, activeMember, query]);

  // ชื่อซ้ำในประเภทและกลุ่มเดียวกันที่ยังเผยแพร่อยู่ — มักเป็นฉบับเก่าที่ลืมซ่อน
  const duplicateIds = useMemo(() => {
    const seen = new Map<string, number[]>();
    for (const i of all) {
      if (!i.isActive || !i.title) continue;
      const k = `${i.typeForm}|${i.typeMember}|${looseTitle(i.title)}`;
      seen.set(k, [...(seen.get(k) ?? []), i.id]);
    }
    return new Set([...seen.values()].filter((ids) => ids.length > 1).flat());
  }, [all]);

  const typeStats = (key: TypeKey) => {
    const rows = all.filter((i) => i.typeForm === key);
    const latest = [...rows].sort(publicOrder)[0];
    return { total: rows.length, hidden: rows.filter((i) => !i.isActive).length, latest: latest?.createdAt };
  };

  /* ── เผยแพร่/ซ่อน ทันที ── */
  const setBusy = (id: number, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleActive = async (item: RegItem) => {
    const next = !item.isActive;
    setBusy(item.id, true);
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isActive: next } : i)) ?? prev);
    try {
      const res = await fetch("/api/admin/regulations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item.id, isActive: next }),
      });
      if (!res.ok) throw new Error();
      message.success(next ? "เผยแพร่แล้ว — สมาชิกเห็นเอกสารนี้" : "ซ่อนแล้ว — สมาชิกจะไม่เห็นเอกสารนี้");
    } catch {
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isActive: !next } : i)) ?? prev);
      message.error("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(item.id, false);
    }
  };

  const remove = async (item: RegItem) => {
    setBusy(item.id, true);
    try {
      const res = await fetch(`/api/admin/regulations?id=${item.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
      message.success("ลบเอกสารแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    } finally {
      setBusy(item.id, false);
    }
  };

  /* ── ตัวแก้ไข ── */
  const [draft, setDraftState] = useState<Draft | null>(null);
  // เปิดแผงใหม่ทุกครั้ง = ล้างสถานะภายในแผง (รวมถึง "บันทึกแล้วลงต่อ")
  const [editorSeq, setEditorSeq] = useState(0);
  const setDraft = (next: Draft | null) => {
    setDraftState(next);
    if (next) setEditorSeq((n) => n + 1);
  };

  const openNew = () => setDraft(blankDraft(activeType, activeMember && MEMBERS.some((m) => m.value === activeMember) ? [activeMember] : []));
  const openEdit = (item: RegItem) =>
    setDraft({
      id: item.id,
      title: item.title ?? "",
      typeForm: (item.typeForm as TypeKey) ?? activeType,
      members: item.typeMember ? [item.typeMember] : [],
      filePath: item.filePath ?? "",
      fileLabel: item.filePath ? fileNameOf(item.filePath) : "",
      imagePath: item.imagePath ?? "",
      description: item.description ?? "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
  // ลงเอกสารเดิมให้กลุ่มอื่น — ใช้ไฟล์และชื่อเดิม เลือกกลุ่มใหม่
  const openCopy = (item: RegItem) =>
    setDraft({
      ...blankDraft((item.typeForm as TypeKey) ?? activeType),
      title: item.title ?? "",
      filePath: item.filePath ?? "",
      fileLabel: item.filePath ? fileNameOf(item.filePath) : "",
      imagePath: item.imagePath ?? "",
      description: item.description ?? "",
    });

  const loading = items === null;
  const total = all.length;
  const hiddenTotal = all.filter((i) => !i.isActive).length;

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Scale size={22} /></span>
          <div>
            <h1 className={css.title}>ข้อบังคับ ระเบียบ ประกาศ</h1>
            <p className={css.subtitle}>
              {loading ? "กำลังโหลด…" : `${total} เอกสาร${hiddenTotal ? ` · ซ่อนอยู่ ${hiddenTotal}` : ""} · เรียงตามที่สมาชิกเห็นบนเว็บ (ลงใหม่สุดอยู่บน)`}
            </p>
          </div>
        </div>
        <button type="button" className={css.primaryBtn} onClick={openNew}>
          <Plus size={18} /> ลงเอกสารใหม่
        </button>
      </header>

      {/* ── ประเภท ── */}
      <nav className={css.types} aria-label="ประเภทเอกสาร">
        {TYPES.map((t) => {
          const s = typeStats(t.key);
          const Icon = t.icon;
          const on = t.key === activeType;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={on}
              className={`${css.typeCard} ${on ? css.typeOn : ""}`}
              onClick={() => {
                setType(t.key);
                setMember("");
              }}
            >
              <span className={css.typeIcon}><Icon size={20} /></span>
              <span className={css.typeText}>
                <strong>{t.label}</strong>
                <small>{loading ? "…" : s.latest ? `ลงล่าสุด ${thaiDate(s.latest)}` : "ยังไม่มีเอกสาร"}</small>
              </span>
              <span className={css.typeCount}>{loading ? "–" : s.total}</span>
            </button>
          );
        })}
      </nav>

      {/* ── ตัวกรอง ── */}
      <section className={css.panel}>
        <div className={css.toolbar}>
          <div className={css.chips} role="group" aria-label="กลุ่มสมาชิก">
            <button type="button" aria-pressed={activeMember === ""} className={activeMember === "" ? css.chipOn : css.chip} onClick={() => setMember("")}>
              ทุกกลุ่ม <em>{byType.length}</em>
            </button>
            {memberChips.map((m) => (
              <button key={m} type="button" aria-pressed={activeMember === m} className={activeMember === m ? css.chipOn : css.chip} onClick={() => setMember(m)}>
                {shortOf(m || null)} <em>{byType.filter((i) => (i.typeMember ?? "") === m).length}</em>
              </button>
            ))}
          </div>
          <label className={css.search}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อเอกสาร" aria-label="ค้นหาเอกสาร" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้น">
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        {/* ── รายการ ── */}
        {loading ? (
          <div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลดรายการ…</div>
        ) : list.length === 0 ? (
          <div className={css.state}>
            <FileText size={32} />
            <p>{query ? `ไม่พบเอกสารที่ตรงกับ “${query}”` : "ยังไม่มีเอกสารในหมวดนี้"}</p>
            {!query && (
              <button type="button" className={css.primaryBtnSm} onClick={openNew}>
                <Plus size={16} /> ลงเอกสารแรก
              </button>
            )}
          </div>
        ) : (
          <ul className={css.list}>
            {list.map((item) => {
              const busy = busyIds.has(item.id);
              const fresh = loadedAt - new Date(item.createdAt).getTime() < NEW_DAYS * DAY;
              return (
                <li key={item.id} className={`${css.row} ${item.isActive ? "" : css.rowHidden}`}>
                  <button type="button" className={css.rowMain} onClick={() => openEdit(item)} title="แก้ไข">
                    <PdfThumb pdf={item.filePath} image={item.imagePath} className={css.cover} />
                    <span className={css.rowText}>
                      <span className={css.rowTitle}>{item.title || "(ไม่มีชื่อ)"}</span>
                      <span className={css.rowMeta}>
                        <span className={css.memberTag}>{shortOf(item.typeMember)}</span>
                        <span>ลงเมื่อ {thaiDate(item.createdAt)}</span>
                        {fresh && <span className={css.newTag}>ใหม่</span>}
                        {!item.isActive && <span className={css.hiddenTag}><EyeOff size={12} /> ซ่อนอยู่</span>}
                        {duplicateIds.has(item.id) && (
                          <span className={css.dupTag} title="มีเอกสารชื่อเดียวกันในกลุ่มนี้ที่ยังเผยแพร่อยู่ — ถ้าเป็นฉบับเก่า ควรซ่อน">
                            <AlertTriangle size={12} /> ชื่อซ้ำ
                          </span>
                        )}
                        {!item.filePath && <span className={css.dupTag}><AlertTriangle size={12} /> ไม่มีไฟล์</span>}
                      </span>
                    </span>
                  </button>

                  <div className={css.rowActions}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.isActive}
                      className={`${css.switch} ${item.isActive ? css.switchOn : ""}`}
                      onClick={() => toggleActive(item)}
                      disabled={busy}
                      title={item.isActive ? "กดเพื่อซ่อนจากหน้าเว็บ" : "กดเพื่อเผยแพร่"}
                    >
                      <span className={css.switchKnob} />
                      <span className={css.switchLabel}>{item.isActive ? "เผยแพร่" : "ซ่อน"}</span>
                    </button>
                    {item.filePath && (
                      <a href={item.filePath} target="_blank" rel="noopener noreferrer" className={css.iconBtn} title="เปิดไฟล์" aria-label="เปิดไฟล์">
                        <Eye size={17} />
                      </a>
                    )}
                    <button type="button" className={css.iconBtn} onClick={() => openCopy(item)} title="ลงเอกสารนี้ให้กลุ่มอื่น" aria-label="ลงเอกสารนี้ให้กลุ่มอื่น">
                      <Copy size={17} />
                    </button>
                    <button type="button" className={css.iconBtn} onClick={() => openEdit(item)} title="แก้ไข" aria-label="แก้ไข">
                      <Pencil size={17} />
                    </button>
                    <Popconfirm
                      title="ลบเอกสารนี้ถาวร?"
                      description={<span className={css.confirmText}>ถ้าแค่ไม่อยากให้สมาชิกเห็น ใช้ปุ่ม “ซ่อน” แทน — กู้คืนได้</span>}
                      okText="ลบถาวร"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => remove(item)}
                    >
                      <button type="button" className={`${css.iconBtn} ${css.iconDanger}`} disabled={busy} title="ลบ" aria-label="ลบ">
                        <Trash2 size={17} />
                      </button>
                    </Popconfirm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {draft && (
        <Editor
          key={editorSeq}
          initial={draft}
          all={all}
          onClose={() => setDraft(null)}
          onSaved={(next) => {
            load();
            if (next) setDraft(next);
            else setDraft(null);
          }}
        />
      )}
    </div>
  );
}

/* ═════════ แผงลง/แก้ไขเอกสาร ═════════ */
function Editor({
  initial,
  all,
  onClose,
  onSaved,
}: {
  initial: Draft;
  all: RegItem[];
  onClose: () => void;
  onSaved: (next: Draft | null) => void;
}) {
  const { message } = App.useApp();
  const isNew = !initial.id;
  const [d, setD] = useState<Draft>(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [more, setMore] = useState(Boolean(initial.description || initial.imagePath || initial.sortOrder));
  const [hideIds, setHideIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<"save" | "again" | null>(null);
  const [triedSave, setTriedSave] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const previewToken = useRef(0);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);

  /* ปกของไฟล์ที่มีอยู่แล้ว (แก้ไข/คัดลอก) */
  useEffect(() => {
    if (!initial.filePath.toLowerCase().endsWith(".pdf")) return;
    const token = ++previewToken.current;
    getPdfCoverDataUrl(initial.filePath)
      .then((src) => token === previewToken.current && setPreview(src))
      .catch(() => {});
  }, [initial.filePath]);

  const close = useCallback(() => {
    if (dirty && !window.confirm("ยังไม่ได้บันทึก — ปิดโดยไม่บันทึกใช่ไหม?")) return;
    onClose();
  }, [dirty, onClose]);

  /* Esc ปิด · ล็อกการเลื่อนหน้าด้านหลัง · โฟกัสเข้าแผง */
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

  /* ── ไฟล์ PDF ── */
  const pickFile = async (file: File | undefined) => {
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
    const autoTitle = titleFromFileName(file.name);
    setD((prev) => ({ ...prev, fileLabel: file.name, filePath: "", title: prev.title || autoTitle }));
    setFileSize(file.size);
    setPreview(null);
    setProgress(0);

    // ปกแสดงจากไฟล์ในเครื่องทันที ไม่ต้องรออัปโหลดเสร็จ
    const token = ++previewToken.current;
    file
      .arrayBuffer()
      .then((buf) => renderPdfFirstPage(buf, 360))
      .then((canvas) => token === previewToken.current && setPreview(canvas.toDataURL("image/jpeg", 0.85)))
      .catch(() => {});

    try {
      const url = await uploadAdminFile(file, "regulations", setProgress);
      setD((prev) => ({ ...prev, filePath: url }));
      if (!autoTitle) titleInput.current?.focus();
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      setD((prev) => ({ ...prev, fileLabel: "" }));
      setPreview(null);
    } finally {
      setProgress(null);
    }
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("รองรับเฉพาะไฟล์รูปภาพ");
      return;
    }
    setUploadingImage(true);
    try {
      set("imagePath", await uploadAdminFile(file, "regulations"));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImage(false);
    }
  };

  /* ── กลุ่มสมาชิก: ลงใหม่เลือกได้หลายกลุ่ม · แก้ไขเลือกได้กลุ่มเดียว ── */
  const toggleMember = (value: string) =>
    setD((prev) => {
      if (!isNew) return { ...prev, members: [value] };
      const has = prev.members.includes(value);
      return { ...prev, members: has ? prev.members.filter((m) => m !== value) : [...prev.members, value] };
    });

  /* ── ฉบับเก่าที่ชื่อคล้ายกัน (ในประเภทและกลุ่มเดียวกัน ที่ยังเผยแพร่อยู่) ── */
  const similar = useMemo(() => {
    const key = looseTitle(d.title);
    if (key.length < 8) return [];
    return all
      .filter(
        (i) =>
          i.id !== d.id &&
          i.isActive &&
          i.typeForm === d.typeForm &&
          d.members.includes(i.typeMember ?? "") &&
          i.title &&
          (looseTitle(i.title) === key || (key.length >= 14 && (looseTitle(i.title).includes(key) || key.includes(looseTitle(i.title)))))
      )
      .sort(publicOrder)
      .slice(0, 6);
  }, [all, d.title, d.typeForm, d.members, d.id]);

  /* ── ตรวจก่อนบันทึก ── */
  const problems = {
    file: !d.filePath ? (progress !== null ? "รออัปโหลดไฟล์ให้เสร็จก่อน" : "เลือกไฟล์ PDF") : "",
    members: d.members.length === 0 ? "เลือกกลุ่มสมาชิกอย่างน้อย 1 กลุ่ม" : "",
    title: !d.title.trim() ? "ใส่ชื่อเอกสาร" : "",
  };
  const blocked = Boolean(problems.file || problems.members || problems.title);

  const save = async (again: boolean) => {
    setTriedSave(true);
    if (blocked) return;
    setSaving(again ? "again" : "save");
    try {
      const common = {
        title: d.title.trim(),
        typeForm: d.typeForm,
        filePath: d.filePath,
        imagePath: d.imagePath,
        description: d.description,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        hideIds: [...hideIds],
      };
      const res = await fetch("/api/admin/regulations", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isNew ? { ...common, typeMembers: d.members } : { ...common, id: d.id, typeMember: d.members[0] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "บันทึกไม่สำเร็จ");
      }
      const label = TYPES.find((t) => t.key === d.typeForm)?.label ?? "เอกสาร";
      message.success(
        isNew
          ? `ลง${label}แล้ว${d.members.length > 1 ? ` ${d.members.length} กลุ่ม` : ""}${hideIds.size ? ` · ซ่อนฉบับเก่า ${hideIds.size} รายการ` : ""}`
          : `บันทึกการแก้ไขแล้ว${hideIds.size ? ` · ซ่อนฉบับเก่า ${hideIds.size} รายการ` : ""}`
      );
      // ลงต่อ: คงประเภทและกลุ่มไว้ ลงฉบับถัดไปได้ทันที
      onSaved(again ? blankDraft(d.typeForm, d.members) : null);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  };

  const typeLabel = TYPES.find((t) => t.key === d.typeForm)?.label ?? "";

  return (
    <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={panel} className={css.drawer} role="dialog" aria-modal="true" aria-labelledby="reg-editor-title" tabIndex={-1}>
        <header className={css.drawerHead}>
          <div>
            <h2 id="reg-editor-title">{isNew ? "ลงเอกสารใหม่" : "แก้ไขเอกสาร"}</h2>
            <p>{isNew ? "อัปโหลด PDF → เลือกประเภทและกลุ่ม → ตั้งชื่อ → บันทึก" : `${typeLabel} · ${shortOf(d.members[0] ?? null)}`}</p>
          </div>
          <button type="button" className={css.closeBtn} onClick={close} aria-label="ปิด">
            <X size={20} />
          </button>
        </header>

        <div className={css.drawerBody}>
          {/* 1. ไฟล์ */}
          <section className={css.step}>
            <h3><span>1</span> ไฟล์เอกสาร (PDF)</h3>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
            {d.fileLabel ? (
              <div className={css.fileCard}>
                <div className={css.filePreview}>{preview ? <img src={preview} alt="ปกเอกสาร" /> : <FileText size={26} />}</div>
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
                  <div className={css.fileBtns}>
                    {d.filePath && (
                      <a href={d.filePath} target="_blank" rel="noopener noreferrer"><Eye size={14} /> เปิดดู</a>
                    )}
                    <button type="button" onClick={() => fileInput.current?.click()} disabled={progress !== null}>
                      <Upload size={14} /> เปลี่ยนไฟล์
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`${css.drop} ${dragOver ? css.dropOver : ""} ${triedSave && problems.file ? css.invalid : ""}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
              >
                <FileUp size={30} />
                <strong>ลากไฟล์ PDF มาวางที่นี่</strong>
                <span>หรือคลิกเพื่อเลือกไฟล์ · ไม่เกิน 100 MB</span>
              </button>
            )}
            {fileError && <p className={css.error}>{fileError}</p>}
          </section>

          {/* 2. ประเภท */}
          <section className={css.step}>
            <h3><span>2</span> ประเภทเอกสาร</h3>
            <div className={css.typePick} role="radiogroup" aria-label="ประเภทเอกสาร">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const on = d.typeForm === t.key;
                return (
                  <button key={t.key} type="button" role="radio" aria-checked={on} className={on ? css.pickOn : css.pick} onClick={() => set("typeForm", t.key)}>
                    <Icon size={18} />
                    <strong>{t.label}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. กลุ่มสมาชิก */}
          <section className={css.step}>
            <h3>
              <span>3</span> ใช้กับสมาชิกกลุ่มไหน
              {isNew && <small>เลือกได้หลายกลุ่ม — ระบบลงให้แต่ละกลุ่มแยกกัน</small>}
            </h3>
            <div className={`${css.memberPick} ${triedSave && problems.members ? css.invalidGroup : ""}`} role={isNew ? "group" : "radiogroup"} aria-label="กลุ่มสมาชิก">
              {MEMBERS.map((m) => {
                const on = d.members.includes(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    role={isNew ? "checkbox" : "radio"}
                    aria-checked={on}
                    className={on ? css.memberOn : css.memberChip}
                    onClick={() => toggleMember(m.value)}
                  >
                    {on && <CheckCircle2 size={15} />} {m.short}
                  </button>
                );
              })}
            </div>
            {triedSave && problems.members && <p className={css.error}>{problems.members}</p>}
          </section>

          {/* 4. ชื่อ */}
          <section className={css.step}>
            <h3><span>4</span> ชื่อเอกสาร <small>ชื่อที่สมาชิกเห็นบนเว็บ</small></h3>
            <input
              ref={titleInput}
              className={`${css.input} ${triedSave && problems.title ? css.invalid : ""}`}
              value={d.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="เช่น ประกาศ หลักเกณฑ์การให้เงินกู้สามัญเพื่อการศึกษา พ.ศ.2569"
              maxLength={500}
            />
            {triedSave && problems.title && <p className={css.error}>{problems.title}</p>}

            {similar.length > 0 && (
              <div className={css.similar}>
                <p>
                  <AlertTriangle size={15} /> มีเอกสารชื่อคล้ายกันที่ยังเผยแพร่อยู่ — ถ้าเป็นฉบับเก่า เลือกให้ซ่อนพร้อมกันได้
                </p>
                {similar.map((s) => (
                  <label key={s.id} className={css.similarRow}>
                    <input
                      type="checkbox"
                      checked={hideIds.has(s.id)}
                      onChange={(e) =>
                        setHideIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong>{s.title}</strong>
                      <small>{shortOf(s.typeMember)} · ลงเมื่อ {thaiDate(s.createdAt)}</small>
                    </span>
                    {s.filePath && (
                      <a href={s.filePath} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        เปิดดู
                      </a>
                    )}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* ตัวเลือกเพิ่มเติม */}
          <section className={css.more}>
            <button type="button" className={css.moreToggle} aria-expanded={more} onClick={() => setMore((v) => !v)}>
              <ChevronDown size={16} className={more ? css.rotated : ""} /> ตัวเลือกเพิ่มเติม <small>คำอธิบาย · ลำดับ · รูปปก</small>
            </button>
            {more && (
              <div className={css.moreBody}>
                <label className={css.field}>
                  <span>คำอธิบายสั้น ๆ (ไม่บังคับ)</span>
                  <textarea className={css.input} rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="แสดงใต้ชื่อเอกสาร" />
                </label>
                <label className={css.field}>
                  <span>ลำดับเมื่อลงหลายฉบับในวันเดียวกัน</span>
                  <input
                    className={`${css.input} ${css.inputNum}`}
                    type="number"
                    min={0}
                    value={d.sortOrder}
                    onChange={(e) => set("sortOrder", Math.max(0, Number(e.target.value) || 0))}
                  />
                  <small>เลขน้อยขึ้นก่อน · ปกติไม่ต้องแก้ เอกสารเรียงตามวันที่ลงอยู่แล้ว</small>
                </label>
                <div className={css.field}>
                  <span>รูปปก (ไม่บังคับ — ปกติใช้หน้าแรกของ PDF อัตโนมัติ)</span>
                  <input ref={imageInput} type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
                  <div className={css.imageRow}>
                    {d.imagePath && <img src={d.imagePath} alt="รูปปก" />}
                    <button type="button" className={css.ghostBtn} onClick={() => imageInput.current?.click()} disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 size={14} className={css.spin} /> : <Upload size={14} />} {d.imagePath ? "เปลี่ยนรูป" : "เลือกรูป"}
                    </button>
                    {d.imagePath && (
                      <button type="button" className={css.ghostBtn} onClick={() => set("imagePath", "")}>
                        <X size={14} /> ใช้ปก PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
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
            <span className={css.switchLabel}>{d.isActive ? "เผยแพร่ทันที" : "บันทึกแบบซ่อน"}</span>
          </button>
          <div className={css.footBtns}>
            {isNew && (
              <button type="button" className={css.secondaryBtn} onClick={() => save(true)} disabled={saving !== null || progress !== null}>
                {saving === "again" && <Loader2 size={16} className={css.spin} />} บันทึกแล้วลงต่อ
              </button>
            )}
            <button type="button" className={css.primaryBtn} onClick={() => save(false)} disabled={saving !== null || progress !== null}>
              {saving === "save" ? <Loader2 size={16} className={css.spin} /> : <CheckCircle2 size={16} />}
              {isNew && d.members.length > 1 ? `บันทึก (${d.members.length} กลุ่ม)` : "บันทึก"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
