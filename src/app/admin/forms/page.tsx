/* eslint-disable @next/next/no-img-element -- ปกเอกสารเป็น data URL ที่สร้างจาก PDF ในเบราว์เซอร์ */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Folder,
  GripVertical,
  HandCoins,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquareWarning,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Signature,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import { App, Dropdown, type MenuProps } from "antd";
import { renderPdfFirstPage, getPdfCoverDataUrl } from "@/lib/pdfCover";
import { MAX_PDF_BYTES, formatBytes, isPdfFile, titleFromFileName, uploadAdminFile } from "@/lib/adminUpload";
import { FORM_GROUP_LABELS } from "@/lib/siteEventTypes";
import PdfThumb from "@/components/admin/PdfThumb";
import base from "../regulations/page.module.css";
import own from "./page.module.css";

// รวมสองไฟล์แบบต่อชื่อคลาส — คลาสที่มีทั้งสองไฟล์ (เช่น row, iconBtn) ได้สไตล์จากทั้งคู่
const css: Record<string, string> = Object.fromEntries(
  [...new Set([...Object.keys(base), ...Object.keys(own)])].map((k) => [k, [base[k], own[k]].filter(Boolean).join(" ")])
);

/* ═════════ ชนิดข้อมูลและค่าคงที่ ═════════ */
interface FormItem {
  id: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string | null;
  legacyPath: string | null;
  sortOrder: number;
  isActive: boolean;
  downloads30?: number;
}

/** หมวด — ชื่อตรงกับที่หน้าเว็บ /forms ใช้จัดกลุ่ม */
const GROUPS: { name: string; icon: React.ElementType }[] = [
  { name: "แบบฟอร์มสมัครสมาชิก", icon: UserPlus },
  { name: "แบบฟอร์มเงินฝาก-ถอน", icon: Wallet },
  { name: "แบบฟอร์มเกี่ยวกับเงินกู้", icon: HandCoins },
  { name: "แบบฟอร์มขอสวัสดิการ", icon: HeartHandshake },
  { name: "แบบฟอร์มหนังสือร้องทุกข์", icon: MessageSquareWarning },
  { name: "หนังสือแต่งตั้งผู้รับโอนประโยชน์", icon: Signature },
  { name: "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์", icon: ShieldCheck },
  { name: "แบบฟอร์มอื่นๆ", icon: Folder },
];
const GROUP_KEY = Object.fromEntries(Object.entries(FORM_GROUP_LABELS).map(([k, v]) => [v, k]));
const iconOf = (group: string) => GROUPS.find((g) => g.name === group)?.icon ?? Folder;
const groupIcon = (group: string, size = 18) => React.createElement(iconOf(group), { size });

const CATEGORIES = ["สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ", "สมาชิกทุกประเภท"];
const catRank = (c: string) => (CATEGORIES.includes(c) ? CATEGORIES.indexOf(c) : CATEGORIES.length);

/** ลำดับเดียวกับหน้าเว็บ */
const byOrder = (a: FormItem, b: FormItem) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "th");

const fileNameOf = (url: string) => decodeURIComponent(url.split("/").pop() ?? url);
const normTitle = (s: string) => s.replace(/\s+/g, "").replace(/เเ/g, "แ").toLowerCase();

/* ═════════ ตรวจชื่อแบบฟอร์ม (ชื่อดีทำให้สมาชิกค้นเจอ) ═════════ */
interface Issue {
  /** ป้ายสั้นในรายการ */
  short: string;
  /** คำอธิบายในแผงแก้ไข */
  text: string;
  fix?: (title: string) => string;
}

/** แก้คำที่พิมพ์ผิดบ่อย: "เเ" แทน "แ" และสระซ้ำ ("แแบฟอร์ม" → "แบบฟอร์ม") */
const fixSpelling = (t: string) =>
  t
    .replace(/เเ/g, "แ")
    .replace(/แแบ(?=ฟอร์ม)/g, "แบบ")
    .replace(/([เแโใไ])\1+/g, "$1");

function titleIssues(item: Pick<FormItem, "id" | "title" | "group" | "category">, all: FormItem[]): Issue[] {
  const title = item.title.trim();
  const out: Issue[] = [];
  if (!title) return out;
  if (/เเ/.test(title)) {
    out.push({ short: "สะกดผิด (เเ)", text: "พิมพ์ “เ” สองตัวแทน “แ” — สมาชิกค้นคำว่า แบบฟอร์ม จะไม่เจอ", fix: fixSpelling });
  } else if (/([เแโใไ])\1/.test(title)) {
    out.push({ short: "สะกดผิด", text: "มีสระซ้ำกันสองตัว — สมาชิกค้นหาไม่เจอ", fix: fixSpelling });
  }
  if (/^แบบฟอร์ม\s*(อื่น\s*ๆ|ทั่วไป)?$/.test(title) || title === item.group) {
    out.push({ short: "ชื่อกว้างเกินไป", text: "ชื่อกว้างเกินไป สมาชิกไม่รู้ว่าเป็นแบบฟอร์มอะไร — ใส่ชื่อเรื่องให้ชัด" });
  }
  const dup = all.some(
    (o) => o.id !== item.id && o.group === item.group && o.category === item.category && normTitle(o.title) === normTitle(title)
  );
  if (dup) out.push({ short: "ชื่อซ้ำ", text: "มีแบบฟอร์มชื่อเดียวกันในหมวดและประเภทนี้แล้ว" });
  return out;
}

/* ═════════ คำแนะนำสำหรับผู้ใช้ใหม่ (จำว่าซ่อนแล้วในเครื่องนี้) ═════════ */
const GUIDE_KEY = "admin-forms-guide-hidden";
let guideMemory = false; // สำรองเมื่อเบราว์เซอร์ไม่ให้ใช้ localStorage
const guideListeners = new Set<() => void>();
const guideStore = {
  subscribe(cb: () => void) {
    guideListeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      guideListeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  },
  get() {
    try {
      return window.localStorage.getItem(GUIDE_KEY) === "1" || guideMemory;
    } catch {
      return guideMemory;
    }
  },
  set(hidden: boolean) {
    guideMemory = hidden;
    try {
      if (hidden) window.localStorage.setItem(GUIDE_KEY, "1");
      else window.localStorage.removeItem(GUIDE_KEY);
    } catch {
      /* โหมดส่วนตัว — จำได้แค่ระหว่างเปิดหน้า */
    }
    guideListeners.forEach((l) => l());
  },
};

interface Draft {
  id?: number;
  title: string;
  group: string;
  category: string;
  fileUrl: string;
  fileLabel: string;
  legacyPath: string;
  isActive: boolean;
}

const blankDraft = (group: string, category: string): Draft => ({
  title: "",
  group,
  category,
  fileUrl: "",
  fileLabel: "",
  legacyPath: "",
  isActive: true,
});

/* ═════════ หน้า ═════════ */
export default function AdminFormsPage() {
  const { message, modal } = App.useApp();
  // ฝั่งเซิร์ฟเวอร์ถือว่าซ่อนไว้ก่อน — คนที่ปิดแล้วจะไม่เห็นการ์ดกระพริบตอนโหลด
  const guideHidden = useSyncExternalStore(guideStore.subscribe, guideStore.get, () => true);
  const [reorderKey, setReorderKey] = useState<string | null>(null);
  const [items, setItems] = useState<FormItem[] | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/forms", { credentials: "include" });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      message.error("โหลดรายการแบบฟอร์มไม่สำเร็จ");
      setItems((prev) => prev ?? []);
    }
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/forms", { credentials: "include" });
        if (!res.ok) throw new Error();
        const data: FormItem[] = await res.json();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) {
          message.error("โหลดรายการแบบฟอร์มไม่สำเร็จ");
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [message]);

  const all = useMemo(() => items ?? [], [items]);
  const issuesById = useMemo(() => {
    const m = new Map<number, Issue[]>();
    for (const i of all) {
      const list = titleIssues(i, all);
      if (!i.fileUrl) list.push({ short: "ไม่มีไฟล์", text: "ยังไม่มีไฟล์ — สมาชิกกดดาวน์โหลดไม่ได้" });
      if (list.length) m.set(i.id, list);
    }
    return m;
  }, [all]);

  // หมวดที่เลือก → แท็บประเภทสมาชิก (เหมือนหน้าเว็บ)
  const activeGroup = group ?? GROUPS.find((g) => all.some((i) => i.group === g.name))?.name ?? GROUPS[0].name;
  const extraGroups = useMemo(() => [...new Set(all.map((i) => i.group))].filter((g) => !GROUPS.some((x) => x.name === g)), [all]);
  const inGroup = useMemo(() => all.filter((i) => i.group === activeGroup), [all, activeGroup]);
  const tabs = useMemo(() => [...new Set(inGroup.map((i) => i.category))].sort((a, b) => catRank(a) - catRank(b)), [inGroup]);
  const activeTab = tab && tabs.includes(tab) ? tab : tabs[0] ?? CATEGORIES[0];

  const q = query.trim().toLowerCase();
  const searching = q !== "" || onlyIssues;
  const list = useMemo(() => {
    if (searching) {
      return all
        .filter((i) => !onlyIssues || issuesById.has(i.id))
        .filter((i) => !q || `${i.title} ${i.group} ${i.category} ${i.fileUrl ?? ""} ${i.legacyPath ?? ""}`.toLowerCase().includes(q))
        .sort((a, b) => a.group.localeCompare(b.group, "th") || catRank(a.category) - catRank(b.category) || byOrder(a, b));
    }
    return inGroup.filter((i) => i.category === activeTab).sort(byOrder);
  }, [searching, all, onlyIssues, issuesById, q, inGroup, activeTab]);

  const totalDownloads = all.reduce((n, i) => n + (i.downloads30 ?? 0), 0);

  /* ── สถานะทำงานต่อรายการ ── */
  const setBusy = (id: number, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
  };

  const toggleActive = async (item: FormItem) => {
    const next = !item.isActive;
    setBusy(item.id, true);
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isActive: next } : i)) ?? prev);
    try {
      await patch({ id: item.id, isActive: next });
      message.success(next ? "แสดงบนเว็บแล้ว" : "ซ่อนจากหน้าเว็บแล้ว");
    } catch {
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, isActive: !next } : i)) ?? prev);
      message.error("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(item.id, false);
    }
  };

  const remove = async (item: FormItem) => {
    setBusy(item.id, true);
    try {
      const res = await fetch(`/api/admin/forms?id=${item.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
      message.success("ลบแบบฟอร์มแล้ว");
    } catch {
      message.error("ลบไม่สำเร็จ");
    } finally {
      setBusy(item.id, false);
    }
  };

  /* ── จัดลำดับ (ลากวาง หรือปุ่มขึ้น/ลง) ── */
  const applyOrder = async (ordered: FormItem[]) => {
    const before = items;
    const rank = new Map(ordered.map((i, idx) => [i.id, idx]));
    setItems((prev) => prev?.map((i) => (rank.has(i.id) ? { ...i, sortOrder: rank.get(i.id)! } : i)) ?? prev);
    try {
      await patch({ order: ordered.map((i) => i.id) });
    } catch {
      setItems(before);
      message.error("จัดลำดับไม่สำเร็จ");
    }
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    applyOrder(next);
  };

  const dropOn = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    const next = list.filter((i) => i.id !== dragId);
    const dragged = list.find((i) => i.id === dragId);
    const at = next.findIndex((i) => i.id === targetId);
    if (!dragged || at < 0) return;
    const from = list.findIndex((i) => i.id === dragId);
    const to = list.findIndex((i) => i.id === targetId);
    next.splice(from < to ? at + 1 : at, 0, dragged);
    applyOrder(next);
  };

  /* ── ตัวแก้ไข ── */
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [editorSeq, setEditorSeq] = useState(0);
  const setDraft = (next: Draft | null) => {
    setDraftState(next);
    if (next) setEditorSeq((n) => n + 1);
  };
  const openNew = () => setDraft(blankDraft(activeGroup, activeTab));
  const openEdit = (item: FormItem) =>
    setDraft({
      id: item.id,
      title: item.title,
      group: item.group,
      category: item.category,
      fileUrl: item.fileUrl ?? "",
      fileLabel: item.fileUrl ? fileNameOf(item.fileUrl) : "",
      legacyPath: item.legacyPath ?? "",
      isActive: item.isActive,
    });

  const loading = items === null;
  const groupKey = GROUP_KEY[activeGroup];
  const groupDownloads = inGroup.reduce((n, i) => n + (i.downloads30 ?? 0), 0);

  // โหมดจัดลำดับ: ผูกกับหมวด+แท็บที่เปิดอยู่ — เปลี่ยนหมวด/ค้นหาแล้วออกจากโหมดเอง
  const listKey = `${activeGroup}|${activeTab}`;
  const reordering = !searching && reorderKey === listKey && list.length > 1;

  const confirmDelete = (item: FormItem) =>
    modal.confirm({
      title: "ลบแบบฟอร์มนี้ถาวร?",
      content: `“${item.title}” จะหายจากหน้าเว็บและกู้คืนไม่ได้ — ถ้าแค่ไม่อยากให้สมาชิกเห็นชั่วคราว ใช้ “ซ่อนจากหน้าเว็บ” แทน`,
      okText: "ลบถาวร",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: () => remove(item),
    });

  const rowMenu = (item: FormItem): MenuProps => ({
    items: [
      ...(item.fileUrl ? [{ key: "open", icon: <ExternalLink size={15} />, label: "เปิดดูไฟล์" }] : []),
      {
        key: "toggle",
        icon: item.isActive ? <EyeOff size={15} /> : <Eye size={15} />,
        label: item.isActive ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ",
      },
      { type: "divider" as const },
      { key: "delete", icon: <Trash2 size={15} />, label: "ลบถาวร…", danger: true },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "open" && item.fileUrl) window.open(item.fileUrl, "_blank", "noopener");
      if (key === "toggle") toggleActive(item);
      if (key === "delete") confirmDelete(item);
    },
  });

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><FileText size={22} /></span>
          <div>
            <h1 className={css.title}>แบบฟอร์มดาวน์โหลด</h1>
            <p className={css.subtitle}>
              {loading
                ? "กำลังโหลด…"
                : `${all.length} แบบฟอร์ม${totalDownloads ? ` · สมาชิกเปิด/ดาวน์โหลด ${totalDownloads.toLocaleString("th-TH")} ครั้งใน 30 วัน` : ""}`}
            </p>
          </div>
        </div>
        <div className={css.headBtns}>
          {guideHidden && (
            <button type="button" className={css.helpBtn} onClick={() => guideStore.set(false)}>
              <HelpCircle size={17} /> วิธีใช้
            </button>
          )}
          <button type="button" className={css.primaryBtn} onClick={openNew}>
            <Plus size={18} /> เพิ่มแบบฟอร์ม
          </button>
        </div>
      </header>

      {/* ── คำแนะนำสำหรับผู้ใช้ใหม่ ── */}
      {!guideHidden && (
        <section className={css.guide} aria-label="วิธีใช้งาน">
          <div className={css.guideHead}>
            <Sparkles size={18} />
            <strong>จัดการแบบฟอร์มใน 3 ขั้น</strong>
            <button type="button" onClick={() => guideStore.set(true)}>
              เข้าใจแล้ว ซ่อนคำแนะนำ <X size={14} />
            </button>
          </div>
          <ol className={css.guideSteps}>
            <li>
              <span>1</span>
              <div>
                <b>เลือกหมวด</b>
                <small>ทางซ้าย — ตรงกับหมวดที่สมาชิกเห็นบนหน้าเว็บ</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <b>เลือกประเภทสมาชิก</b>
                <small>สามัญ ก · สามัญ ข · สมทบ แยกเป็นแท็บ</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <b>กด “เพิ่ม” หรือ “แก้ไข”</b>
                <small>ลากไฟล์ PDF มาวาง ระบบตั้งชื่อและทำภาพปกให้</small>
              </div>
            </li>
          </ol>
          <p className={css.guideTip}>
            <Lightbulb size={15} /> ไม่อยากให้สมาชิกเห็นชั่วคราว ใช้ <b>ซ่อน</b> ในเมนู <MoreHorizontal size={14} /> แทนการลบ ·
            อยากสลับลำดับ กดปุ่ม <b>จัดลำดับ</b>
          </p>
        </section>
      )}

      {issuesById.size > 0 && !onlyIssues && (
        <button type="button" className={css.issueBanner} onClick={() => { setOnlyIssues(true); setQuery(""); }}>
          <AlertTriangle size={18} />
          <span>
            <strong>มีแบบฟอร์ม {issuesById.size} รายการที่ควรแก้ชื่อ</strong> — ชื่อพิมพ์ผิด กว้างเกินไป หรือซ้ำกัน ทำให้สมาชิกค้นไม่เจอ
          </span>
          <em>ดูและแก้ไข →</em>
        </button>
      )}

      <div className={css.layout}>
        {/* ── ค้นหา + หมวด ── */}
        <aside className={css.side}>
          <label className={css.sideSearch}>
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setOnlyIssues(false);
              }}
              placeholder="ค้นหาแบบฟอร์ม"
              aria-label="ค้นหาแบบฟอร์มจากทุกหมวด"
            />
            {(query || onlyIssues) && (
              <button type="button" onClick={() => { setQuery(""); setOnlyIssues(false); }} aria-label="ล้าง">
                <X size={14} />
              </button>
            )}
          </label>
          <nav className={css.groupNav} aria-label="หมวดแบบฟอร์ม">
            <span className={css.navLabel}>หมวดแบบฟอร์ม</span>
            {[...GROUPS.map((g) => g.name), ...extraGroups].map((name) => {
              const Icon = iconOf(name);
              const count = all.filter((i) => i.group === name).length;
              const on = !searching && name === activeGroup;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  className={`${css.groupBtn} ${on ? css.groupOn : ""}`}
                  onClick={() => {
                    setGroup(name);
                    setTab(null);
                    setQuery("");
                    setOnlyIssues(false);
                  }}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                  <em>{loading ? "–" : count}</em>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── รายการ ── */}
        <section className={css.panel}>
          {searching ? (
            <div className={css.groupHero}>
              <span className={css.groupHeroIcon}>{onlyIssues ? <AlertTriangle size={24} /> : <Search size={24} />}</span>
              <div className={css.groupHeroText}>
                <h2>{onlyIssues ? "แบบฟอร์มที่ควรแก้ชื่อ" : `ผลการค้นหา “${query.trim()}”`}</h2>
                <p>{list.length} รายการ{onlyIssues ? " · กด “แก้ไข” แล้วใช้ปุ่ม “แก้ให้” หรือพิมพ์ชื่อใหม่" : " · ค้นจากทุกหมวด"}</p>
              </div>
              <div className={css.groupHeroBtns}>
                <button type="button" className={css.ghostBtn} onClick={() => { setQuery(""); setOnlyIssues(false); }}>
                  <X size={15} /> กลับไปดูตามหมวด
                </button>
              </div>
            </div>
          ) : (
            <div className={css.groupHero}>
              <span className={css.groupHeroIcon}>{groupIcon(activeGroup, 26)}</span>
              <div className={css.groupHeroText}>
                <h2>{activeGroup}</h2>
                <p>
                  {inGroup.length} แบบฟอร์ม
                  {groupDownloads > 0 && ` · ดาวน์โหลด ${groupDownloads.toLocaleString("th-TH")} ครั้งใน 30 วัน`}
                </p>
              </div>
              <div className={css.groupHeroBtns}>
                {groupKey && (
                  <a href={`/forms?group=${groupKey}`} target="_blank" rel="noopener noreferrer" className={css.ghostBtn}>
                    <ExternalLink size={15} /> ดูบนหน้าเว็บ
                  </a>
                )}
                {list.length > 1 && (
                  <button
                    type="button"
                    className={reordering ? css.doneBtn : css.ghostBtn}
                    onClick={() => setReorderKey(reordering ? null : listKey)}
                    aria-pressed={reordering}
                  >
                    {reordering ? <><CheckCircle2 size={15} /> เสร็จสิ้น</> : <><ArrowUpDown size={15} /> จัดลำดับ</>}
                  </button>
                )}
                <button type="button" className={css.primaryBtnSm} onClick={openNew}>
                  <Plus size={16} /> เพิ่มในหมวดนี้
                </button>
              </div>
            </div>
          )}

          {!searching && tabs.length > 0 && (
            <div className={css.tabs} role="tablist" aria-label="ประเภทสมาชิก">
              {tabs.map((c) => (
                <button key={c} type="button" role="tab" aria-selected={c === activeTab} className={c === activeTab ? css.tabOn : css.tab} onClick={() => setTab(c)}>
                  {c} <em>{inGroup.filter((i) => i.category === c).length}</em>
                </button>
              ))}
            </div>
          )}

          {reordering && (
            <div className={css.reorderBar}>
              <ArrowUpDown size={16} />
              <span>
                <b>ลากแถว</b> หรือกด <b>ลูกศร</b> เพื่อเรียงลำดับ — สมาชิกเห็นตามลำดับนี้ บันทึกให้อัตโนมัติ
              </span>
            </div>
          )}

          {loading ? (
            <div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลดรายการ…</div>
          ) : list.length === 0 ? (
            <div className={css.emptyState}>
              <span className={css.emptyIcon}><FileUp size={30} /></span>
              <strong>{searching ? "ไม่พบแบบฟอร์มที่ตรงกับคำค้น" : "ยังไม่มีแบบฟอร์มในหมวดนี้"}</strong>
              <p>{searching ? "ลองพิมพ์คำสั้นลง เช่น “กู้” หรือ “ฝาก”" : "เพิ่มแบบฟอร์มแรกได้เลย — ลากไฟล์ PDF มาวาง ระบบตั้งชื่อให้"}</p>
              {!searching && (
                <button type="button" className={css.primaryBtnSm} onClick={openNew}>
                  <Plus size={16} /> เพิ่มแบบฟอร์มแรก
                </button>
              )}
            </div>
          ) : reordering ? (
            <ol className={`${css.list} ${css.reorderList}`}>
              {list.map((item, index) => (
                <li
                  key={item.id}
                  className={`${css.row} ${css.reorderRow} ${dragId === item.id ? css.dragging : ""} ${overId === item.id && dragId !== item.id ? css.dropTarget : ""}`}
                  draggable
                  onDragStart={(e) => {
                    setDragId(item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (dragId === null) return;
                    e.preventDefault();
                    if (overId !== item.id) setOverId(item.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropOn(item.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                >
                  <span className={css.grip} aria-hidden="true"><GripVertical size={18} /></span>
                  <span className={css.orderNo}>{index + 1}</span>
                  <span className={css.reorderTitle}>{item.title}</span>
                  <span className={css.moveBtns}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`เลื่อน ${item.title} ขึ้น`}>
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === list.length - 1} aria-label={`เลื่อน ${item.title} ลง`}>
                      <ArrowDown size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <ol className={css.list}>
              {list.map((item) => {
                const busy = busyIds.has(item.id);
                const issues = issuesById.get(item.id) ?? [];
                const dl = item.downloads30 ?? 0;
                return (
                  <li key={item.id} className={`${css.row} ${css.cardRow} ${item.isActive ? "" : css.rowHidden}`}>
                    <button type="button" className={css.rowMain} onClick={() => openEdit(item)}>
                      <PdfThumb pdf={item.fileUrl} className={`${css.cover} ${css.coverLg}`} />
                      <span className={css.rowText}>
                        <span className={css.rowTitle}>{item.title}</span>
                        <span className={css.rowMeta}>
                          <span className={item.isActive ? css.liveTag : css.hiddenTag}>
                            {item.isActive ? <><span className={css.liveDot} /> แสดงบนเว็บ</> : <><EyeOff size={12} /> ซ่อนอยู่</>}
                          </span>
                          {searching && <span className={css.memberTag}>{item.group.replace(/^แบบฟอร์ม/, "")}</span>}
                          {searching && <span className={css.catTag}>{item.category}</span>}
                          <span className={css.dl} title="จำนวนครั้งที่สมาชิกเปิดดูหรือดาวน์โหลด ใน 30 วันล่าสุด">
                            <Download size={13} /> ดาวน์โหลด <b>{dl.toLocaleString("th-TH")}</b> ครั้ง <small>(30 วัน)</small>
                          </span>
                          {issues.map((issue) => (
                            <span key={issue.text} className={css.dupTag} title={issue.text}>
                              <AlertTriangle size={12} /> {issue.short}
                            </span>
                          ))}
                        </span>
                      </span>
                    </button>

                    <div className={css.rowActions}>
                      <button type="button" className={css.editBtn} onClick={() => openEdit(item)} disabled={busy}>
                        <Pencil size={15} /> แก้ไข
                      </button>
                      <Dropdown menu={rowMenu(item)} trigger={["click"]} placement="bottomRight">
                        <button type="button" className={css.moreBtn} aria-label={`คำสั่งเพิ่มเติมของ ${item.title}`} disabled={busy}>
                          {busy ? <Loader2 size={17} className={css.spin} /> : <MoreHorizontal size={18} />}
                        </button>
                      </Dropdown>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      {draft && (
        <Editor
          key={editorSeq}
          initial={draft}
          all={all}
          onClose={() => setDraft(null)}
          onSaved={(next, saved) => {
            load();
            if (saved && !searching) {
              setGroup(saved.group);
              setTab(saved.category);
            }
            setDraft(next);
          }}
        />
      )}
    </div>
  );
}

/* ═════════ แผงเพิ่ม/แก้ไขแบบฟอร์ม ═════════ */
function Editor({
  initial,
  all,
  onClose,
  onSaved,
}: {
  initial: Draft;
  all: FormItem[];
  onClose: () => void;
  onSaved: (next: Draft | null, saved: { group: string; category: string } | null) => void;
}) {
  const { message } = App.useApp();
  const isNew = !initial.id;
  const [d, setD] = useState<Draft>(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [more, setMore] = useState(Boolean(initial.legacyPath));
  const [saving, setSaving] = useState<"save" | "again" | null>(null);
  const [triedSave, setTriedSave] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const previewToken = useRef(0);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const fileChanged = !isNew && d.fileUrl !== initial.fileUrl;

  useEffect(() => {
    if (!initial.fileUrl.toLowerCase().endsWith(".pdf")) return;
    const token = ++previewToken.current;
    getPdfCoverDataUrl(initial.fileUrl)
      .then((src) => token === previewToken.current && setPreview(src))
      .catch(() => {});
  }, [initial.fileUrl]);

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
    // เปิดแบบฟอร์มที่ชื่อมีปัญหา → พาไปที่ช่องชื่อเลย ให้เห็นคำเตือนและปุ่ม "แก้ให้"
    if (initial.id && titleIssues({ id: initial.id, title: initial.title, group: initial.group, category: initial.category }, all).length) {
      titleInput.current?.scrollIntoView({ block: "center" });
    }
    return () => {
      document.body.style.overflow = prev;
    };
    // ตั้งใจทำครั้งเดียวตอนเปิดแผง
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setD((prev) => ({ ...prev, fileLabel: file.name, fileUrl: "", title: prev.title || autoTitle }));
    setFileSize(file.size);
    setPreview(null);
    setProgress(0);

    const token = ++previewToken.current;
    file
      .arrayBuffer()
      .then((buf) => renderPdfFirstPage(buf, 360))
      .then((canvas) => token === previewToken.current && setPreview(canvas.toDataURL("image/jpeg", 0.85)))
      .catch(() => {});

    try {
      const url = await uploadAdminFile(file, "forms", setProgress);
      setD((prev) => ({ ...prev, fileUrl: url }));
      if (!autoTitle) titleInput.current?.focus();
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      setD((prev) => ({ ...prev, fileLabel: initial.fileLabel, fileUrl: initial.fileUrl }));
      setPreview(null);
    } finally {
      setProgress(null);
    }
  };

  const issues = titleIssues({ id: d.id ?? -1, title: d.title, group: d.group, category: d.category }, all);
  const problems = {
    file: !d.fileUrl ? (progress !== null ? "รออัปโหลดไฟล์ให้เสร็จก่อน" : "เลือกไฟล์ PDF") : "",
    title: !d.title.trim() ? "ใส่ชื่อแบบฟอร์ม" : "",
  };
  const blocked = Boolean(problems.file || problems.title);

  const save = async (again: boolean) => {
    setTriedSave(true);
    if (blocked) return;
    setSaving(again ? "again" : "save");
    try {
      const payload = {
        title: d.title.trim(),
        group: d.group,
        category: d.category,
        fileUrl: d.fileUrl,
        legacyPath: d.legacyPath,
        isActive: d.isActive,
      };
      const res = await fetch("/api/admin/forms", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isNew ? payload : { ...payload, id: d.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
      message.success(isNew ? "เพิ่มแบบฟอร์มแล้ว" : fileChanged ? "บันทึกแล้ว — สมาชิกจะได้ไฟล์ฉบับใหม่" : "บันทึกการแก้ไขแล้ว");
      onSaved(again ? blankDraft(d.group, d.category) : null, { group: d.group, category: d.category });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={panel} className={css.drawer} role="dialog" aria-modal="true" aria-labelledby="form-editor-title" tabIndex={-1}>
        <header className={css.drawerHead}>
          <div>
            <h2 id="form-editor-title">{isNew ? "เพิ่มแบบฟอร์ม" : "แก้ไขแบบฟอร์ม"}</h2>
            <p>{isNew ? "อัปโหลด PDF → เลือกหมวดและประเภทสมาชิก → ตั้งชื่อ → บันทึก" : `${d.group} · ${d.category}`}</p>
          </div>
          <button type="button" className={css.closeBtn} onClick={close} aria-label="ปิด">
            <X size={20} />
          </button>
        </header>

        <div className={css.drawerBody}>
          {/* 1. ไฟล์ */}
          <section className={css.step}>
            <h3><span>1</span> ไฟล์แบบฟอร์ม (PDF) {!isNew && <small>ลากไฟล์ใหม่มาวางเพื่ออัปเดตฉบับล่าสุด</small>}</h3>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
            {d.fileLabel ? (
              <div
                className={`${css.fileCard} ${dragOver ? css.dropOver : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
              >
                <div className={css.filePreview}>{preview ? <img src={preview} alt="หน้าแรกของแบบฟอร์ม" /> : <FileText size={26} />}</div>
                <div className={css.fileInfo}>
                  <strong title={d.fileLabel}>{d.fileLabel}</strong>
                  {progress !== null ? (
                    <>
                      <span className={css.progress}><span style={{ width: `${Math.round(progress * 100)}%` }} /></span>
                      <small>กำลังอัปโหลด {Math.round(progress * 100)}%</small>
                    </>
                  ) : (
                    <small className={css.ok}>
                      <CheckCircle2 size={14} /> {fileChanged ? "ไฟล์ใหม่ — กดบันทึกเพื่อใช้แทนฉบับเดิม" : "อัปโหลดแล้ว"}
                      {fileSize ? ` · ${formatBytes(fileSize)}` : ""}
                    </small>
                  )}
                  <div className={css.fileBtns}>
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"><Eye size={14} /> เปิดดู</a>
                    )}
                    <button type="button" onClick={() => fileInput.current?.click()} disabled={progress !== null}>
                      <Upload size={14} /> {isNew ? "เปลี่ยนไฟล์" : "อัปเดตไฟล์ใหม่"}
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
                <span>หรือคลิกเพื่อเลือกไฟล์</span>
              </button>
            )}
            {fileError && <p className={css.error}>{fileError}</p>}
          </section>

          {/* 2. หมวด */}
          <section className={css.step}>
            <h3><span>2</span> หมวดแบบฟอร์ม</h3>
            <div className={css.groupPick} role="radiogroup" aria-label="หมวดแบบฟอร์ม">
              {GROUPS.map((g) => {
                const Icon = g.icon;
                const on = d.group === g.name;
                return (
                  <button key={g.name} type="button" role="radio" aria-checked={on} className={on ? css.pickOn : css.pick} onClick={() => set("group", g.name)}>
                    <Icon size={18} />
                    <span>{g.name.replace(/^แบบฟอร์ม/, "")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. ประเภทสมาชิก */}
          <section className={css.step}>
            <h3><span>3</span> สำหรับสมาชิกประเภท</h3>
            <div className={css.memberPick} role="radiogroup" aria-label="ประเภทสมาชิก">
              {CATEGORIES.map((c) => {
                const on = d.category === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} className={on ? css.memberOn : css.memberChip} onClick={() => set("category", c)}>
                    {on && <CheckCircle2 size={15} />} {c}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. ชื่อ */}
          <section className={css.step}>
            <h3><span>4</span> ชื่อแบบฟอร์ม <small>ชื่อที่สมาชิกเห็นและใช้ค้นหา</small></h3>
            <input
              ref={titleInput}
              className={`${css.input} ${triedSave && problems.title ? css.invalid : ""}`}
              value={d.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="เช่น คำขอกู้เงินฉุกเฉิน"
              maxLength={255}
            />
            {triedSave && problems.title && <p className={css.error}>{problems.title}</p>}
            {issues.length > 0 && (
              <ul className={css.titleIssues}>
                {issues.map((issue) => (
                  <li key={issue.text}>
                    <AlertTriangle size={14} />
                    <span>{issue.text}</span>
                    {issue.fix && (
                      <button type="button" onClick={() => set("title", issue.fix!(d.title))}>
                        <Wand2 size={13} /> แก้ให้
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className={css.previewBox} aria-label="ตัวอย่างบนหน้าเว็บ">
              <span className={css.previewLabel}><Eye size={13} /> ตัวอย่างที่สมาชิกเห็นบนหน้าเว็บ</span>
              <div className={css.previewCard}>
                <div className={css.previewThumb}>{preview ? <img src={preview} alt="" /> : <FileText size={20} />}</div>
                <div className={css.previewText}>
                  <strong>{d.title.trim() || "ชื่อแบบฟอร์ม"}</strong>
                  <small>{d.category} · PDF</small>
                </div>
                <div className={css.previewBtns}>
                  <span><Eye size={13} /> เปิดดู</span>
                  <span className={css.previewDl}><Download size={13} /> ดาวน์โหลด</span>
                </div>
              </div>
            </div>
          </section>

          {/* ขั้นสูง */}
          <section className={css.more}>
            <button type="button" className={css.moreToggle} aria-expanded={more} onClick={() => setMore((v) => !v)}>
              <ChevronDown size={16} className={more ? css.rotated : ""} /> ตัวเลือกขั้นสูง <small>ลิงก์จากเว็บเก่า</small>
            </button>
            {more && (
              <div className={css.moreBody}>
                <label className={css.field}>
                  <span>ชื่อไฟล์บนเว็บเก่า (legacy path)</span>
                  <input className={css.input} value={d.legacyPath} onChange={(e) => set("legacyPath", e.target.value)} placeholder="เช่น 985fdf3a-5701-4c7e-85a8-015da42d2872.pdf" />
                  <small>ทำให้ลิงก์เก่าที่สมาชิกบันทึกไว้ยังเปิดแบบฟอร์มนี้ได้ · แบบฟอร์มใหม่ไม่ต้องกรอก</small>
                </label>
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
            <span className={css.switchLabel}>{d.isActive ? "แสดงบนเว็บ" : "บันทึกแบบซ่อน"}</span>
          </button>
          <div className={css.footBtns}>
            {isNew && (
              <button type="button" className={css.secondaryBtn} onClick={() => save(true)} disabled={saving !== null || progress !== null}>
                {saving === "again" && <Loader2 size={16} className={css.spin} />} บันทึกแล้วเพิ่มต่อ
              </button>
            )}
            <button type="button" className={css.primaryBtn} onClick={() => save(false)} disabled={saving !== null || progress !== null}>
              {saving === "save" ? <Loader2 size={16} className={css.spin} /> : <CheckCircle2 size={16} />} บันทึก
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
