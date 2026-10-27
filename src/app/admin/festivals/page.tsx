"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  Film,
  Image as ImageIcon,
  Info,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { App } from "antd";
import { EFFECT_OPTIONS, ANIMATION_OPTIONS, THEME_PRESETS } from "@/components/festival/themes";
import { FESTIVAL_KITS, KIT_ORDER, type FestivalKit } from "@/components/festival/kits";
import { saveFestivalDraft } from "@/lib/festivalClient";
import { LOTTIE_AREAS, buildEffectUrl, parseEffectUrl, sizeFromScale, type LottieFx } from "@/lib/lottieEffectOptions";
import ThaiDatePicker from "@/components/ui/ThaiDatePicker";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
interface FestivalTheme {
  id: number;
  name: string;
  themeKey: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  effect: string;
  intensity: number;
  effectScale: number;
  effectColor: string | null;
  effectCount: number;
  effectDelay: number;
  animation: string;
  animationUrl: string | null;
  animationScale: number;
  effectUrl: string | null;
  iconUrls: string | null;
  iconMode: string;
  iconSize: number;
  iconCount: number;
  iconSpeed: number;
  bannerText: string | null;
  bannerEmoji: string | null;
  bannerBg: string | null;
  bannerTextColor: string | null;
  colorPrimary: string | null;
  colorBg: string | null;
  festivalLogoUrl: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface FestivalForm {
  name: string;
  themeKey: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  effect: string;
  intensity: number;
  effectScale: number;
  effectColor: string;
  effectCount: number;
  effectDelay: number;
  animation: string;
  animationUrl: string;
  animationScale: number;
  effectUrl: string;
  iconUrls: string[];
  iconMode: string;
  iconSize: number;
  iconCount: number;
  iconSpeed: number;
  bannerText: string;
  bannerEmoji: string;
  bannerBg: string;
  bannerTextColor: string;
  colorPrimary: string;
  colorBg: string;
  festivalLogoUrl: string;
}

type Phase = "live" | "waiting" | "scheduled" | "ended" | "off";

/* ═════════ ตัวช่วย ═════════ */
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : "");
const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 <= b2 && b1 <= a2;
const fmt = (s: string) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};
const fmtShort = (s: string) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
/** เลื่อนวันที่ไปปีหน้า (29 ก.พ. → 28 ก.พ.) */
const plusYear = (s: string) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y + 1, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) dt.setUTCDate(0);
  return dt.toISOString().slice(0, 10);
};
const beYear = (s: string) => (s ? Number(s.slice(0, 4)) : new Date().getFullYear()) + 543;
/** ชื่อที่ระบบตั้งให้ เช่น "ลอยกระทง 2569" — ถ้าผู้ใช้ยังไม่ได้แก้ชื่อ จะเปลี่ยนตามประเภท/ปีให้เอง */
const suggestName = (kit: FestivalKit | undefined, start: string) => (kit ? `${kit.label} ${beYear(start)}` : "");
const nextYearName = (name: string) => {
  const bumped = name.replace(/(25\d\d|20\d\d)/, (y) => String(Number(y) + 1));
  return bumped === name ? `${name} (ปีหน้า)` : bumped;
};
const parseIcons = (raw: string | null) => {
  if (!raw) return [] as string[];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
};
const isBuiltinIcons = (urls: string[]) => urls.every((u) => u.startsWith("/festival/"));
const effectLabel = (v: string) => EFFECT_OPTIONS.find((o) => o.value === v)?.label ?? v;
const animationLabel = (v: string) => ANIMATION_OPTIONS.find((o) => o.value === v)?.label ?? v;
const kitOf = (key: string) => FESTIVAL_KITS[key];

/** ภาพย่อของชุดเทศกาล: ฉากส่วนท้าย + ของตกแต่งมุมขวาบน */
const sceneStyle = (kit: FestivalKit | undefined): React.CSSProperties =>
  kit
    ? {
        background: `url("${kit.art.sky}") right 8px top 6px / 34px no-repeat, url("${kit.art.footer}") center bottom / cover no-repeat, rgb(${kit.footerTint.replace(/ /g, ",")})`,
      }
    : { background: "#1f2a44" };

/** ระดับความเข้ม — ปรับจำนวน ขนาด ความเร็วของ Effect / Animation / ไอคอนพร้อมกัน */
type LevelKey = "light" | "normal" | "full";
const LEVELS: Record<LevelKey, { label: string; hint: string; values: Pick<FestivalForm, "intensity" | "iconCount" | "iconSize" | "iconSpeed" | "animationScale"> }> = {
  light: { label: "เบา", hint: "แนะนำ · ไม่รบกวนการอ่าน", values: { intensity: 15, iconCount: 6, iconSize: 32, iconSpeed: 25, animationScale: 35 } },
  normal: { label: "ปกติ", hint: "เห็นชัดขึ้น", values: { intensity: 28, iconCount: 10, iconSize: 36, iconSpeed: 35, animationScale: 45 } },
  full: { label: "จัดเต็ม", hint: "เหมาะกับวันสำคัญสั้น ๆ", values: { intensity: 50, iconCount: 18, iconSize: 42, iconSpeed: 50, animationScale: 60 } },
};
const levelOf = (f: FestivalForm): LevelKey | null =>
  (Object.keys(LEVELS) as LevelKey[]).find((k) => (Object.entries(LEVELS[k].values) as [keyof FestivalForm, number][]).every(([field, v]) => f[field] === v)) ?? null;

/** ฟอร์มเริ่มต้นจากชุดเทศกาล — Effect / Animation / Icons ตามเทศกาล · ความเข้ม "เบา" · แถบอวยพรปิดไว้ */
const formFromKit = (key: string): FestivalForm => ({ ...baseFromKit(key), ...LEVELS.light.values });
const baseFromKit = (key: string): FestivalForm => {
  const kit = kitOf(key);
  const preset = THEME_PRESETS[key];
  return {
    name: suggestName(kit, ""),
    themeKey: key,
    isActive: true,
    startDate: "",
    endDate: "",
    effect: kit.defaults.effect,
    intensity: kit.defaults.intensity,
    effectScale: 50,
    effectColor: "",
    effectCount: 2,
    effectDelay: 1500,
    animation: kit.defaults.animation,
    animationUrl: "",
    animationScale: kit.defaults.animationScale,
    effectUrl: "",
    iconUrls: kit.icons,
    iconMode: kit.defaults.iconMode,
    iconSize: kit.defaults.iconSize,
    iconCount: kit.defaults.iconCount,
    iconSpeed: kit.defaults.iconSpeed,
    bannerText: "",
    bannerEmoji: kit.emoji,
    bannerBg: preset?.bannerBg ?? "#0f1d36",
    bannerTextColor: preset?.bannerTextColor ?? "#ffffff",
    colorPrimary: "",
    colorBg: "",
    festivalLogoUrl: "",
  };
};

const formFromItem = (item: FestivalTheme): FestivalForm => ({
  name: item.name,
  themeKey: item.themeKey,
  isActive: item.isActive,
  startDate: day(item.startDate),
  endDate: day(item.endDate),
  effect: item.effect || "none",
  intensity: item.intensity ?? 50,
  effectScale: item.effectScale ?? 50,
  effectColor: item.effectColor || "",
  effectCount: item.effectCount ?? 2,
  effectDelay: item.effectDelay ?? 1500,
  animation: item.animation || "none",
  animationUrl: item.animationUrl || "",
  animationScale: item.animationScale ?? 50,
  effectUrl: item.effectUrl || "",
  iconUrls: parseIcons(item.iconUrls),
  iconMode: item.iconMode || "none",
  iconSize: item.iconSize ?? 40,
  iconCount: item.iconCount ?? 12,
  iconSpeed: item.iconSpeed ?? 35,
  bannerText: item.bannerText || "",
  bannerEmoji: item.bannerEmoji || "",
  bannerBg: item.bannerBg || "#0f1d36",
  bannerTextColor: item.bannerTextColor || "#ffffff",
  colorPrimary: item.colorPrimary || "",
  colorBg: item.colorBg || "",
  festivalLogoUrl: item.festivalLogoUrl || "",
});

const toPayload = (form: FestivalForm, bannerOn: boolean) => ({
  ...form,
  bannerText: bannerOn ? form.bannerText.trim() : "",
  iconUrls: form.iconUrls.length > 0 ? JSON.stringify(form.iconUrls) : "",
});

const hasAdvanced = (f: FestivalForm) =>
  Boolean(f.bannerText || f.festivalLogoUrl || f.colorPrimary || f.colorBg || f.animationUrl || f.effectUrl);

async function uploadFile(file: File, folder: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}

const PHASE_LABEL: Record<Phase, string> = {
  live: "กำลังแสดง",
  waiting: "รอคิว",
  scheduled: "ตั้งเวลาไว้",
  ended: "หมดช่วงแล้ว",
  off: "ปิดอยู่",
};

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/* ═════════ หน้า ═════════ */
export default function FestivalsPage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<FestivalTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveId, setLiveId] = useState<number | null>(null);
  const [mourning, setMourning] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FestivalForm>(() => formFromKit(KIT_ORDER[0]));
  const [bannerOn, setBannerOn] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fineTune, setFineTune] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  const today = todayStr();

  const fetchAll = useCallback(async () => {
    try {
      const [listRes, liveRes, mournRes] = await Promise.all([
        fetch("/api/admin/festivals", { cache: "no-store" }),
        fetch("/api/festival/active", { cache: "no-store" }),
        fetch("/api/mourning-mode", { cache: "no-store" }),
      ]);
      if (listRes.ok) setItems(await listRes.json());
      const live = liveRes.ok ? await liveRes.json().catch(() => null) : null;
      setLiveId(live && live.isActive ? live.id : null);
      const m = mournRes.ok ? await mournRes.json().catch(() => null) : null;
      setMourning(Boolean(m?.active));
    } catch (error) {
      console.error("Failed to fetch festival themes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดข้อมูลเมื่อเปิดหน้า
    fetchAll();
  }, [fetchAll]);

  const phaseOf = useCallback(
    (item: FestivalTheme): Phase => {
      if (!item.isActive) return "off";
      const s = day(item.startDate);
      const e = day(item.endDate);
      if (today < s) return "scheduled";
      if (today > e) return "ended";
      return item.id === liveId ? "live" : "waiting";
    },
    [today, liveId]
  );

  const liveItem = items.find((i) => i.id === liveId) ?? null;
  const nextItem = useMemo(
    () =>
      items
        .filter((i) => i.isActive && day(i.startDate) > today)
        .sort((a, b) => day(a.startDate).localeCompare(day(b.startDate)))[0] ?? null,
    [items, today]
  );

  /** ธีมที่เปิดอยู่และช่วงวันที่ทับกัน — ตอนบันทึก ระบบจะปิดธีมเหล่านี้ให้เอง */
  const clashesWith = useCallback(
    (start: string, end: string, exceptId: number | null) =>
      start && end
        ? items.filter((i) => i.id !== exceptId && i.isActive && overlaps(start, end, day(i.startDate), day(i.endDate)))
        : [],
    [items]
  );

  const formClashes = form.isActive ? clashesWith(form.startDate, form.endDate, editingId) : [];
  const dateError = form.startDate && form.endDate && form.endDate < form.startDate ? "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น" : "";
  const kit = kitOf(form.themeKey);

  /* ── เปิด/ปิดหน้าต่างแก้ไข ── */
  const openCreate = () => {
    setEditingId(null);
    setForm(formFromKit(KIT_ORDER[0]));
    setBannerOn(false);
    setAdvancedOpen(false);
    setFineTune(false);
    setModalOpen(true);
  };

  const openEdit = (item: FestivalTheme) => {
    const f = formFromItem(item);
    setEditingId(item.id);
    setForm(f);
    setBannerOn(Boolean(f.bannerText));
    setAdvancedOpen(hasAdvanced(f));
    setFineTune(levelOf(f) === null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const set = <K extends keyof FestivalForm>(key: K, value: FestivalForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  /** เลือกประเภท = ได้ชุดเทศกาลครบ (ตกแต่งทั้งเว็บ + Effect + Animation + Icons) — ไอคอนที่อัปโหลดเองไม่ถูกแทน */
  const pickKit = (key: string) => {
    const next = kitOf(key);
    if (!next) return;
    setForm((prev) => {
      const prevKit = kitOf(prev.themeKey);
      const preset = THEME_PRESETS[key];
      const autoName = !prev.name.trim() || prev.name === suggestName(prevKit, prev.startDate);
      return {
        ...prev,
        themeKey: key,
        name: autoName ? suggestName(next, prev.startDate) : prev.name,
        effect: next.defaults.effect,
        animation: next.defaults.animation,
        iconMode: next.defaults.iconMode,
        // คงระดับความเข้มที่เลือกไว้ (ถ้าปรับเองไว้ ใช้ "เบา")
        ...LEVELS[levelOf(prev) ?? "light"].values,
        iconUrls: isBuiltinIcons(prev.iconUrls) ? next.icons : prev.iconUrls,
        bannerEmoji: next.emoji,
        bannerBg: preset?.bannerBg ?? prev.bannerBg,
        bannerTextColor: preset?.bannerTextColor ?? prev.bannerTextColor,
      };
    });
  };

  const setStart = (v: string) =>
    setForm((prev) => {
      const k = kitOf(prev.themeKey);
      const autoName = !prev.name.trim() || prev.name === suggestName(k, prev.startDate);
      return { ...prev, startDate: v, name: autoName ? suggestName(k, v) : prev.name };
    });

  /* ── อัปโหลด ── */
  const handleUploadLottie = async (e: React.ChangeEvent<HTMLInputElement>, field: "animationUrl" | "effectUrl") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) return void message.warning("รองรับเฉพาะไฟล์ .json (Lottie)");
    if (file.size > 5 * 1024 * 1024) return void message.warning("ขนาดไฟล์ต้องไม่เกิน 5MB");
    setUploading(field);
    const url = await uploadFile(file, "lottie");
    setUploading(null);
    // เปลี่ยนไฟล์ Effect: คงค่าปรับเดิม (ขนาด บริเวณ ฯลฯ) ไว้
    if (url) setForm((prev) => ({ ...prev, [field]: field === "effectUrl" ? buildEffectUrl(url, parseEffectUrl(prev.effectUrl).fx) : url }));
    else message.error("อัปโหลดไม่สำเร็จ");
  };

  const handleUploadIcons = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const allowed = [".png", ".svg", ".webp", ".gif", ".jpg", ".jpeg"];
    const ok = files.filter((f) => allowed.includes(f.name.slice(f.name.lastIndexOf(".")).toLowerCase()) && f.size <= 10 * 1024 * 1024);
    if (ok.length === 0) return void message.warning("รองรับเฉพาะไฟล์ .png .svg .webp .gif .jpg (ไม่เกิน 10MB)");
    setUploading("icons");
    const urls: string[] = [];
    for (const f of ok) {
      const url = await uploadFile(f, "festival-icons");
      if (url) urls.push(url);
    }
    setUploading(null);
    if (urls.length === 0) return void message.error("อัปโหลดไม่สำเร็จ");
    // อัปโหลดรูปของตัวเอง = ใช้แทนชุดไอคอนของเทศกาล
    setForm((prev) => ({ ...prev, iconUrls: [...(isBuiltinIcons(prev.iconUrls) ? [] : prev.iconUrls), ...urls] }));
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".png", ".svg", ".webp", ".jpg", ".jpeg", ".gif"].includes(ext)) return void message.warning("รองรับเฉพาะไฟล์รูปภาพ (.png .svg .webp .jpg)");
    if (file.size > 10 * 1024 * 1024) return void message.warning("ขนาดไฟล์ต้องไม่เกิน 10MB");
    setUploading("logo");
    const url = await uploadFile(file, "festival-logo");
    setUploading(null);
    if (url) set("festivalLogoUrl", url);
    else message.error("อัปโหลดไม่สำเร็จ");
  };

  /* ── บันทึก / เปิดปิด / ลบ / ใช้ซ้ำ ── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return void message.warning("กรุณากรอกชื่อ วันเริ่มต้น และวันสิ้นสุด");
    if (dateError) return void message.warning(dateError);
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/admin/festivals/${editingId}` : "/api/admin/festivals", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload({ ...form, name: form.name.trim() }, bannerOn)),
      });
      if (res.ok) {
        message.success(formClashes.length ? `บันทึกแล้ว · ปิด ${formClashes.map((c) => c.name).join(", ")} ให้แล้ว` : "บันทึกแล้ว");
        closeModal();
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      message.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const putActive = (id: number, isActive: boolean) =>
    fetch(`/api/admin/festivals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }).then((r) => r.ok);

  const handleToggle = async (item: FestivalTheme) => {
    const turnOn = !item.isActive;
    const clashes = turnOn ? clashesWith(day(item.startDate), day(item.endDate), item.id) : [];
    const run = async () => {
      try {
        const ok = await putActive(item.id, turnOn);
        if (!ok) return void message.error("เปลี่ยนสถานะไม่สำเร็จ");
        await Promise.all(clashes.map((c) => putActive(c.id, false)));
        message.success(turnOn ? "เปิดธีมแล้ว" : "ปิดธีมแล้ว — หน้าเว็บกลับเป็นแบบปกติ");
        fetchAll();
      } catch {
        message.error("เปลี่ยนสถานะไม่สำเร็จ");
      }
    };
    if (clashes.length === 0) return run();
    modal.confirm({
      title: "ช่วงวันที่ทับกับธีมที่เปิดอยู่",
      content: `หน้าเว็บแสดงได้ทีละธีม — เปิด “${item.name}” แล้วจะปิด ${clashes.map((c) => `“${c.name}”`).join(", ")} ให้`,
      okText: "เปิดธีมนี้",
      cancelText: "ยกเลิก",
      onOk: run,
    });
  };

  const handleDelete = (item: FestivalTheme) => {
    modal.confirm({
      title: `ลบ “${item.name}”?`,
      content: "ลบแล้วกู้คืนไม่ได้ — ถ้าจะใช้อีกปีหน้า กด “ใช้ซ้ำปีหน้า” ก่อนลบ หรือแค่ปิดไว้",
      okText: "ลบ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        const res = await fetch(`/api/admin/festivals/${item.id}`, { method: "DELETE" }).catch(() => null);
        if (res?.ok) {
          message.success("ลบแล้ว");
          fetchAll();
        } else message.error("ลบไม่สำเร็จ");
      },
    });
  };

  /** ใช้ซ้ำปีหน้า: เปิดหน้าต่างสร้างใหม่ด้วยค่าเดิม + วันที่เลื่อนไป 1 ปี (ยังไม่บันทึกจนกว่าจะกดบันทึก) */
  const handleDuplicate = (item: FestivalTheme) => {
    const f = formFromItem(item);
    const next = { ...f, name: nextYearName(f.name), startDate: plusYear(f.startDate), endDate: plusYear(f.endDate), isActive: true };
    setEditingId(null);
    setForm(next);
    setBannerOn(Boolean(next.bannerText));
    setAdvancedOpen(hasAdvanced(next));
    setFineTune(levelOf(next) === null);
    setModalOpen(true);
  };

  /** ดูตัวอย่างบนหน้าเว็บจริง — เห็นเฉพาะเจ้าหน้าที่ที่ล็อกอินในเบราว์เซอร์นี้ */
  const openPreview = (f: FestivalForm, banner: boolean) => {
    saveFestivalDraft(toPayload(f, banner) as unknown as Record<string, unknown>);
    window.open("/?festival-preview=draft", "_blank", "noopener");
  };

  /* ── ข้อความสถานะใต้สวิตช์ ── */
  const activeSentence = (() => {
    if (!form.isActive) return { tone: "muted", text: "ปิดอยู่ — สมาชิกจะไม่เห็นธีมนี้ แม้อยู่ในช่วงวันที่" };
    if (!form.startDate || !form.endDate) return { tone: "muted", text: "เปิดใช้งาน — เลือกช่วงวันที่ ธีมจะแสดงเองเฉพาะช่วงนั้น" };
    if (dateError) return { tone: "warn", text: dateError };
    if (today < form.startDate)
      return { tone: "info", text: `จะเริ่มแสดงเองวันที่ ${fmt(form.startDate)} และหายไปเองหลังวันที่ ${fmt(form.endDate)}` };
    if (today > form.endDate) return { tone: "warn", text: "เลยช่วงวันที่แล้ว — บันทึกไว้ได้ แต่จะไม่แสดงบนเว็บ" };
    return { tone: "ok", text: `แสดงบนเว็บทันทีหลังบันทึก ถึงวันที่ ${fmt(form.endDate)} แล้วกลับเป็นแบบปกติเอง` };
  })();

  /* ── ไทม์ไลน์ปีนี้ ── */
  const year = new Date().getFullYear();
  const yStart = `${year}-01-01`;
  const yEnd = `${year}-12-31`;
  const yearDays = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const dayIndex = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return (Date.UTC(y, m - 1, d) - Date.UTC(year, 0, 1)) / 86400000;
  };
  const timeline = items
    .filter((i) => overlaps(day(i.startDate), day(i.endDate), yStart, yEnd))
    .sort((a, b) => day(a.startDate).localeCompare(day(b.startDate)));

  if (loading) {
    return (
      <div className={css.state}>
        <Loader2 size={22} className={css.spin} /> กำลังโหลด...
      </div>
    );
  }

  return (
    <div className={css.page}>
      {/* ═══ หัวหน้า ═══ */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}>
            <Sparkles size={22} />
          </span>
          <div>
            <h1 className={css.title}>ธีมเทศกาล</h1>
            <p className={css.subtitle}>เปลี่ยนหน้าตาเว็บตามเทศกาล ตั้งช่วงวันที่ไว้ แล้วเว็บจะเปลี่ยนและกลับเป็นแบบปกติเอง</p>
          </div>
        </div>
        <button type="button" className={css.primaryBtn} onClick={openCreate}>
          <Plus size={18} /> สร้างธีมเทศกาล
        </button>
      </header>

      {/* ═══ สถานะตอนนี้ ═══ */}
      {mourning && (
        <div className={css.mourning} role="alert">
          <Moon size={18} />
          <span>
            <strong>โหมดไว้อาลัยเปิดอยู่</strong> — ธีมเทศกาลทั้งหมดถูกซ่อนไว้ หน้าเว็บจะไม่แสดงธีมใดจนกว่าจะปิดโหมดไว้อาลัย
          </span>
        </div>
      )}

      <section className={css.nowBar}>
        <div className={css.nowScene} style={sceneStyle(liveItem && !mourning ? kitOf(liveItem.themeKey) : undefined)} aria-hidden="true">
          {(!liveItem || mourning) && <span className={css.nowPlain}>{mourning ? "ไว้อาลัย" : "ปกติ"}</span>}
        </div>
        <div className={css.nowText}>
          <small>ตอนนี้หน้าเว็บแสดง</small>
          {liveItem && !mourning ? (
            <strong>
              {kitOf(liveItem.themeKey)?.emoji} {liveItem.name}
              <em> · ถึง {fmt(day(liveItem.endDate))}</em>
            </strong>
          ) : (
            <strong>{mourning ? "โหมดไว้อาลัย" : "หน้าตาปกติ (ไม่มีธีมเทศกาล)"}</strong>
          )}
          {nextItem && (
            <span className={css.nowNext}>
              <CalendarDays size={14} /> ถัดไป: {kitOf(nextItem.themeKey)?.emoji} {nextItem.name} เริ่ม {fmt(day(nextItem.startDate))}
            </span>
          )}
        </div>
        {liveItem && (
          <div className={css.nowActions}>
            <button type="button" className={css.secondaryBtn} onClick={() => openPreview(formFromItem(liveItem), Boolean(liveItem.bannerText))}>
              <Eye size={16} /> ดูบนเว็บ
            </button>
            <button type="button" className={css.ghostBtn} onClick={() => handleToggle(liveItem)}>
              <Power size={15} /> ปิดตอนนี้
            </button>
          </div>
        )}
      </section>

      {/* ═══ ไทม์ไลน์ปีนี้ ═══ */}
      {timeline.length > 0 && (
        <section className={css.panel}>
          <h2 className={css.panelTitle}>
            <CalendarDays size={17} /> ปฏิทินธีม ปี {year + 543}
          </h2>
          <div className={css.timeline}>
            <div className={css.tlMonths}>
              {MONTHS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <div className={css.tlRows}>
              {today >= yStart && today <= yEnd && (
                <span className={css.tlToday} style={{ left: `${(dayIndex(today) / yearDays) * 100}%` }} title={`วันนี้ ${fmt(today)}`} />
              )}
              {timeline.map((i) => {
                const s = day(i.startDate) < yStart ? yStart : day(i.startDate);
                const e = day(i.endDate) > yEnd ? yEnd : day(i.endDate);
                const left = (dayIndex(s) / yearDays) * 100;
                const width = Math.max(((dayIndex(e) - dayIndex(s) + 1) / yearDays) * 100, 1.2);
                const phase = phaseOf(i);
                return (
                  <div key={i.id} className={css.tlRow}>
                    <button
                      type="button"
                      className={`${css.tlBar} ${css[`tl_${phase}`]}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={() => openEdit(i)}
                      title={`${i.name} · ${fmt(day(i.startDate))} – ${fmt(day(i.endDate))} · ${PHASE_LABEL[phase]}`}
                    >
                      <span className={`${css.tlLabel} ${left + width > 72 ? css.tlLabelLeft : ""}`}>
                        {kitOf(i.themeKey)?.emoji} {i.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={css.tlLegend}>
            <span><i className={css.tl_live} /> กำลังแสดง</span>
            <span><i className={css.tl_scheduled} /> ตั้งเวลาไว้</span>
            <span><i className={css.tl_off} /> ปิด / หมดช่วง</span>
          </div>
        </section>
      )}

      {/* ═══ รายการธีม ═══ */}
      {items.length === 0 ? (
        <div className={css.empty}>
          <span className={css.emptyIcon}>🏮</span>
          <p>ยังไม่มีธีมเทศกาล — กด “สร้างธีมเทศกาล” แล้วเลือกเทศกาล ระบบจะจัดชุดตกแต่งให้ครบ</p>
          <button type="button" className={css.primaryBtn} onClick={openCreate}>
            <Plus size={18} /> สร้างธีมเทศกาล
          </button>
        </div>
      ) : (
        <div className={css.grid}>
          {items.map((item) => {
            const k = kitOf(item.themeKey);
            const phase = phaseOf(item);
            const icons = parseIcons(item.iconUrls);
            return (
              <article key={item.id} className={`${css.card} ${phase === "live" ? css.cardLive : ""}`}>
                <div className={css.cardScene} style={sceneStyle(k)}>
                  <span className={`${css.badge} ${css[`badge_${phase}`]}`}>
                    {phase === "live" && <span className={css.liveDot} />}
                    {PHASE_LABEL[phase]}
                  </span>
                </div>
                <div className={css.cardBody}>
                  <div className={css.cardTitle}>
                    <span className={css.cardEmoji}>{k?.emoji ?? "🎨"}</span>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{k?.label ?? item.themeKey}</p>
                    </div>
                  </div>
                  <p className={css.cardDates}>
                    <CalendarDays size={14} /> {fmt(day(item.startDate))} – {fmt(day(item.endDate))}
                  </p>
                  <div className={css.cardChips}>
                    {item.effect !== "none" && <span>{effectLabel(item.effect)}</span>}
                    {(item.animation !== "none" || item.animationUrl) && <span>{item.animationUrl ? "🎞️ Animation ของตัวเอง" : animationLabel(item.animation)}</span>}
                    {item.iconMode !== "none" && icons.length > 0 && <span>{item.iconMode === "falling" ? "⬇️ ไอคอนตกลงมา" : "↔️ ไอคอนเด้งไปมา"}</span>}
                    {item.bannerText && <span>📢 แถบอวยพร</span>}
                  </div>
                  {phase === "waiting" && <p className={css.cardNote}>อยู่ในช่วงวันที่ แต่มีธีมอื่นที่สร้างทีหลังแสดงอยู่</p>}
                </div>
                <div className={css.cardActions}>
                  <button
                    type="button"
                    className={`${css.switchBtn} ${item.isActive ? css.switchOn : ""}`}
                    onClick={() => handleToggle(item)}
                    aria-pressed={item.isActive}
                    title={item.isActive ? "ปิดธีมนี้" : "เปิดธีมนี้"}
                  >
                    <span className={css.switchTrack}>
                      <span className={css.switchKnob} />
                    </span>
                    {item.isActive ? "เปิด" : "ปิด"}
                  </button>
                  <span className={css.flex} />
                  <button type="button" className={css.iconBtn} onClick={() => openPreview(formFromItem(item), Boolean(item.bannerText))} title="ดูตัวอย่างบนเว็บ">
                    <Eye size={16} />
                  </button>
                  <button type="button" className={css.iconBtn} onClick={() => handleDuplicate(item)} title="ใช้ซ้ำปีหน้า (คัดลอกพร้อมเลื่อนวันที่ไป 1 ปี)">
                    <Copy size={16} />
                  </button>
                  <button type="button" className={css.iconBtn} onClick={() => openEdit(item)} title="แก้ไข">
                    <Pencil size={16} />
                  </button>
                  <button type="button" className={`${css.iconBtn} ${css.iconDanger}`} onClick={() => handleDelete(item)} title="ลบ">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ═══ หน้าต่างสร้าง/แก้ไข ═══ */}
      {modalOpen && (
        <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className={css.modal} role="dialog" aria-modal="true" aria-labelledby="festival-modal-title">
            <div className={css.modalHead}>
              <h2 id="festival-modal-title">{editingId ? "แก้ไขธีมเทศกาล" : "สร้างธีมเทศกาล"}</h2>
              <button type="button" className={css.iconBtn} onClick={closeModal} aria-label="ปิด">
                <X size={18} />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* ── 1. เลือกเทศกาล ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>1</span> เลือกเทศกาล
                </h3>
                <p className={css.stepHint}>ได้ชุดตกแต่งทั้งเว็บ (ภาพมุมจอ ขอบจอ รอยต่อหน้าแรก ฉากส่วนท้าย สีเว็บ) พร้อม Effect, Animation และไอคอนของเทศกาลนั้น</p>
                <div className={css.kits}>
                  {KIT_ORDER.map((key) => {
                    const k = FESTIVAL_KITS[key];
                    const on = form.themeKey === key;
                    return (
                      <button key={key} type="button" className={`${css.kit} ${on ? css.kitOn : ""}`} onClick={() => pickKit(key)} aria-pressed={on}>
                        <span className={css.kitScene} style={sceneStyle(k)}>
                          {on && <CheckCircle2 size={18} className={css.kitCheck} />}
                        </span>
                        <span className={css.kitText}>
                          <strong>
                            {k.emoji} {k.label}
                          </strong>
                          <small>{k.tagline}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── 2. ชื่อและช่วงเวลา ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>2</span> ชื่อและช่วงเวลา
                </h3>
                <label className={css.field}>
                  <span className={css.label}>ชื่อ (เห็นเฉพาะในหน้านี้)</span>
                  <input className={css.input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น ลอยกระทง 2569" />
                </label>
                <div className={css.row2}>
                  <div className={css.field}>
                    <span className={css.label}>วันเริ่มต้น</span>
                    <ThaiDatePicker value={form.startDate} onChange={setStart} placeholder="เลือกวันเริ่มต้น" />
                  </div>
                  <div className={css.field}>
                    <span className={css.label}>วันสิ้นสุด</span>
                    <ThaiDatePicker value={form.endDate} onChange={(v) => set("endDate", v)} placeholder="เลือกวันสิ้นสุด" />
                  </div>
                </div>
                <div className={css.activeRow}>
                  <button
                    type="button"
                    className={`${css.switchBtn} ${form.isActive ? css.switchOn : ""}`}
                    onClick={() => set("isActive", !form.isActive)}
                    aria-pressed={form.isActive}
                  >
                    <span className={css.switchTrack}>
                      <span className={css.switchKnob} />
                    </span>
                    {form.isActive ? "เปิดใช้งาน" : "ปิดไว้ก่อน"}
                  </button>
                  <p className={`${css.activeText} ${css[`tone_${activeSentence.tone}`]}`}>{activeSentence.text}</p>
                </div>
                {formClashes.length > 0 && (
                  <div className={css.warn}>
                    <AlertTriangle size={16} />
                    <span>
                      ช่วงวันที่ทับกับ {formClashes.map((c) => `“${c.name}” (${fmtShort(day(c.startDate))} – ${fmtShort(day(c.endDate))})`).join(", ")} — หน้าเว็บแสดงได้ทีละธีม
                      เมื่อบันทึก ระบบจะ<strong>ปิดธีมนั้นให้อัตโนมัติ</strong>
                    </span>
                  </div>
                )}
              </section>

              {/* ── 3. ความเข้ม ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>3</span> ความเข้มของเอฟเฟกต์
                </h3>
                <div className={css.levels} role="radiogroup" aria-label="ความเข้มของเอฟเฟกต์">
                  {(Object.keys(LEVELS) as LevelKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={levelOf(form) === k}
                      className={`${css.level} ${levelOf(form) === k ? css.levelOn : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, ...LEVELS[k].values }))}
                    >
                      <strong>{LEVELS[k].label}</strong>
                      <small>{LEVELS[k].hint}</small>
                    </button>
                  ))}
                </div>
                <p className={css.stepHint}>
                  {levelOf(form) ? "" : "ปรับเองอยู่ (กดเลือกระดับเพื่อกลับไปใช้ค่าสำเร็จ) · "}
                  ของที่ขยับแสดงเฉพาะหน้าแรก มือถือแสดงแบบเบากว่านี้ เริ่มเต็มที่แล้วค่อย ๆ ซาลงเอง และผู้ชมกดปิดได้ ·{" "}
                  <button type="button" className={css.linkBtn} onClick={() => setFineTune((v) => !v)} aria-expanded={fineTune}>
                    <Settings2 size={12} /> {fineTune ? "ซ่อนการปรับละเอียด" : "ปรับละเอียด"}
                  </button>
                </p>
              </section>

              {/* ── 4. Effect ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>4</span> <Sparkles size={16} /> Effect <small>อนุภาคลอยทั่วจอ</small>
                </h3>
                <div className={css.row2}>
                  <label className={css.field}>
                    <span className={css.label}>รูปแบบ</span>
                    <select className={css.input} value={form.effect} onChange={(e) => set("effect", e.target.value)}>
                      {EFFECT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                          {o.value === kit?.defaults.effect && o.value !== "none" ? " (แนะนำ)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.effect !== "none" && fineTune && (
                    <Slider label="ความหนาแน่น" value={form.intensity} min={5} max={100} unit="%" onChange={(v) => set("intensity", v)} hint="แนะนำ 20–40% ไม่รบกวนการอ่าน" />
                  )}
                </div>
                {form.effect !== "none" && fineTune && (
                  <div className={css.row2}>
                    <Slider label="ขนาด" value={form.effectScale} min={10} max={100} unit="%" onChange={(v) => set("effectScale", v)} />
                    <div className={css.field}>
                      <span className={css.label}>สี (เว้นว่าง = สีของเทศกาล)</span>
                      <div className={css.colorRow}>
                        <input type="color" className={css.colorPicker} value={form.effectColor || "#ffffff"} onChange={(e) => set("effectColor", e.target.value)} />
                        <input className={css.input} value={form.effectColor} onChange={(e) => set("effectColor", e.target.value)} placeholder="สีเริ่มต้น" />
                        {form.effectColor && (
                          <button type="button" className={css.ghostBtn} onClick={() => set("effectColor", "")}>
                            ล้าง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ── 5. Animation ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>5</span> <Film size={16} /> Animation <small>ตัวการ์ตูนผ่านจอเป็นระยะ</small>
                </h3>
                {kit?.formal && (
                  <p className={css.note}>
                    <Info size={15} /> {kit.label}เป็นงานทางการ แนะนำ “ไม่มี animation” เพื่อความสุภาพ
                  </p>
                )}
                <div className={css.row2}>
                  <label className={css.field}>
                    <span className={css.label}>รูปแบบ</span>
                    <select className={css.input} value={form.animation} onChange={(e) => set("animation", e.target.value)}>
                      {ANIMATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                          {o.value === kit?.defaults.animation && o.value !== "none" ? " (แนะนำ)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(form.animation !== "none" || form.animationUrl) && fineTune && (
                    <Slider label="ขนาด" value={form.animationScale} min={10} max={100} unit="%" onChange={(v) => set("animationScale", v)} />
                  )}
                </div>
              </section>

              {/* ── 6. Icons ── */}
              <section className={css.step}>
                <h3 className={css.stepTitle}>
                  <span className={css.stepNo}>6</span> <ImageIcon size={16} /> ไอคอน <small>รูปตกลงมา / เด้งไปมา</small>
                </h3>
                <div className={css.segment} role="radiogroup" aria-label="การแสดงไอคอน">
                  {[
                    { v: "none", label: "ไม่แสดง" },
                    { v: "falling", label: "⬇️ ตกลงมา" },
                    { v: "bouncing", label: "↔️ เด้งไปมา" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={form.iconMode === o.v}
                      className={form.iconMode === o.v ? css.segOn : ""}
                      onClick={() => set("iconMode", o.v)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {form.iconMode !== "none" && (
                  <>
                    <div className={css.iconPick}>
                      <div className={css.iconList}>
                        {form.iconUrls.map((url, idx) => (
                          <span key={`${url}-${idx}`} className={css.iconThumb}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" />
                            <button type="button" onClick={() => set("iconUrls", form.iconUrls.filter((_, i) => i !== idx))} aria-label="เอาออก">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <label className={css.iconAdd} title="อัปโหลดรูปของตัวเอง (เลือกได้หลายไฟล์)">
                          {uploading === "icons" ? <Loader2 size={18} className={css.spin} /> : <Upload size={18} />}
                          <span>เพิ่มรูป</span>
                          <input ref={iconFileRef} type="file" accept=".png,.svg,.webp,.gif,.jpg,.jpeg" multiple onChange={handleUploadIcons} disabled={uploading === "icons"} hidden />
                        </label>
                      </div>
                      <p className={css.stepHint}>
                        {form.iconUrls.length === 0
                          ? "ยังไม่มีรูป — ไอคอนจะไม่แสดง"
                          : isBuiltinIcons(form.iconUrls)
                            ? `ใช้ชุดไอคอนของ${kit?.label ?? "เทศกาล"} · อัปโหลดรูปเองได้ (.png .svg .webp)`
                            : "ใช้รูปที่อัปโหลดเอง"}
                        {kit && !(form.iconUrls.length === kit.icons.length && form.iconUrls.every((u, i) => u === kit.icons[i])) && (
                          <>
                            {" · "}
                            <button type="button" className={css.linkBtn} onClick={() => set("iconUrls", kit.icons)}>
                              <RotateCcw size={12} /> ใช้ชุดไอคอนของ{kit.label}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                    {fineTune && <div className={css.row3}>
                      <Slider label="ขนาด" value={form.iconSize} min={20} max={120} unit="px" onChange={(v) => set("iconSize", v)} />
                      <Slider label="จำนวน" value={form.iconCount} min={3} max={50} onChange={(v) => set("iconCount", v)} />
                      <Slider label="ความเร็ว" value={form.iconSpeed} min={10} max={100} unit="%" onChange={(v) => set("iconSpeed", v)} />
                    </div>}
                  </>
                )}
              </section>

              {/* ── ตั้งค่าเพิ่มเติม (พับไว้) ── */}
              <details className={css.advanced} open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}>
                <summary>
                  <Settings2 size={16} /> ตั้งค่าเพิ่มเติม <small>แถบอวยพร · โลโก้ · สีเว็บ · ไฟล์ Lottie</small>
                  <ChevronDown size={16} className={css.chev} />
                </summary>
                <div className={css.advBody}>
                  {/* แถบอวยพร */}
                  <div className={css.advBlock}>
                    <div className={css.activeRow}>
                      <button type="button" className={`${css.switchBtn} ${bannerOn ? css.switchOn : ""}`} onClick={() => setBannerOn((v) => !v)} aria-pressed={bannerOn}>
                        <span className={css.switchTrack}>
                          <span className={css.switchKnob} />
                        </span>
                        แถบอวยพรด้านบนเว็บ
                      </button>
                      <p className={css.activeText}>{bannerOn ? "แสดงแถบข้อความเหนือเมนู สมาชิกกดปิดได้" : "ไม่แสดง (ค่าเริ่มต้น)"}</p>
                    </div>
                    {bannerOn && (
                      <>
                        <div className={css.row2}>
                          <label className={css.field}>
                            <span className={css.label}>ข้อความ</span>
                            <input className={css.input} value={form.bannerText} onChange={(e) => set("bannerText", e.target.value)} placeholder={`เช่น สุขสันต์วัน${kit?.label ?? "เทศกาล"}`} />
                          </label>
                          <label className={css.field}>
                            <span className={css.label}>Emoji ซ้าย-ขวา</span>
                            <input className={css.input} value={form.bannerEmoji} onChange={(e) => set("bannerEmoji", e.target.value)} />
                          </label>
                        </div>
                        <div className={css.row2}>
                          <ColorField label="สีพื้นแถบ" value={form.bannerBg} fallback="#0f1d36" onChange={(v) => set("bannerBg", v)} />
                          <ColorField label="สีตัวอักษร" value={form.bannerTextColor} fallback="#ffffff" onChange={(v) => set("bannerTextColor", v)} />
                        </div>
                        {form.bannerText && (
                          <div className={css.bannerPreview} style={{ background: form.bannerBg || "#0f1d36", color: form.bannerTextColor || "#fff" }}>
                            {form.bannerEmoji} {form.bannerText} {form.bannerEmoji}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* โลโก้ */}
                  <div className={css.advBlock}>
                    <span className={css.label}>โลโก้เทศกาล (แทนโลโก้เดิมชั่วคราว · เว้นว่าง = โลโก้เดิม)</span>
                    {form.festivalLogoUrl ? (
                      <div className={css.fileRow}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.festivalLogoUrl} alt="" className={css.logoThumb} />
                        <span className={css.fileName}>{form.festivalLogoUrl.split("/").pop()}</span>
                        <button type="button" className={css.ghostBtn} onClick={() => set("festivalLogoUrl", "")}>
                          เอาออก
                        </button>
                      </div>
                    ) : (
                      <UploadButton label="อัปโหลดโลโก้" accept=".png,.svg,.webp,.jpg,.jpeg,.gif" busy={uploading === "logo"} onChange={handleUploadLogo} />
                    )}
                  </div>

                  {/* สีเว็บ */}
                  <div className={css.advBlock}>
                    <span className={css.label}>สีเว็บ — ชุดเทศกาลจัดสีให้แล้ว เว้นว่างไว้ได้ ใส่เฉพาะเมื่ออยากทับสี</span>
                    <div className={css.row2}>
                      <ColorField label="สีเน้น (ปุ่ม ลิงก์ เส้น)" value={form.colorPrimary} fallback="#E8652B" onChange={(v) => set("colorPrimary", v)} clearable />
                      <ColorField label="สีพื้นเมนู / ส่วนท้าย" value={form.colorBg} fallback="#0f1d36" onChange={(v) => set("colorBg", v)} clearable />
                    </div>
                  </div>

                  {/* Lottie */}
                  <div className={css.advBlock}>
                    <span className={css.label}>ไฟล์ Lottie (.json จาก LottieFiles) — ใช้แทนของในระบบ</span>
                    <div className={css.row2}>
                      <LottieField
                        title="Animation"
                        hint="วิ่ง/บินข้ามจอเป็นครั้งคราว — เหมาะกับตัวการ์ตูน (ซานต้า ช้าง กามเทพ)"
                        url={form.animationUrl}
                        busy={uploading === "animationUrl"}
                        onUpload={(e) => handleUploadLottie(e, "animationUrl")}
                        onClear={() => set("animationUrl", "")}
                      />
                      <LottieField
                        title="Effect"
                        hint="ระเบิด/เล่นตรงจุดสุ่มบนฟ้า ทีละลูก — เหมาะกับพลุ ดอกไม้ไฟ ประกายแสง (ใช้แทน Effect อนุภาค)"
                        url={form.effectUrl}
                        busy={uploading === "effectUrl"}
                        onUpload={(e) => handleUploadLottie(e, "effectUrl")}
                        onClear={() => set("effectUrl", "")}
                      />
                    </div>
                    {form.effectUrl &&
                      (() => {
                        // ค่าปรับของ Effect แบบ Lottie — เก็บต่อท้ายลิงก์ไฟล์ (ไม่ต้องเพิ่มช่องในฐานข้อมูล) แยกทีละธีม
                        const { src, fx } = parseEffectUrl(form.effectUrl);
                        const setFx = (patch: Partial<LottieFx>) => set("effectUrl", buildEffectUrl(src, { ...fx, ...patch }));
                        const size = fx.size ?? sizeFromScale(form.effectScale);
                        return (
                          <>
                            <div className={css.row2}>
                              <Slider
                                label="ขนาดแต่ละลูก (จอคอม)"
                                value={size}
                                min={120}
                                max={900}
                                step={10}
                                unit=" px"
                                onChange={(v) => setFx({ size: v })}
                                hint="ความกว้างของตัวพลุจริง (ระบบตัดที่ว่างในไฟล์ให้แล้ว)"
                              />
                              <Slider
                                label="ขนาดบนมือถือ"
                                value={fx.mobile}
                                min={30}
                                max={100}
                                step={5}
                                format={(v) => `${v}% · ${Math.round((size * v) / 100)} px`}
                                onChange={(v) => setFx({ mobile: v })}
                                hint="เทียบกับจอคอม · มือถือแสดงทีละลูก"
                              />
                            </div>
                            <div className={css.row2}>
                              <label className={css.field}>
                                <span className={css.label}>บริเวณที่ระเบิด</span>
                                <select className={css.input} value={fx.area} onChange={(e) => setFx({ area: Number(e.target.value) })}>
                                  {LOTTIE_AREAS.map((a) => (
                                    <option key={a.value} value={a.value}>
                                      {a.label}
                                    </option>
                                  ))}
                                  {!LOTTIE_AREAS.some((a) => a.value === fx.area) && <option value={fx.area}>ลงมาถึง {fx.area}% ของจอ</option>}
                                </select>
                                <span className={css.hint}>“ฟ้าด้านบน” ไม่ทับเนื้อหากลางหน้า</span>
                              </label>
                              <Slider
                                label="ขนาดสุ่มแต่ละลูก"
                                value={fx.vary}
                                min={0}
                                max={50}
                                step={5}
                                format={(v) => (v ? `± ${v}%` : "เท่ากันทุกลูก")}
                                onChange={(v) => setFx({ vary: v })}
                                hint="ลูกเล็ก-ใหญ่ต่างกัน ดูเป็นธรรมชาติ"
                              />
                            </div>
                          </>
                        );
                      })()}
                    {form.effectUrl && (
                      <div className={css.row2}>
                        <Slider label="จุดสลับกันกี่ลูก" value={form.effectCount} min={1} max={5} onChange={(v) => set("effectCount", v)} hint="แนะนำ 2–3 · มือถือแสดงทีละลูก" />
                        <Slider label="เว้นระหว่างลูก (เฉลี่ย)" value={form.effectDelay} min={0} max={5000} step={100} format={(v) => `${(v / 1000).toFixed(1)}s`} onChange={(v) => set("effectDelay", v)} />
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>

            <div className={css.modalFoot}>
              <button
                type="button"
                className={css.secondaryBtn}
                onClick={() => openPreview(form, bannerOn)}
                title="เปิดหน้าเว็บในแท็บใหม่ด้วยค่าที่กรอกอยู่ — เห็นเฉพาะคุณ ยังไม่ต้องบันทึก"
              >
                <Eye size={16} /> ดูตัวอย่างบนเว็บ
              </button>
              <span className={css.flex} />
              <button type="button" className={css.ghostBtn} onClick={closeModal}>
                ยกเลิก
              </button>
              <button
                type="button"
                className={css.primaryBtn}
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.startDate || !form.endDate || Boolean(dateError)}
              >
                {saving ? <Loader2 size={16} className={css.spin} /> : <CheckCircle2 size={16} />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════ ส่วนย่อยของฟอร์ม ═════════ */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  hint,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className={css.field}>
      <span className={css.label}>
        {label} <b>{format ? format(value) : `${value}${unit}`}</b>
      </span>
      <input type="range" className={css.slider} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className={css.hint}>{hint}</span>}
    </label>
  );
}

function ColorField({
  label,
  value,
  fallback,
  clearable,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  clearable?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <div className={css.colorRow}>
        <input type="color" className={css.colorPicker} value={value || fallback} onChange={(e) => onChange(e.target.value)} />
        <input className={css.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={clearable ? "เว้นว่าง = ตามชุดเทศกาล" : fallback} />
        {clearable && value && (
          <button type="button" className={css.ghostBtn} onClick={() => onChange("")}>
            ล้าง
          </button>
        )}
      </div>
    </div>
  );
}

function UploadButton({ label, accept, busy, onChange }: { label: string; accept: string; busy: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className={`${css.uploadBtn} ${busy ? css.uploadBusy : ""}`}>
      {busy ? <Loader2 size={16} className={css.spin} /> : <Upload size={16} />}
      {busy ? "กำลังอัปโหลด..." : label}
      <input type="file" accept={accept} onChange={onChange} disabled={busy} hidden />
    </label>
  );
}

function LottieField({
  title,
  hint,
  url,
  busy,
  onUpload,
  onClear,
}: {
  title: string;
  hint: string;
  url: string;
  busy: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className={css.field}>
      <span className={css.label}>{title}</span>
      <span className={css.hint}>{hint}</span>
      {url ? (
        <div className={css.fileRow}>
          <CheckCircle2 size={16} className={css.fileOk} />
          <span className={css.fileName}>{url.split("#")[0].split("/").pop()}</span>
          <button type="button" className={css.ghostBtn} onClick={onClear}>
            เอาออก
          </button>
        </div>
      ) : (
        <UploadButton label={`อัปโหลด ${title} (.json)`} accept=".json" busy={busy} onChange={onUpload} />
      )}
    </div>
  );
}
