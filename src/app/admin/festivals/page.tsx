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
import { FESTIVAL_THEMES, EFFECT_OPTIONS, THEME_KEY_OPTIONS, ANIMATION_OPTIONS } from "@/components/festival/themes";
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
}

const defaultForm: FestivalForm = {
  name: "",
  themeKey: "valentine",
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
  const animFileRef = useRef<HTMLInputElement>(null);
  const effectFileRef = useRef<HTMLInputElement>(null);

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
    setForm(defaultForm);
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    setForm((prev) => ({
      ...prev,
      themeKey: key,
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
