"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface MediaItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  coverUrl: string | null;
  filePath: string | null;
  fileType: string;
  legacyPath: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface MediaForm {
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  filePath: string;
  fileType: string;
  legacyPath: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: MediaForm = {
  title: "",
  description: "",
  category: "สมาชิกทุกประเภท",
  coverUrl: "",
  filePath: "",
  fileType: "pdf",
  legacyPath: "",
  sortOrder: 0,
  isActive: true,
};

const CATEGORIES = ["ทั้งหมด", "สมาชิกทุกประเภท", "สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ"];

const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "วิดีโอ" },
  { value: "image", label: "รูปภาพ" },
  { value: "link", label: "ลิงก์ภายนอก" },
];

const FILE_TYPE_ICON: Record<string, string> = {
  pdf: "📄",
  video: "🎬",
  image: "🖼️",
  link: "🔗",
};

export default function MemberMediaAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MediaForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/member-media");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      coverUrl: item.coverUrl || "",
      filePath: item.filePath || "",
      fileType: item.fileType,
      legacyPath: item.legacyPath || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverUrl" | "filePath",
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, [field]: url }));
      } else {
        alert("อัปโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดไม่สำเร็จ");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.title || !form.category) {
      alert("กรุณากรอกชื่อและหมวดหมู่");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/member-media/${editingId}`
        : "/api/admin/member-media";
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
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    try {
      await fetch(`/api/admin/member-media/${id}`, { method: "DELETE" });
      fetchItems();
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleToggle = async (item: MediaItem) => {
    try {
      await fetch(`/api/admin/member-media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      fetchItems();
    } catch { /* ignore */ }
  };

  const filtered = activeTab === "ทั้งหมด"
    ? items
    : items.filter((i) => i.category === activeTab);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>จัดการสื่อสำหรับสมาชิก</h1>
          <p>เพิ่ม แก้ไข ลบ เอกสารและสื่อสำหรับสมาชิก</p>
        </div>
        <div className={css.actions}>
          <button className={css.btnAdd} onClick={openCreate}>
            <PlusOutlined /> เพิ่มสื่อใหม่
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className={css.tabs}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${css.tab} ${activeTab === cat ? css.tabActive : ""}`}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
            {cat === "ทั้งหมด"
              ? ` (${items.length})`
              : ` (${items.filter((i) => i.category === cat).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><BookOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีรายการ — กดปุ่ม &quot;เพิ่มสื่อใหม่&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <table className={css.table}>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>หมวดหมู่</th>
              <th>ประเภท</th>
              <th>ลำดับ</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className={css.titleCell}>
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt="" className={css.coverThumb} />
                    ) : (
                      <div className={css.coverPlaceholder}>
                        {FILE_TYPE_ICON[item.fileType] || "📄"}
                      </div>
                    )}
                    <div className={css.titleText}>
                      <span className={css.titleName}>{item.title}</span>
                      {item.description && (
                        <span className={css.titleDesc}>{item.description}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{item.category}</td>
                <td>
                  <span className={`${css.badge} ${css[`badge${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}`] || css.badgePdf}`}>
                    {FILE_TYPES.find((f) => f.value === item.fileType)?.label || item.fileType}
                  </span>
                </td>
                <td>{item.sortOrder}</td>
                <td>
                  <button
                    className={item.isActive ? css.statusOn : css.statusOff}
                    onClick={() => handleToggle(item)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <span className={css.statusDot} style={{ background: item.isActive ? "#16a34a" : "#d1d5db" }} />
                    {item.isActive ? "เปิด" : "ปิด"}
                  </button>
                </td>
                <td>
                  <div className={css.actionBtns}>
                    <button className={css.btnEdit} onClick={() => openEdit(item)}>
                      <EditOutlined /> แก้ไข
                    </button>
                    <button className={css.btnDel} onClick={() => handleDelete(item.id)}>
                      <DeleteOutlined /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <div className={css.overlay} onClick={closeModal}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                {editingId ? "แก้ไขสื่อ" : "เพิ่มสื่อใหม่"}
              </h3>
              <button className={css.modalClose} onClick={closeModal}>✕</button>
            </div>
            <div className={css.modalBody}>
              <div className={css.formGroup}>
                <label className={css.formLabel}>ชื่อ *</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="เช่น บริการด้านสินเชื่อ"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>รายละเอียด</label>
                <textarea
                  className={css.formTextarea}
                  placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={css.formRow}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>หมวดหมู่ *</label>
                  <select
                    className={css.formSelect}
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>ประเภทไฟล์</label>
                  <select
                    className={css.formSelect}
                    value={form.fileType}
                    onChange={(e) => setForm((p) => ({ ...p, fileType: e.target.value }))}
                  >
                    {FILE_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>ภาพปก</label>
                {!form.coverUrl ? (
                  <div className={css.uploadZone}>
                    <input
                      ref={coverRef}
                      type="file"
                      accept="image/*"
                      className={css.uploadZoneInput}
                      onChange={(e) => handleUpload(e, "coverUrl", setUploadingCover)}
                      disabled={uploadingCover}
                    />
                    <span className={css.uploadZoneIcon}>🖼️</span>
                    <span className={css.uploadZoneText}>
                      {uploadingCover ? "กำลังอัปโหลด..." : "คลิกเลือกภาพปก"}
                    </span>
                    <span className={css.uploadZoneHint}>ถ้าไม่มีจะแสดง icon ตามประเภทไฟล์</span>
                  </div>
                ) : (
                  <div className={css.uploadedFile}>
                    <span className={css.uploadedFileIcon}>✅</span>
                    <span className={css.uploadedFileName}>{form.coverUrl.split("/").pop()}</span>
                    <button
                      type="button"
                      className={css.uploadedFileRemove}
                      onClick={() => setForm((p) => ({ ...p, coverUrl: "" }))}
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  {form.fileType === "link" ? "URL ลิงก์" : "ไฟล์"}
                </label>
                {form.fileType === "link" ? (
                  <input
                    type="text"
                    className={css.formInput}
                    placeholder="https://..."
                    value={form.filePath}
                    onChange={(e) => setForm((p) => ({ ...p, filePath: e.target.value }))}
                  />
                ) : !form.filePath ? (
                  <div className={css.uploadZone}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={form.fileType === "pdf" ? ".pdf" : form.fileType === "video" ? "video/*" : "image/*"}
                      className={css.uploadZoneInput}
                      onChange={(e) => handleUpload(e, "filePath", setUploadingFile)}
                      disabled={uploadingFile}
                    />
                    <span className={css.uploadZoneIcon}>{FILE_TYPE_ICON[form.fileType] || "📄"}</span>
                    <span className={css.uploadZoneText}>
                      {uploadingFile ? "กำลังอัปโหลด..." : "คลิกเลือกไฟล์"}
                    </span>
                  </div>
                ) : (
                  <div className={css.uploadedFile}>
                    <span className={css.uploadedFileIcon}>✅</span>
                    <span className={css.uploadedFileName}>{form.filePath.split("/").pop()}</span>
                    <button
                      type="button"
                      className={css.uploadedFileRemove}
                      onClick={() => setForm((p) => ({ ...p, filePath: "" }))}
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>ชื่อไฟล์เก่า (Legacy Redirect)</label>
                <input
                  type="text"
                  className={css.formInput}
                  placeholder="เช่น d1e18c72-3a85-44c0-8b56-4006d934c177.pdf"
                  value={form.legacyPath}
                  onChange={(e) => setForm((p) => ({ ...p, legacyPath: e.target.value }))}
                />
                <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  ใส่ชื่อไฟล์เก่าจาก URL เดิม เพื่อให้ลิงก์เก่ายังใช้งานได้ (จาก /MemberMedia/File/xxx.pdf)
                </span>
              </div>

              <div className={css.formRow}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>ลำดับการแสดง</label>
                  <input
                    type="number"
                    className={css.formInput}
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>สถานะ</label>
                  <div className={css.toggleRow}>
                    <button
                      type="button"
                      className={`${css.toggleSwitch} ${form.isActive ? css.toggleOn : css.toggleOff}`}
                      onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    />
                    <span className={css.toggleLabel}>
                      {form.isActive ? "เปิดใช้งาน" : "ปิดอยู่"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.modalFooter}>
              <button className={css.btnCancel} onClick={closeModal}>ยกเลิก</button>
              <button className={css.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
