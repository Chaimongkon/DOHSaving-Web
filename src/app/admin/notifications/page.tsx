"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  NotificationOutlined,
  LinkOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface Notification {
  id: number;
  imagePath: string | null;
  urlLink: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationForm {
  imagePath: string;
  urlLink: string;
  isActive: boolean;
}

const defaultForm: NotificationForm = {
  imagePath: "",
  urlLink: "",
  isActive: false,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch
  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
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

  const openEdit = (item: Notification) => {
    setEditingId(item.id);
    setForm({
      imagePath: item.imagePath || "",
      urlLink: item.urlLink || "",
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
    formData.append("folder", "notifications");

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

  // Save
  const handleSave = async () => {
    if (!form.imagePath) {
      alert("กรุณาอัพโหลดรูปภาพ");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : "/api/admin/notifications";
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

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
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
        <h1 className={css.title}>จัดการป๊อปอัพแจ้งเตือน</h1>
        <button className={css.addBtn} onClick={openCreate}>
          <PlusOutlined /> เพิ่มป๊อปอัพ
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><NotificationOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีป๊อปอัพ — กดปุ่ม &quot;เพิ่มป๊อปอัพ&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.grid}>
          {items.map((item) => (
            <div key={item.id} className={css.card}>
              <div className={css.imageWrap}>
                {item.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imagePath}
                    alt={`Popup ${item.id}`}
                    className={css.cardImage}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#d1d5db" }}>
                    <NotificationOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
                <span className={`${css.badge} ${item.isActive ? css.badgeActive : css.badgeInactive}`}>
                  {item.isActive ? "แสดง" : "ซ่อน"}
                </span>
              </div>
              <div className={css.cardBody}>
                <p className={css.cardInfo}>
                  <CalendarOutlined /> {formatDate(item.createdAt)} • โดย: {item.createdBy || "—"}
                </p>
                {item.urlLink ? (
                  <a href={item.urlLink} target="_blank" rel="noopener noreferrer" className={css.cardLink}>
                    <LinkOutlined /> {item.urlLink}
                  </a>
                ) : (
                  <span className={css.noLink}>ไม่มีลิงก์</span>
                )}
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
                {editingId ? "แก้ไขป๊อปอัพ" : "เพิ่มป๊อปอัพใหม่"}
              </h3>
              <button className={css.modalClose} onClick={closeModal}>
                <CloseOutlined />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Image upload */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>รูปภาพป๊อปอัพ *</label>
                {form.imagePath ? (
                  <div className={css.uploadPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <p className={css.uploadHint}>แนะนำ: 520 x 600 px (แนวตั้ง)</p>
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

              {/* URL Link */}
              <div className={css.formGroup}>
                <label className={css.formLabel}>ลิงก์ (ไม่บังคับ)</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="https://example.com — คลิกรูปแล้วเปิดลิงก์นี้"
                  value={form.urlLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, urlLink: e.target.value }))}
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
                    {form.isActive ? "แสดง — ผู้ใช้จะเห็นป๊อปอัพนี้เมื่อเปิดเว็บ" : "ซ่อน — ไม่แสดงให้ผู้ใช้"}
                  </span>
                </div>
              </div>
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
