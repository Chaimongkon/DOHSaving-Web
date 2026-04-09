"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BgColorsOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { FESTIVAL_THEMES, EFFECT_OPTIONS, THEME_KEY_OPTIONS, ANIMATION_OPTIONS, THEME_PRESETS } from "@/components/festival/themes";
import css from "./page.module.css";

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

/** Generate a rich gradient from a single banner color */
function bannerGradient(hex: string): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const shift = (amt: number) => {
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(2.55 * amt)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * amt)));
    const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * amt)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };
  return `linear-gradient(135deg, ${shift(12)} 0%, ${hex} 40%, ${shift(-20)} 100%)`;
}

const defaultForm: FestivalForm = {
  name: "",
  themeKey: "songkran",
  isActive: false,
  startDate: "",
  endDate: "",
  effect: "none",
  intensity: 50,
  effectScale: 50,
  effectColor: "",
  effectCount: 2,
  effectDelay: 1500,
  animation: "none",
  animationUrl: "",
  animationScale: 50,
  effectUrl: "",
  iconUrls: [],
  iconMode: "none",
  iconSize: 50,
  iconCount: 15,
  iconSpeed: 50,
  bannerText: "",
  bannerEmoji: "",
  bannerBg: "#00bcd4",
  bannerTextColor: "#ffffff",
  colorPrimary: "",
  colorBg: "",
  festivalLogoUrl: "",
};

export default function FestivalsPage() {
  const [items, setItems] = useState<FestivalTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FestivalForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploadingAnimation, setUploadingAnimation] = useState(false);
  const [uploadingEffect, setUploadingEffect] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const animFileRef = useRef<HTMLInputElement>(null);
  const effectFileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const handleUploadLottie = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "animationUrl" | "effectUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      alert("รองรับเฉพาะไฟล์ .json (Lottie)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    const setUploading = field === "animationUrl" ? setUploadingAnimation : setUploadingEffect;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "lottie");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, [field]: data.url }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert("อัปโหลดไม่สำเร็จ: " + (err.error || res.statusText));
      }
    } catch (err) {
      alert("อัปโหลดไม่สำเร็จ: " + String(err));
    }
    setUploading(false);
    if (field === "animationUrl" && animFileRef.current) animFileRef.current.value = "";
    if (field === "effectUrl" && effectFileRef.current) effectFileRef.current.value = "";
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowed = [".png", ".svg", ".webp", ".gif", ".jpg", ".jpeg"];
    const toUpload = Array.from(files).filter((f) => {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      return allowed.includes(ext) && f.size <= 10 * 1024 * 1024;
    });

    if (toUpload.length === 0) {
      alert("รองรับเฉพาะไฟล์ .png, .svg, .webp, .gif, .jpg (ไม่เกิน 10MB)");
      return;
    }

    setUploadingIcon(true);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "festival-icons");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        }
      } catch {
        // skip failed uploads
      }
    }
    if (newUrls.length > 0) {
      setForm((prev) => ({ ...prev, iconUrls: [...prev.iconUrls, ...newUrls] }));
    }
    setUploadingIcon(false);
    if (iconFileRef.current) iconFileRef.current.value = "";
  };

  const removeIcon = (index: number) => {
    setForm((prev) => ({
      ...prev,
      iconUrls: prev.iconUrls.filter((_, i) => i !== index),
    }));
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".png", ".svg", ".webp", ".jpg", ".jpeg", ".gif"].includes(ext)) {
      alert("รองรับเฉพาะไฟล์รูปภาพ (.png, .svg, .webp, .jpg)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "festival-logo");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, festivalLogoUrl: data.url }));
      } else {
        alert("อัปโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดไม่สำเร็จ");
    }
    setUploadingLogo(false);
    if (logoFileRef.current) logoFileRef.current.value = "";
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/festivals");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch festival themes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    const preset = THEME_PRESETS[defaultForm.themeKey];
    setForm({
      ...defaultForm,
      ...(preset ? {
        bannerBg: preset.bannerBg,
        bannerTextColor: preset.bannerTextColor,
        bannerEmoji: preset.bannerEmoji,
        colorPrimary: preset.colorPrimary,
        colorBg: preset.colorBg,
      } : {}),
    });
    setModalOpen(true);
  };

  const openEdit = (item: FestivalTheme) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      themeKey: item.themeKey,
      isActive: item.isActive,
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
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
      iconUrls: item.iconUrls ? (() => { try { return JSON.parse(item.iconUrls); } catch { return []; } })() : [],
      iconMode: item.iconMode || "none",
      iconSize: item.iconSize ?? 50,
      iconCount: item.iconCount ?? 15,
      iconSpeed: item.iconSpeed ?? 50,
      bannerText: item.bannerText || "",
      bannerEmoji: item.bannerEmoji || "",
      bannerBg: item.bannerBg || "#00bcd4",
      bannerTextColor: item.bannerTextColor || "#ffffff",
      colorPrimary: item.colorPrimary || "",
      colorBg: item.colorBg || "",
      festivalLogoUrl: item.festivalLogoUrl || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      alert("กรุณากรอกชื่อเทศกาล, วันเริ่ม และวันสิ้นสุด");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/festivals/${editingId}`
        : "/api/admin/festivals";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        iconUrls: form.iconUrls.length > 0 ? JSON.stringify(form.iconUrls) : "",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeModal();
        fetchItems();
      } else {
        const data = await res.json();
        alert(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: FestivalTheme) => {
    try {
      const res = await fetch(`/api/admin/festivals/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch {
      alert("เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบ Theme นี้?")) return;

    try {
      const res = await fetch(`/api/admin/festivals/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
      }
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (item: FestivalTheme) => {
    if (!item.isActive) return { label: "ปิด", className: css.badgeInactive };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    if (today < start) return { label: "ตั้งเวลาไว้", className: css.badgeScheduled };
    if (today > end) return { label: "หมดเวลา", className: css.badgeInactive };
    return { label: "กำลังแสดง", className: css.badgeActive };
  };

  const getThemeConfig = (themeKey: string) => {
    return FESTIVAL_THEMES[themeKey] || { emoji: "🎨", label: themeKey };
  };

  const getEffectLabel = (effect: string) => {
    return EFFECT_OPTIONS.find((e) => e.value === effect)?.label || effect;
  };

  const handleThemeKeyChange = (key: string) => {
    const preset = THEME_PRESETS[key];
    setForm((prev) => ({
      ...prev,
      themeKey: key,
      // Auto-fill colors from preset
      ...(preset ? {
        bannerBg: preset.bannerBg,
        bannerTextColor: preset.bannerTextColor,
        bannerEmoji: preset.bannerEmoji,
        colorPrimary: preset.colorPrimary,
        colorBg: preset.colorBg,
      } : {}),
    }));
  };

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className={css.header}>
        <h1 className={css.title}>จัดการ Festival Theme</h1>
        <button className={css.addBtn} onClick={openCreate}>
          <PlusOutlined /> เพิ่ม Theme
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}>🎉</div>
          <p className={css.emptyText}>
            ยังไม่มี Festival Theme — กดปุ่ม &quot;เพิ่ม Theme&quot; เพื่อเริ่มต้น
          </p>
        </div>
      ) : (
        <div className={css.grid}>
          {items.map((item) => {
            const config = getThemeConfig(item.themeKey);
            const status = getStatusBadge(item);
            return (
              <div key={item.id} className={css.card}>
                <div className={css.cardHeader}>
                  <span className={css.themeEmoji}>{config.emoji}</span>
                  <div className={css.cardTitleWrap}>
                    <p className={css.cardName}>{item.name}</p>
                    <p className={css.cardThemeKey}>{config.label}</p>
                  </div>
                  <span className={`${css.badge} ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className={css.cardBody}>
                  <div className={css.cardRow}>
                    <CalendarOutlined />
                    <span>
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </span>
                  </div>

                  {item.effect !== "none" && (
                    <div className={css.cardRow}>
                      <ThunderboltOutlined />
                      <span>{getEffectLabel(item.effect)}</span>
                      <div className={css.intensityBar}>
                        <div
                          className={css.intensityFill}
                          style={{ width: `${item.intensity}%` }}
                        />
                      </div>
                      <span>{item.intensity}%</span>
                    </div>
                  )}

                  {item.animation !== "none" && (
                    <div className={css.cardRow}>
                      <span>🎞️</span>
                      <span>{ANIMATION_OPTIONS.find((a) => a.value === item.animation)?.label || item.animation}</span>
                    </div>
                  )}

                  {item.iconMode !== "none" && item.iconUrls && (
                    <div className={css.cardRow}>
                      <span>🖼️</span>
                      <span>
                        ไอคอน {item.iconMode === "falling" ? "ตกลงมา" : "เด้งไปมา"} ({(() => { try { return JSON.parse(item.iconUrls).length; } catch { return 0; } })()} รูป)
                      </span>
                    </div>
                  )}

                  {item.bannerText && (
                    <div className={css.cardRow}>
                      <span>📢</span>
                      <span className={css.bannerPreviewText}>
                        {item.bannerEmoji} {item.bannerText} {item.bannerEmoji}
                      </span>
                    </div>
                  )}
                </div>

                <div className={css.actions}>
                  <button
                    className={`${css.actionBtn} ${item.isActive ? css.toggleBtnOff : css.toggleBtn}`}
                    onClick={() => handleToggle(item)}
                  >
                    <PoweroffOutlined />
                    {item.isActive ? "ปิด" : "เปิด"}
                  </button>
                  <button className={css.actionBtn} onClick={() => openEdit(item)}>
                    <EditOutlined /> แก้ไข
                  </button>
                  <button
                    className={`${css.actionBtn} ${css.deleteBtn}`}
                    onClick={() => handleDelete(item.id)}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className={css.modalOverlay} onClick={closeModal}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                {editingId ? "แก้ไข Festival Theme" : "เพิ่ม Festival Theme ใหม่"}
              </h3>
              <button className={css.modalClose} onClick={closeModal}>
                <CloseOutlined />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* ═══ Section 1: ข้อมูลทั่วไป ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>📋</span>
                  <h4 className={css.sectionTitle}>ข้อมูลทั่วไป</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formRow}>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>ชื่อเทศกาล *</label>
                      <input
                        type="text"
                        className={css.formInput}
                        placeholder="เช่น คริสต์มาส 2569"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>ประเภท *</label>
                      <select
                        className={css.formSelect}
                        value={form.themeKey}
                        onChange={(e) => handleThemeKeyChange(e.target.value)}
                      >
                        {THEME_KEY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={css.formRow}>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>วันเริ่มต้น *</label>
                      <input
                        type="date"
                        className={css.formInput}
                        value={form.startDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>วันสิ้นสุด *</label>
                      <input
                        type="date"
                        className={css.formInput}
                        value={form.endDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className={css.formGroup}>
                    <div className={css.toggleInline}>
                      <button
                        type="button"
                        className={`${css.toggleSwitch} ${form.isActive ? css.toggleOn : css.toggleOff}`}
                        onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      />
                      <span className={css.toggleLabel}>
                        {form.isActive ? "เปิดใช้งาน" : "ปิดอยู่"}
                      </span>
                    </div>
                  </div>

                  {/* Logo เทศกาล */}
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>Logo เทศกาล (แทน Logo เดิมชั่วคราว)</label>
                    {!form.festivalLogoUrl ? (
                      <div className={css.uploadZone}>
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept=".png,.svg,.webp,.jpg,.jpeg,.gif"
                          className={css.uploadZoneInput}
                          onChange={handleUploadLogo}
                          disabled={uploadingLogo}
                        />
                        {uploadingLogo && (
                          <div className={css.uploadingOverlay}>
                            <span className={css.uploadingLabel}>
                              <span className={css.uploadingSpinner} />
                              กำลังอัปโหลด...
                            </span>
                          </div>
                        )}
                        <span className={css.uploadZoneIcon}>🏷️</span>
                        <span className={css.uploadZoneText}>
                          ลากไฟล์มาวาง หรือ <strong>คลิกเลือกไฟล์</strong>
                        </span>
                        <span className={css.uploadZoneHint}>.png .svg .webp (เว้นว่าง = ใช้ Logo เดิม)</span>
                      </div>
                    ) : (
                      <div className={css.logoPreviewWrap}>
                        <div className={css.logoPreview}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.festivalLogoUrl} alt="Festival Logo" className={css.logoPreviewImg} />
                        </div>
                        <button
                          type="button"
                          className={css.uploadedFileRemove}
                          onClick={() => setForm((prev) => ({ ...prev, festivalLogoUrl: "" }))}
                        >
                          ลบ Logo เทศกาล
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ Section 2: Effect ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>✨</span>
                  <h4 className={css.sectionTitle}>Effect (อนุภาคตกหน้าจอ)</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>รูปแบบ</label>
                    <select
                      className={css.formSelect}
                      value={form.effect}
                      onChange={(e) => setForm((prev) => ({ ...prev, effect: e.target.value }))}
                    >
                      {EFFECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {form.effect !== "none" && (
                    <>
                      <div className={css.formRow}>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>ความหนาแน่น ({form.intensity}%)</label>
                          <div className={css.sliderWrap}>
                            <input
                              type="range"
                              className={css.slider}
                              min={0}
                              max={100}
                              value={form.intensity}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, intensity: parseInt(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>ขนาด ({form.effectScale}%)</label>
                          <div className={css.sliderWrap}>
                            <input
                              type="range"
                              className={css.slider}
                              min={10}
                              max={100}
                              value={form.effectScale}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, effectScale: parseInt(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className={css.formGroup}>
                        <label className={css.formLabel}>สี Effect</label>
                        <div className={css.colorRow}>
                          <input
                            type="color"
                            className={css.colorPicker}
                            value={form.effectColor || "#ffffff"}
                            onChange={(e) => setForm((prev) => ({ ...prev, effectColor: e.target.value }))}
                          />
                          <input
                            type="text"
                            className={`${css.formInput} ${css.colorHex}`}
                            placeholder="เว้นว่าง = สีเริ่มต้น"
                            value={form.effectColor}
                            onChange={(e) => setForm((prev) => ({ ...prev, effectColor: e.target.value }))}
                          />
                          {form.effectColor && (
                            <button
                              type="button"
                              className={css.colorClear}
                              onClick={() => setForm((prev) => ({ ...prev, effectColor: "" }))}
                            >
                              ล้าง
                            </button>
                          )}
                        </div>
                      </div>

                      {form.effectUrl && (
                        <div className={css.formRow}>
                          <div className={css.formGroup}>
                            <label className={css.formLabel}>จำนวนพร้อมกัน ({form.effectCount})</label>
                            <div className={css.sliderWrap}>
                              <input
                                type="range"
                                className={css.slider}
                                min={1}
                                max={5}
                                value={form.effectCount}
                                onChange={(e) =>
                                  setForm((prev) => ({ ...prev, effectCount: parseInt(e.target.value) }))
                                }
                              />
                            </div>
                          </div>
                          <div className={css.formGroup}>
                            <label className={css.formLabel}>ระยะห่าง ({(form.effectDelay / 1000).toFixed(1)}s)</label>
                            <div className={css.sliderWrap}>
                              <input
                                type="range"
                                className={css.slider}
                                min={0}
                                max={5000}
                                step={100}
                                value={form.effectDelay}
                                onChange={(e) =>
                                  setForm((prev) => ({ ...prev, effectDelay: parseInt(e.target.value) }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={css.formGroup}>
                        <label className={css.formLabel}>Lottie JSON (ใช้แทน particles)</label>
                        {!form.effectUrl ? (
                          <div className={css.uploadZone}>
                            <input
                              ref={effectFileRef}
                              type="file"
                              accept=".json"
                              className={css.uploadZoneInput}
                              onChange={(e) => handleUploadLottie(e, "effectUrl")}
                              disabled={uploadingEffect}
                            />
                            {uploadingEffect && (
                              <div className={css.uploadingOverlay}>
                                <span className={css.uploadingLabel}>
                                  <span className={css.uploadingSpinner} />
                                  กำลังอัปโหลด...
                                </span>
                              </div>
                            )}
                            <span className={css.uploadZoneIcon}>�</span>
                            <span className={css.uploadZoneText}>
                              ลากไฟล์มาวาง หรือ <strong>คลิกเลือกไฟล์</strong>
                            </span>
                            <span className={css.uploadZoneHint}>.json จาก LottieFiles</span>
                          </div>
                        ) : (
                          <div className={css.uploadedFile}>
                            <span className={css.uploadedFileIcon}>✅</span>
                            <span className={css.uploadedFileName}>{form.effectUrl.split("/").pop()}</span>
                            <button
                              type="button"
                              className={css.uploadedFileRemove}
                              onClick={() => setForm((prev) => ({ ...prev, effectUrl: "" }))}
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ═══ Section 3: Animation ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>🎞️</span>
                  <h4 className={css.sectionTitle}>Animation (วิ่งข้ามจอ)</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>รูปแบบ</label>
                    <select
                      className={css.formSelect}
                      value={form.animation}
                      onChange={(e) => setForm((prev) => ({ ...prev, animation: e.target.value }))}
                    >
                      {ANIMATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {form.animation !== "none" && (
                    <>
                      <div className={css.formGroup}>
                        <label className={css.formLabel}>ขนาด ({form.animationScale}%)</label>
                        <div className={css.sliderWrap}>
                          <input
                            type="range"
                            className={css.slider}
                            min={10}
                            max={100}
                            value={form.animationScale}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, animationScale: parseInt(e.target.value) }))
                            }
                          />
                        </div>
                        <p className={css.formHint}>10% = เล็ก, 50% = ปกติ, 100% = ใหญ่</p>
                      </div>

                      <div className={css.formGroup}>
                        <label className={css.formLabel}>Lottie JSON (เว้นว่าง = ใช้ตัวเริ่มต้น)</label>
                        {!form.animationUrl ? (
                          <div className={css.uploadZone}>
                            <input
                              ref={animFileRef}
                              type="file"
                              accept=".json"
                              className={css.uploadZoneInput}
                              onChange={(e) => handleUploadLottie(e, "animationUrl")}
                              disabled={uploadingAnimation}
                            />
                            {uploadingAnimation && (
                              <div className={css.uploadingOverlay}>
                                <span className={css.uploadingLabel}>
                                  <span className={css.uploadingSpinner} />
                                  กำลังอัปโหลด...
                                </span>
                              </div>
                            )}
                            <span className={css.uploadZoneIcon}>🎞️</span>
                            <span className={css.uploadZoneText}>
                              ลากไฟล์มาวาง หรือ <strong>คลิกเลือกไฟล์</strong>
                            </span>
                            <span className={css.uploadZoneHint}>.json จาก LottieFiles</span>
                          </div>
                        ) : (
                          <div className={css.uploadedFile}>
                            <span className={css.uploadedFileIcon}>✅</span>
                            <span className={css.uploadedFileName}>{form.animationUrl.split("/").pop()}</span>
                            <button
                              type="button"
                              className={css.uploadedFileRemove}
                              onClick={() => setForm((prev) => ({ ...prev, animationUrl: "" }))}
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* ═══ Section 4: Banner ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>📢</span>
                  <h4 className={css.sectionTitle}>Banner อวยพร</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ข้อความ (เว้นว่าง = ไม่แสดง banner)</label>
                    <input
                      type="text"
                      className={css.formInput}
                      placeholder="เช่น สุขสันต์วันสงกรานต์ 2569"
                      value={form.bannerText}
                      onChange={(e) => setForm((prev) => ({ ...prev, bannerText: e.target.value }))}
                    />
                  </div>

                  {form.bannerText && (
                    <>
                      <div className={css.formGroup}>
                        <label className={css.formLabel}>Emoji ซ้าย-ขวา</label>
                        <input
                          type="text"
                          className={css.formInput}
                          placeholder="เช่น 💧 หรือ 🎉"
                          value={form.bannerEmoji}
                          onChange={(e) => setForm((prev) => ({ ...prev, bannerEmoji: e.target.value }))}
                        />
                      </div>

                      <div className={css.formRow}>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>สีพื้น Banner</label>
                          <div className={css.colorRow}>
                            <input
                              type="color"
                              className={css.colorPicker}
                              value={form.bannerBg || "#00bcd4"}
                              onChange={(e) => setForm((prev) => ({ ...prev, bannerBg: e.target.value }))}
                            />
                            <input
                              type="text"
                              className={`${css.formInput} ${css.colorHex}`}
                              value={form.bannerBg}
                              onChange={(e) => setForm((prev) => ({ ...prev, bannerBg: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>สีตัวอักษร</label>
                          <div className={css.colorRow}>
                            <input
                              type="color"
                              className={css.colorPicker}
                              value={form.bannerTextColor || "#ffffff"}
                              onChange={(e) => setForm((prev) => ({ ...prev, bannerTextColor: e.target.value }))}
                            />
                            <input
                              type="text"
                              className={`${css.formInput} ${css.colorHex}`}
                              value={form.bannerTextColor}
                              onChange={(e) => setForm((prev) => ({ ...prev, bannerTextColor: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Preview ── */}
                      <div className={css.formGroup}>
                        <label className={css.formLabel}>ตัวอย่าง</label>
                        <div
                          className={css.bannerPreview}
                          style={{
                            background: bannerGradient(form.bannerBg || "#00bcd4"),
                            color: form.bannerTextColor || "#ffffff",
                          }}
                        >
                          {form.bannerEmoji && <span>{form.bannerEmoji}</span>}
                          <span>{form.bannerText}</span>
                          {form.bannerEmoji && <span>{form.bannerEmoji}</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ═══ Section 5: สีธีมเว็บ ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>🎨</span>
                  <h4 className={css.sectionTitle}>สีธีมเว็บ (เว้นว่าง = ใช้สีเดิม)</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formRow}>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>สี Accent (ปุ่ม, ลิงก์, เส้น)</label>
                      <div className={css.colorRow}>
                        <input
                          type="color"
                          className={css.colorPicker}
                          value={form.colorPrimary || "#E8652B"}
                          onChange={(e) => setForm((prev) => ({ ...prev, colorPrimary: e.target.value }))}
                        />
                        <input
                          type="text"
                          className={`${css.formInput} ${css.colorHex}`}
                          placeholder="#E8652B (ส้ม)"
                          value={form.colorPrimary}
                          onChange={(e) => setForm((prev) => ({ ...prev, colorPrimary: e.target.value }))}
                        />
                        {form.colorPrimary && (
                          <button
                            type="button"
                            className={css.colorClear}
                            onClick={() => setForm((prev) => ({ ...prev, colorPrimary: "" }))}
                          >
                            ล้าง
                          </button>
                        )}
                      </div>
                      <p className={css.formHint}>แทนสีส้มของปุ่ม Login, เส้นใต้เมนู, ลิงก์ทั้งหน้า</p>
                    </div>
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>สีพื้น Navbar / Footer</label>
                      <div className={css.colorRow}>
                        <input
                          type="color"
                          className={css.colorPicker}
                          value={form.colorBg || "#0f1d36"}
                          onChange={(e) => setForm((prev) => ({ ...prev, colorBg: e.target.value }))}
                        />
                        <input
                          type="text"
                          className={`${css.formInput} ${css.colorHex}`}
                          placeholder="#0f1d36 (น้ำเงินเข้ม)"
                          value={form.colorBg}
                          onChange={(e) => setForm((prev) => ({ ...prev, colorBg: e.target.value }))}
                        />
                        {form.colorBg && (
                          <button
                            type="button"
                            className={css.colorClear}
                            onClick={() => setForm((prev) => ({ ...prev, colorBg: "" }))}
                          >
                            ล้าง
                          </button>
                        )}
                      </div>
                      <p className={css.formHint}>แทนสีน้ำเงินเข้มของ TopBar, Navbar, Footer</p>
                    </div>
                  </div>

                  {(form.colorPrimary || form.colorBg) && (
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>ตัวอย่าง</label>
                      <div className={css.themePreview}>
                        <div
                          className={css.themePreviewBar}
                          style={{ background: form.colorBg || "#0f1d36" }}
                        >
                          <span style={{ color: "#fff", fontSize: 11, opacity: 0.6 }}>TopBar</span>
                        </div>
                        <div
                          className={css.themePreviewBar}
                          style={{ background: form.colorBg || "#0f1d36", padding: "8px 12px" }}
                        >
                          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Navbar</span>
                          <span
                            style={{
                              background: form.colorPrimary || "#E8652B",
                              color: "#fff",
                              fontSize: 10,
                              padding: "3px 10px",
                              borderRadius: 6,
                              fontWeight: 600,
                            }}
                          >
                            Login
                          </span>
                        </div>
                        <div style={{ padding: "12px", background: "#f5f5f5", fontSize: 11, color: "#999", textAlign: "center" }}>
                          เนื้อหาเว็บ...
                        </div>
                        <div
                          className={css.themePreviewBar}
                          style={{ background: form.colorBg || "#0f1d36", borderTop: `2px solid ${form.colorPrimary || "#E8652B"}` }}
                        >
                          <span style={{ color: "#fff", fontSize: 11, opacity: 0.6 }}>Footer</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ Section 6: Icons ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>🖼️</span>
                  <h4 className={css.sectionTitle}>Icons (รูปไอคอนตกลงมา/เด้งไปมา)</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>โหมดแสดงผล</label>
                    <select
                      className={css.formSelect}
                      value={form.iconMode}
                      onChange={(e) => setForm((prev) => ({ ...prev, iconMode: e.target.value }))}
                    >
                      <option value="none">ไม่แสดง</option>
                      <option value="falling">ตกลงมาจากด้านบน</option>
                      <option value="bouncing">เด้งไปมาบนหน้าจอ</option>
                    </select>
                  </div>

                  {form.iconMode !== "none" && (
                    <>
                      <div className={css.formGroup}>
                        <label className={css.formLabel}>อัปโหลดรูปไอคอน (เลือกได้หลายไฟล์)</label>
                        <div className={css.uploadZone}>
                          <input
                            ref={iconFileRef}
                            type="file"
                            accept=".png,.svg,.webp,.gif,.jpg,.jpeg"
                            multiple
                            className={css.uploadZoneInput}
                            onChange={handleUploadIcon}
                            disabled={uploadingIcon}
                          />
                          {uploadingIcon && (
                            <div className={css.uploadingOverlay}>
                              <span className={css.uploadingLabel}>
                                <span className={css.uploadingSpinner} />
                                กำลังอัปโหลด...
                              </span>
                            </div>
                          )}
                          <span className={css.uploadZoneIcon}>🖼️</span>
                          <span className={css.uploadZoneText}>
                            ลากไฟล์มาวาง หรือ <strong>คลิกเลือกไฟล์</strong>
                          </span>
                          <span className={css.uploadZoneHint}>.png .svg .webp .gif .jpg (ไม่เกิน 10MB)</span>
                        </div>
                      </div>

                      {form.iconUrls.length > 0 && (
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>รูปที่เลือก ({form.iconUrls.length} ไฟล์)</label>
                          <div className={css.iconGrid}>
                            {form.iconUrls.map((url, idx) => (
                              <div key={idx} className={css.iconThumb}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`icon-${idx}`} className={css.iconThumbImg} />
                                <button
                                  type="button"
                                  className={css.iconThumbRemove}
                                  onClick={() => removeIcon(idx)}
                                  title="ลบ"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={css.formRow}>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>ขนาด ({form.iconSize}px)</label>
                          <div className={css.sliderWrap}>
                            <input
                              type="range"
                              className={css.slider}
                              min={20}
                              max={120}
                              value={form.iconSize}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, iconSize: parseInt(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>จำนวน ({form.iconCount})</label>
                          <div className={css.sliderWrap}>
                            <input
                              type="range"
                              className={css.slider}
                              min={3}
                              max={50}
                              value={form.iconCount}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, iconCount: parseInt(e.target.value) }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className={css.formGroup}>
                        <label className={css.formLabel}>ความเร็ว ({form.iconSpeed}%)</label>
                        <div className={css.sliderWrap}>
                          <input
                            type="range"
                            className={css.slider}
                            min={10}
                            max={100}
                            value={form.iconSpeed}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, iconSpeed: parseInt(e.target.value) }))
                            }
                          />
                        </div>
                        <p className={css.formHint}>10% = ช้า, 50% = ปกติ, 100% = เร็ว</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* ═══ Section 7: Preview รวม ═══ */}
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <span className={css.sectionIcon}>👁️</span>
                  <h4 className={css.sectionTitle}>ตัวอย่างหน้าเว็บ</h4>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.previewFrame}>
                    {/* Banner */}
                    {form.bannerText && (
                      <div
                        className={css.previewBanner}
                        style={{
                          background: bannerGradient(form.bannerBg || "#00bcd4"),
                          color: form.bannerTextColor || "#ffffff",
                        }}
                      >
                        {form.bannerEmoji && <span>{form.bannerEmoji}</span>}
                        <span>{form.bannerText}</span>
                        {form.bannerEmoji && <span>{form.bannerEmoji}</span>}
                      </div>
                    )}

                    {/* TopBar */}
                    <div
                      className={css.previewTopbar}
                      style={{ background: form.colorBg || "#0c1829" }}
                    >
                      <span>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</span>
                      <span>โทร 02-354-6758</span>
                    </div>

                    {/* Navbar */}
                    <div
                      className={css.previewNavbar}
                      style={{
                        background: `linear-gradient(180deg, ${form.colorBg || "#0f1d36"}, ${form.colorBg || "#0f1d36"}ee)`,
                      }}
                    >
                      <div className={css.previewNavLeft}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.festivalLogoUrl || "/images/logo/logo.png"}
                          alt="Logo"
                          className={css.previewLogo}
                        />
                        <div>
                          <div className={css.previewNavTitle}>
                            สหกรณ์ออมทรัพย์กรมทางหลวง
                          </div>
                          <span className={css.previewNavSub}>
                            DOH SAVING & CREDIT COOPERATIVE
                          </span>
                        </div>
                      </div>
                      <div className={css.previewNavMenu}>
                        <span className={css.previewNavPill}>เกี่ยวกับ</span>
                        <span className={css.previewNavPill}>บริการ</span>
                        <span
                          className={css.previewNavLogin}
                          style={{ background: form.colorPrimary || "#E8652B" }}
                        >
                          เข้าสู่ระบบ
                        </span>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className={css.previewContent}>
                      {(form.effect !== "none" || form.animation !== "none" || (form.iconMode !== "none" && form.iconUrls.length > 0)) ? (
                        <>
                          <div className={css.previewContentLabel}>
                            เนื้อหาเว็บไซต์
                          </div>
                          <div className={css.previewEffectBadges}>
                            {form.effect !== "none" && (
                              <span className={css.previewEffectBadge}>
                                ✨ {EFFECT_OPTIONS.find((e) => e.value === form.effect)?.label || form.effect}
                                {" "}({form.intensity}%)
                              </span>
                            )}
                            {form.animation !== "none" && (
                              <span className={css.previewEffectBadge}>
                                🎞️ {ANIMATION_OPTIONS.find((a) => a.value === form.animation)?.label || form.animation}
                              </span>
                            )}
                            {form.iconMode !== "none" && form.iconUrls.length > 0 && (
                              <span className={css.previewEffectBadge}>
                                🖼️ ไอคอน {form.iconMode === "falling" ? "ตกลงมา" : "เด้งไปมา"} ({form.iconUrls.length} รูป)
                              </span>
                            )}
                          </div>
                          {form.iconMode !== "none" && form.iconUrls.length > 0 && (
                            <div className={css.previewIconStrip}>
                              {form.iconUrls.slice(0, 8).map((url, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={url} alt="" className={css.previewIconItem} />
                              ))}
                              {form.iconUrls.length > 8 && (
                                <span style={{ fontSize: 10, color: "#9ca3af", alignSelf: "center" }}>
                                  +{form.iconUrls.length - 8}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={css.previewContentLabel}>
                          เนื้อหาเว็บไซต์ (ไม่มี effect)
                        </div>
                      )}
                    </div>

                    {/* Footer accent line */}
                    <div
                      className={css.previewFooterAccent}
                      style={{ background: form.colorPrimary || "#E8652B" }}
                    />

                    {/* Footer */}
                    <div
                      className={css.previewFooter}
                      style={{
                        background: `linear-gradient(180deg, ${form.colorBg || "#0c1829"}, ${form.colorBg || "#0f1d36"})`,
                      }}
                    >
                      <span className={css.previewFooterText}>
                        สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
                      </span>
                      <span className={css.previewFooterText}>
                        &copy; 2569
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.modalFooter}>
              <button className={css.cancelBtn} onClick={closeModal}>
                ยกเลิก
              </button>
              <button
                className={css.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.name || !form.startDate || !form.endDate}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
