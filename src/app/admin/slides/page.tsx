"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CloudUpload,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  LayoutTemplate
} from "lucide-react";
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
  { label: "ไม่มี", value: "" },
  { label: "Dark Blue", value: "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(26,58,92,0.7) 100%)" },
  { label: "Blue Orange", value: "linear-gradient(135deg, rgba(26,58,92,0.85) 0%, rgba(232,101,43,0.7) 100%)" },
  { label: "Dark Fade", value: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" },
];

const defaultForm: SlideForm = {
  imagePath: "",
  urlLink: "",
  title: "",
  subtitle: "",
  description: "",
  bgGradient: "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(26,58,92,0.7) 100%)",
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
    setTimeout(() => {
      setEditingId(null);
      setForm(defaultForm);
    }, 200); // wait for exit animation
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
        alert(data.error || "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!form.imagePath) {
      alert("กรุณาอัปโหลดรูปภาพ");
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
    if (!confirm("ลบสไลด์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      const res = await fetch(`/api/admin/slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSlides();
      }
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  if (loading) {
    return (
      <div className={css.loadingContainer}>
        <div className={css.loader}></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className={css.container}>
      {/* Header */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            <LayoutTemplate size={24} />
          </div>
          <div>
            <h1 className={css.title}>จัดการสไลด์โชว์</h1>
            <p className={css.subtitle}>
              ปรับแต่งรูปภาพและแบนเนอร์ต่างๆ บนหน้าแรกของเว็บไซต์
            </p>
          </div>
        </div>
        <button className={css.addBtn} onClick={openCreate}>
          <Plus size={18} />
          <span>เพิ่มสไลด์</span>
        </button>
      </div>

      {/* Slide grid */}
      {slides.length === 0 ? (
        <div className={css.emptyState}>
          <div className={css.emptyIconWrap}>
            <ImageIcon size={48} className={css.emptyIcon} />
            <div className={css.emptyIconBg} />
          </div>
          <h3 className={css.emptyTitle}>คุณยังไม่มีสไลด์ในระบบ</h3>
          <p className={css.emptyText}>เพิ่มสไลด์ใหม่เพื่อทำให้เว็บไซต์น่าสนใจขึ้น</p>
          <button className={css.emptyBtn} onClick={openCreate}>
            <Plus size={18} /> เพิ่มสไลด์ใหม่
          </button>
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
                  <div className={css.noImagePlaceholder}>
                    <ImageIcon size={32} />
                  </div>
                )}

                <div className={css.badgesWrap}>
                  <div className={css.orderBadge}>#{slide.sortOrder}</div>
                  <div className={`${css.statusBadge} ${slide.isActive ? css.statusActive : css.statusInactive}`}>
                    {slide.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {slide.isActive ? "แสดงผล" : "ซ่อน"}
                  </div>
                </div>
              </div>

              <div className={css.cardBody}>
                <div className={css.cardContent}>
                  <h3 className={css.cardTitle} title={slide.title || "ไม่มีหัวข้อ"}>
                    {slide.title || "ไม่มีหัวข้อ (แสดงรูปภาพอย่างเดียว)"}
                  </h3>
                  {slide.urlLink && (
                    <div className={css.cardUrl} title={slide.urlLink}>
                      <LinkIcon size={12} />
                      <span>{slide.urlLink}</span>
                    </div>
                  )}
                </div>

                <div className={css.cardFooter}>
                  <div className={css.actions}>
                    <button
                      className={css.actionBtnEdit}
                      onClick={() => openEdit(slide)}
                      title="แก้ไข"
                    >
                      <Edit2 size={16} /> แก้ไข
                    </button>
                    <button
                      className={css.actionBtnDelete}
                      onClick={() => handleDelete(slide.id)}
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Two-Column Modal */}
      {modalOpen && (
        <div className={`${css.modalOverlay} ${modalOpen ? css.modalOverlayEnter : ''}`} onClick={closeModal}>
          <div className={`${css.modal} ${modalOpen ? css.modalEnter : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <div>
                <h3 className={css.modalTitle}>
                  {editingId ? "แก้ไขสไลด์โชว์" : "เพิ่มสไลด์โชว์ใหม่"}
                </h3>
              </div>
              <button className={css.modalClose} onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className={css.modalBody}>
              <div className={css.splitLayout}>
                {/* Left Column: Image & Preview */}
                <div className={css.leftCol}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>รูปภาพ (แนะนำ 1920x600px)</label>
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
                          title="เปลี่ยนรูปภาพ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`${css.uploadAreaCompact} ${uploading ? css.uploading : ''}`}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                      >
                        <CloudUpload size={28} className={css.uploadIcon} />
                        <div className={css.uploadTextStack}>
                          <span className={css.uploadTextPrimary}>
                            {uploading ? "กำลังอัปโหลด..." : "คลิกเพื่ออัปโหลดรูปภาพ"}
                          </span>
                          <span className={css.uploadTextSecondary}>JPG, PNG, WebP</span>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                    {!form.imagePath && <p className={css.errorText}>* จำเป็นต้องมีรูปภาพ</p>}
                  </div>

                  {/* Settings specific to visuals (Gradient) */}
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ฟิลเตอร์สี (เพื่อให้อ่านข้อความง่ายขึ้น)</label>
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
                            <span className={css.presetSwatch} style={{ background: "#f1f5f9" }}><X size={10} color="#94a3b8" /></span>
                          )}
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status & Order */}
                  <div className={`${css.formGroup} ${css.inlineGroup}`}>
                    <div className={css.flex1}>
                      <label className={css.formLabel}>ลำดับแสดงผล</label>
                      <input
                        type="number"
                        className={css.formInput}
                        value={form.sortOrder}
                        onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        min={0}
                      />
                    </div>
                    <div className={css.flex1}>
                      <label className={css.formLabel}>สถานะสไลด์</label>
                      <div
                        className={`${css.customToggle} ${form.isActive ? css.customToggleActive : css.customToggleInactive}`}
                        onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      >
                        <div className={css.toggleKnob} />
                        <span className={css.toggleText}>
                          {form.isActive ? "แสดง" : "ซ่อน"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Content Preview (Live) */}
                  {form.imagePath && (
                    <div className={css.formGroup} style={{ marginTop: 'auto' }}>
                      <label className={css.formLabel}>ตัวอย่างการแสดงผล</label>
                      <div className={css.previewWrap}>
                        <img src={form.imagePath} alt="Preview" className={css.previewImg} />
                        {form.bgGradient && (
                          <div className={css.previewOverlay} style={{ background: form.bgGradient }} />
                        )}
                        {(form.title || form.subtitle || form.description || form.ctaText) && (
                          <div className={css.previewContent}>
                            {form.title && <h2 className={css.previewTitle}>{form.title}</h2>}
                            {form.subtitle && <h3 className={css.previewSubtitle}>{form.subtitle}</h3>}
                            {form.description && <p className={css.previewDesc}>{form.description}</p>}
                            {form.ctaText && <span className={css.previewCta}>{form.ctaText}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Text & Links */}
                <div className={css.rightCol}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>หัวข้อหลัก</label>
                    <input
                      type="text"
                      className={css.formInput}
                      placeholder="เช่น ข่าวประชาสัมพันธ์ใหม่..."
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className={css.formGroup}>
                    <label className={css.formLabel}>หัวข้อรอง</label>
                    <input
                      type="text"
                      className={css.formInput}
                      placeholder="อธิบายย่อ..."
                      value={form.subtitle}
                      onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>

                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ลิงก์ปลายทาง (URL)</label>
                    <div className={css.inputWithIcon}>
                      <span className={css.inputIcon}><LinkIcon size={14} /></span>
                      <input
                        type="url"
                        className={`${css.formInput} ${css.formInputWithIcon}`}
                        placeholder="https://..."
                        value={form.urlLink}
                        onChange={(e) => setForm((prev) => ({ ...prev, urlLink: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ข้อความบนปุ่ม (ปุ่มจะแสดงเมื่อใส่ลิงก์)</label>
                    <input
                      type="text"
                      className={css.formInput}
                      placeholder="เช่น อ่านเพิ่มเติม..."
                      value={form.ctaText}
                      onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                    />
                  </div>

                  <div className={css.formGroup} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className={css.formLabel}>รายละเอียดแบบยาว (ตัวเลือก)</label>
                    <textarea
                      className={css.formTextarea}
                      style={{ flexGrow: 1 }}
                      placeholder="หากต้องการใส่รายละเอียดเพิ่มเติม..."
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={css.modalFooter}>
              <button className={css.cancelBtn} onClick={closeModal}>
                ยกเลิก
              </button>
              <button
                className={`${css.saveBtn} ${saving ? css.saveBtnLoading : ''}`}
                onClick={handleSave}
                disabled={saving || !form.imagePath}
              >
                {saving ? (
                  <>
                    <div className={css.btnSpinner} />
                    บันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {editingId ? "บันทึก" : "เพิ่ม"}สไลด์ใหม่
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
