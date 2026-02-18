"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  PictureOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface Slide {
  id: number;
  sortOrder: number;
  imagePath: string | null;
  urlLink: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  bgGradient: string | null;
  ctaText: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedAt: string;
}

interface SlideForm {
  imagePath: string;
  urlLink: string;
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
  ctaText: string;
  sortOrder: number;
  isActive: boolean;
}

const gradientPresets = [
  { label: "ไม่ใช้", value: "" },
  { label: "น้ำเงินเข้ม", value: "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(26,58,92,0.75) 40%, rgba(232,101,43,0.6) 100%)" },
  { label: "น้ำเงิน-ส้ม", value: "linear-gradient(135deg, rgba(26,58,92,0.85) 0%, rgba(15,29,54,0.8) 50%, rgba(45,24,16,0.7) 100%)" },
  { label: "ส้ม-น้ำเงิน", value: "linear-gradient(135deg, rgba(45,24,16,0.85) 0%, rgba(232,101,43,0.7) 40%, rgba(26,58,92,0.8) 100%)" },
  { label: "ขาวโปร่ง", value: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)" },
  { label: "ดำโปร่ง", value: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" },
];

const defaultForm: SlideForm = {
  imagePath: "",
  urlLink: "",
  title: "",
  subtitle: "",
  description: "",
  bgGradient: "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(26,58,92,0.75) 40%, rgba(232,101,43,0.6) 100%)",
  ctaText: "",
  sortOrder: 0,
  isActive: true,
};

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SlideForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch slides
  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/slides");
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (error) {
      console.error("Failed to fetch slides:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Open modal for create/edit
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, sortOrder: slides.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (slide: Slide) => {
    setEditingId(slide.id);
    setForm({
      imagePath: slide.imagePath || "",
      urlLink: slide.urlLink || "",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      bgGradient: slide.bgGradient || "",
      ctaText: slide.ctaText || "",
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  // Upload image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "slides");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, imagePath: data.url }));
      } else {
        alert(data.error || "อัพโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!form.imagePath) {
      alert("กรุณาอัพโหลดรูปภาพ");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/slides/${editingId}`
        : "/api/admin/slides";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        closeModal();
        fetchSlides();
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

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบสไลด์นี้?")) return;

    try {
      const res = await fetch(`/api/admin/slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSlides();
      }
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className={css.header}>
        <h1 className={css.title}>จัดการสไลด์หน้าแรก</h1>
        <button className={css.addBtn} onClick={openCreate}>
          <PlusOutlined /> เพิ่มสไลด์
        </button>
      </div>

      {/* Slide grid */}
      {slides.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><PictureOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีสไลด์ — กดปุ่ม &quot;เพิ่มสไลด์&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.grid}>
          {slides.map((slide) => (
            <div key={slide.id} className={css.card}>
              <div className={css.imageWrap}>
                {slide.imagePath ? (
                  <img
                    src={slide.imagePath}
                    alt={`Slide ${slide.sortOrder}`}
                    className={css.slideImage}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#d1d5db" }}>
                    <PictureOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
                <span className={`${css.badge} ${slide.isActive ? css.badgeActive : css.badgeInactive}`}>
                  {slide.isActive ? "แสดง" : "ซ่อน"}
                </span>
                <span className={css.orderBadge}>{slide.sortOrder}</span>
              </div>
              <div className={css.cardBody}>
                {slide.title && <p className={css.cardTitle}>{slide.title}</p>}
                <p className={css.cardUrl}>
                  <LinkOutlined /> {slide.urlLink || "ไม่มีลิงก์"}
                </p>
                <p className={css.cardMeta}>
                  อัพเดท: {formatDate(slide.updatedAt)} • โดย: {slide.createdBy || "—"}
                </p>
              </div>
              <div className={css.actions}>
                <button className={css.actionBtn} onClick={() => openEdit(slide)}>
                  <EditOutlined /> แก้ไข
                </button>
                <button className={`${css.actionBtn} ${css.deleteBtn}`} onClick={() => handleDelete(slide.id)}>
                  <DeleteOutlined /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className={css.modalOverlay} onClick={closeModal}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                {editingId ? "แก้ไขสไลด์" : "เพิ่มสไลด์ใหม่"}
              </h3>
              <button className={css.modalClose} onClick={closeModal}>
                <CloseOutlined />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Image upload */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>รูปภาพ *</label>
                {form.imagePath ? (
                  <div className={css.uploadPreview}>
                    <img
                      src={form.imagePath}
                      alt="Preview"
                      className={css.uploadPreviewImg}
                    />
                    <button
                      className={css.uploadRemove}
                      onClick={() => setForm((prev) => ({ ...prev, imagePath: "" }))}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ) : (
                  <div
                    className={css.uploadArea}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={css.uploadIcon}>
                      <CloudUploadOutlined />
                    </div>
                    <p className={css.uploadText}>
                      {uploading ? "กำลังอัพโหลด..." : "คลิกเพื่อเลือกรูปภาพ (JPG, PNG, WebP)"}
                    </p>
                    <p className={css.uploadHint}>แนะนำ: 1920 x 600 px</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                />
              </div>

              {/* Title */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>หัวข้อ</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="เช่น สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Subtitle */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>หัวข้อรอง</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="เช่น DOH Saving & Credit Cooperative, Ltd."
                  value={form.subtitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>รายละเอียด</label>
                <textarea
                  className={css.formTextarea}
                  placeholder="คำอธิบายสั้นๆ..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* bgGradient */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>สีไล่ระดับ (Gradient)</label>
                <div className={css.presetRow}>
                  {gradientPresets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`${css.presetBtn} ${form.bgGradient === p.value ? css.presetActive : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, bgGradient: p.value }))}
                    >
                      {p.value ? (
                        <span className={css.presetSwatch} style={{ background: p.value }} />
                      ) : (
                        <span className={css.presetSwatch} style={{ background: "#f3f4f6" }}>✕</span>
                      )}
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="หรือพิมพ์ CSS gradient เอง..."
                  value={form.bgGradient}
                  onChange={(e) => setForm((prev) => ({ ...prev, bgGradient: e.target.value }))}
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* URL Link */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>ลิงก์ (ไม่บังคับ)</label>
                <input
                  type="url"
                  className={css.formInput}
                  placeholder="https://..."
                  value={form.urlLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, urlLink: e.target.value }))}
                />
              </div>

              {/* CTA Text */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>ข้อความปุ่ม (ต้องมีลิงก์ด้วย)</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="เช่น สมัครสมาชิก, ดูอัตราดอกเบี้ย"
                  value={form.ctaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                />
              </div>

              {/* Sort order */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>ลำดับ</label>
                <input
                  type="number"
                  className={css.formInput}
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>

              {/* Active toggle */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>สถานะ</label>
                <div className={css.toggle}>
                  <button
                    type="button"
                    className={`${css.toggleSwitch} ${form.isActive ? css.toggleOn : css.toggleOff}`}
                    onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  />
                  <span className={css.toggleLabel}>
                    {form.isActive ? "แสดง" : "ซ่อน"}
                  </span>
                </div>
              </div>

              {/* Preview */}
              {form.imagePath && (
                <div className={css.formGroup}>
                  <label className={css.formLabel}>ตัวอย่าง</label>
                  <div className={css.previewWrap}>
                    <img src={form.imagePath} alt="Preview" className={css.previewImg} />
                    {form.bgGradient && (
                      <div className={css.previewOverlay} style={{ background: form.bgGradient }} />
                    )}
                    {form.title && (
                      <div className={css.previewContent}>
                        <p className={css.previewTitle}>{form.title}</p>
                        {form.subtitle && <p className={css.previewSubtitle}>{form.subtitle}</p>}
                        {form.ctaText && <span className={css.previewCta}>{form.ctaText}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={css.modalFooter}>
              <button className={css.cancelBtn} onClick={closeModal}>ยกเลิก</button>
              <button
                className={css.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.imagePath}
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
