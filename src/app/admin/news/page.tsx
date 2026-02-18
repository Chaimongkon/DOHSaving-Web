"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface News {
  id: number;
  title: string | null;
  details: string | null;
  imagePath: string | null;
  pdfPath: string | null;
  category: string;
  viewCount: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsForm {
  title: string;
  details: string;
  imagePath: string;
  pdfPath: string;
  category: string;
  isActive: boolean;
}

const defaultForm: NewsForm = {
  title: "",
  details: "",
  imagePath: "",
  pdfPath: "",
  category: "general",
  isActive: true,
};

const categories = [
  { value: "all", label: "ทั้งหมด" },
  { value: "announcement", label: "ประกาศ" },
  { value: "member-approval", label: "อนุมัติสมาชิก" },
  { value: "general", label: "ทั่วไป" },
];

const categoryColors: Record<string, string> = {
  announcement: "#E8652B",
  "member-approval": "#2d6a4f",
  general: "#1a3a5c",
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NewsForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Fetch news
  const fetchNews = async () => {
    try {
      const res = await fetch("/api/admin/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (item: News) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      details: item.details || "",
      imagePath: item.imagePath || "",
      pdfPath: item.pdfPath || "",
      category: item.category,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  // Upload image
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news");

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

  // Upload PDF
  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news-pdf");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, pdfPath: data.url }));
      } else {
        alert(data.error || "อัพโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัพโหลดไม่สำเร็จ");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("กรุณาระบุหัวข้อข่าว");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/news/${editingId}`
        : "/api/admin/news";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        closeModal();
        fetchNews();
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
    if (!confirm("ต้องการลบข่าวนี้?")) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNews();
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

  // Filtered list
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className={css.header}>
        <h1 className={css.title}>จัดการข่าวประชาสัมพันธ์</h1>
        <button className={css.addBtn} onClick={openCreate}>
          <PlusOutlined /> เพิ่มข่าว
        </button>
      </div>

      {/* Filter tabs */}
      <div className={css.filterRow}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`${css.filterBtn} ${filter === cat.value ? css.filterActive : ""}`}
            onClick={() => setFilter(cat.value)}
          >
            {cat.label} {cat.value === "all" ? `(${news.length})` : `(${news.filter((n) => n.category === cat.value).length})`}
          </button>
        ))}
      </div>

      {/* News grid */}
      {filtered.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><FileTextOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีข่าว — กดปุ่ม &quot;เพิ่มข่าว&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.grid}>
          {filtered.map((item) => (
            <div key={item.id} className={css.card}>
              <div className={css.imageWrap}>
                {item.imagePath ? (
                  <img
                    src={item.imagePath}
                    alt={item.title || "News"}
                    className={css.newsImage}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#d1d5db" }}>
                    <FileTextOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
                <span className={`${css.badge} ${item.isActive ? css.badgeActive : css.badgeInactive}`}>
                  {item.isActive ? "แสดง" : "ซ่อน"}
                </span>
                <span
                  className={css.categoryBadge}
                  style={{ background: categoryColors[item.category] || "#6b7280" }}
                >
                  {categories.find((c) => c.value === item.category)?.label || item.category}
                </span>
                <span className={css.viewCount}>
                  <EyeOutlined /> {item.viewCount}
                </span>
              </div>
              <div className={css.cardBody}>
                <p className={css.cardTitle}>{item.title || "ไม่มีหัวข้อ"}</p>
                {item.details && <p className={css.cardDetails}>{item.details}</p>}
                <p className={css.cardMeta}>
                  {formatDate(item.createdAt)} • โดย: {item.createdBy || "—"}
                  {item.pdfPath && " • 📎 มีไฟล์ PDF"}
                </p>
              </div>
              <div className={css.actions}>
                <button className={css.actionBtn} onClick={() => openEdit(item)}>
                  <EditOutlined /> แก้ไข
                </button>
                <button className={`${css.actionBtn} ${css.deleteBtn}`} onClick={() => handleDelete(item.id)}>
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
                {editingId ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}
              </h3>
              <button className={css.modalClose} onClick={closeModal}>
                <CloseOutlined />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Title */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>หัวข้อข่าว *</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="ระบุหัวข้อข่าว..."
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Details */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>รายละเอียด</label>
                <textarea
                  className={css.formTextarea}
                  placeholder="รายละเอียดข่าว..."
                  rows={4}
                  value={form.details}
                  onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>หมวดหมู่</label>
                <select
                  className={css.formSelect}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="general">ทั่วไป</option>
                  <option value="announcement">ประกาศ</option>
                  <option value="member-approval">อนุมัติสมาชิก</option>
                </select>
              </div>

              {/* Image upload */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>รูปภาพประกอบ</label>
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
                    <p className={css.uploadHint}>แนะนำ: 600 x 400 px</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleUploadImage}
                />
              </div>

              {/* PDF upload */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>ไฟล์ PDF (ไม่บังคับ)</label>
                {form.pdfPath ? (
                  <div className={css.pdfLink}>
                    <FilePdfOutlined />
                    <span>{form.pdfPath.split("/").pop()}</span>
                    <button
                      className={css.pdfRemove}
                      onClick={() => setForm((prev) => ({ ...prev, pdfPath: "" }))}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ) : (
                  <div
                    className={css.uploadArea}
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <div className={css.uploadIcon}>
                      <FilePdfOutlined />
                    </div>
                    <p className={css.uploadText}>
                      {uploadingPdf ? "กำลังอัพโหลด..." : "คลิกเพื่อเลือกไฟล์ PDF"}
                    </p>
                  </div>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={handleUploadPdf}
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
            </div>

            <div className={css.modalFooter}>
              <button className={css.cancelBtn} onClick={closeModal}>ยกเลิก</button>
              <button
                className={css.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
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
