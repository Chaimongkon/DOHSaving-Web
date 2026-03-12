"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  UploadCloud,
  BellRing,
  Link,
  Calendar,
  Eye,
  Zap,
} from "lucide-react";
import css from "./page.module.css";

interface Notification {
  id: number;
  title: string | null;
  imagePath: string | null;
  urlLink: string | null;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  clickCount: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationForm {
  title: string;
  imagePath: string;
  urlLink: string;
  sortOrder: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const defaultForm: NotificationForm = {
  title: "",
  imagePath: "",
  urlLink: "",
  sortOrder: 0,
  startDate: "",
  endDate: "",
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
      title: item.title || "",
      imagePath: item.imagePath || "",
      urlLink: item.urlLink || "",
      sortOrder: item.sortOrder ?? 0,
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
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
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            <BellRing size={28} />
          </div>
          <div>
            <h1 className={css.title}>จัดการป๊อปอัพแจ้งเตือน</h1>
            <p className={css.subtitle}>ตั้งค่ารูปภาพป๊อปอัพและแบนเนอร์ต่างๆ ที่จะเด้งขึ้นมาบนหน้าแรกของระบบ</p>
          </div>
        </div>
        <button className={css.addBtn} onClick={openCreate}>
          <Plus size={18} /> เพิ่มป๊อปอัพ
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><BellRing size={48} /></div>
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
                  <div className={css.noImagePlaceholder}>
                    <BellRing size={40} />
                  </div>
                )}

                <div className={css.badgesWrap}>
                  <span className={css.orderBadge}>#{item.sortOrder}</span>
                  <span className={`${css.badge} ${item.isActive ? css.badgeActive : css.badgeInactive}`}>
                    {item.isActive ? "แสดง" : "ซ่อน"}
                  </span>
                </div>
              </div>
              <div className={css.cardBody}>
                <div className={css.cardContent}>
                  <h3 className={css.cardName}>{item.title || `Popup #${item.id}`}</h3>
                  <p className={css.cardInfo}>
                    <Calendar size={14} /> สร้างเมื่อ: {formatDate(item.createdAt)}
                  </p>
                  {item.startDate || item.endDate ? (
                    <div className={css.cardSchedule}>
                      <Zap size={14} /> {item.startDate ? formatDate(item.startDate) : "เริ่มทันที"} — {item.endDate ? formatDate(item.endDate) : "ไม่มีสิ้นสุด"}
                    </div>
                  ) : null}

                  {item.urlLink && (
                    <a href={item.urlLink} target="_blank" rel="noopener noreferrer" className={css.cardLink}>
                      <Link size={14} /> {item.urlLink.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                <div className={css.cardStats}>
                  <span className={css.clickStat}>
                    <Eye size={14} /> {item.clickCount} วิว
                  </span>
                </div>
              </div>
              <div className={css.actions}>
                <button className={css.actionBtn} onClick={() => openEdit(item)}>
                  <Edit2 size={16} /> แก้ไข
                </button>
                <button className={`${css.actionBtn} ${css.deleteBtn}`} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} /> ลบ
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
                <X size={20} />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Left Column: Image & Preview */}
              <div className={css.leftCol}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>รูปภาพป๊อปอัพ <span style={{ color: '#ef4444' }}>*</span></label>
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
                        title="ลบรูปภาพ"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={css.uploadArea}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className={css.uploadIcon} />
                      <p className={css.uploadText}>
                        {uploading ? "กำลังอัพโหลด..." : "คลิกเพื่อเลือกรูปภาพ"}
                      </p>
                      <p className={css.uploadHint}>รองรับ JPG, PNG, WebP (แนะนำ: 520 x 600 px)</p>
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
              </div>

              {/* Right Column: Details & Settings */}
              <div className={css.rightCol}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>ชื่อ/หมายเหตุ (สำหรับแอดมิน)</label>
                  <input
                    type="text"
                    className={css.formInput}
                    placeholder="เช่น แคมเปญต้อนรับปีใหม่ 2568"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className={css.formGroup}>
                  <label className={css.formLabel}>ลิงก์ปลายทาง (เมื่อผู้ใช้คลิก)</label>
                  <input
                    type="text"
                    className={css.formInput}
                    placeholder="https://example.com"
                    value={form.urlLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, urlLink: e.target.value }))}
                  />
                </div>

                <div className={css.formGroup}>
                  <label className={css.formLabel}>ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    className={css.formInput}
                    value={form.sortOrder}
                    min={0}
                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                  <p className={css.formHint}>ค่าน้อยจะถูกแสดงก่อนค่ามาก</p>
                </div>

                <div className={css.formRow}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>เริ่มแสดงวันที่</label>
                    <input
                      type="date"
                      className={css.formInput}
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>สิ้นสุดวันที่</label>
                    <input
                      type="date"
                      className={css.formInput}
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <p className={css.formHint} style={{ marginTop: '-8px', marginBottom: '8px' }}>หากเว้นว่างไว้ จะแสดงผลตลอดเวลา</p>

                <div className={css.formGroup} style={{ marginTop: 'auto' }}>
                  <label className={css.formLabel}>สถานะการเผยแพร่</label>
                  <div className={css.toggle} onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))} style={{ cursor: 'pointer' }}>
                    <button
                      type="button"
                      className={`${css.toggleSwitch} ${form.isActive ? css.toggleOn : css.toggleOff}`}
                    />
                    <span className={css.toggleLabel}>
                      {form.isActive ? "แสดงผลอยู่" : "ซ่อนไว้"}
                    </span>
                  </div>
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
                {saving ? "กำลังบันทึก..." : "เก็บบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
