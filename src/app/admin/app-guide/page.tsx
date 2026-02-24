"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined,
  UploadOutlined, PictureOutlined, LoadingOutlined, MenuOutlined,
} from "@ant-design/icons";

interface GuideImage {
  imageUrl: string;
  caption: string;
}

interface SectionItem {
  id?: number;
  title: string;
  images: string; // JSON
  sortOrder: number;
  isActive: boolean;
}

const empty: SectionItem = { title: "", images: "[]", sortOrder: 0, isActive: true };

export default function AdminAppGuidePage() {
  const [items, setItems] = useState<SectionItem[]>([]);
  const [editing, setEditing] = useState<SectionItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [images, setImages] = useState<GuideImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/app-guide", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (item: SectionItem) => {
    setEditing({ ...item });
    setIsNew(false);
    try { setImages(JSON.parse(item.images || "[]")); } catch { setImages([]); }
  };

  const openNew = () => {
    setEditing({ ...empty });
    setIsNew(true);
    setImages([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editing) return;
    setUploading(true);
    const newImages = [...images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "app-guide");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          newImages.push({ imageUrl: data.url, caption: "" });
        }
      } catch { /* skip */ }
    }
    setImages(newImages);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));
  const updateCaption = (idx: number, caption: string) => {
    const updated = [...images];
    updated[idx] = { ...updated[idx], caption };
    setImages(updated);
  };
  const moveImage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= images.length) return;
    const updated = [...images];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setImages(updated);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อหัวข้อ");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      title: editing.title.trim(),
      images: JSON.stringify(images),
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/app-guide", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบหัวข้อนี้?")) return;
    await fetch(`/api/admin/app-guide?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", display: "block" };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>วิธีใช้งาน Application DOHSaving</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการหัวข้อและรูปภาพแนะนำการใช้งานแอพ</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่มหัวข้อ
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{isNew ? "เพิ่มหัวข้อใหม่" : "แก้ไขหัวข้อ"}</h3>

          {/* Title + Sort */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12, maxWidth: 600 }}>
            <div>
              <label style={labelStyle}>ชื่อหัวข้อ *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder='เช่น "วิธีการติดตั้ง และ การลืมรหัสผ่าน"' style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ลำดับ</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          {/* Images Upload */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>
                <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} />
                รูปภาพประกอบ ({images.length} รูป)
              </p>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: uploading ? "#d1d5db" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 12 }}
                >
                  {uploading ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> อัปโหลดรูป</>}
                </button>
              </div>
            </div>

            {images.length === 0 && (
              <div style={{ padding: 32, background: "#f9fafb", border: "2px dashed #d1d5db", borderRadius: 10, textAlign: "center", color: "#9ca3af" }}>
                <PictureOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13 }}>ยังไม่มีรูปภาพ กดปุ่ม &quot;อัปโหลดรูป&quot; (เลือกได้หลายรูปพร้อมกัน)</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 8 }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                  <img src={img.imageUrl} alt="" style={{ width: "100%", height: 160, objectFit: "contain", background: "#fff" }} />
                  <div style={{ padding: 8 }}>
                    <input
                      value={img.caption}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      placeholder="คำอธิบายรูป (ไม่บังคับ)"
                      style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 11, boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} style={{ padding: "2px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 11, opacity: idx === 0 ? 0.3 : 1 }}>◀</button>
                        <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} style={{ padding: "2px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: idx === images.length - 1 ? "not-allowed" : "pointer", fontSize: 11, opacity: idx === images.length - 1 ? 0.3 : 1 }}>▶</button>
                      </div>
                      <button onClick={() => removeImage(idx)} style={{ padding: "2px 8px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 11 }}>ลบ</button>
                    </div>
                  </div>
                  {/* Number badge */}
                  <div style={{ position: "absolute", top: 6, left: 6, width: 24, height: 24, borderRadius: "50%", background: "#E8652B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{idx + 1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            <label style={{ fontSize: 13 }}>เผยแพร่</label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}><SaveOutlined /> บันทึก</button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><CloseOutlined /> ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Section Cards */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <MenuOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีหัวข้อ</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => {
            let imgCount = 0;
            let firstImg = "";
            try {
              const parsed = JSON.parse(item.images || "[]");
              imgCount = parsed.length;
              if (parsed[0]?.imageUrl) firstImg = parsed[0].imageUrl;
            } catch { /* */ }
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, opacity: item.isActive ? 1 : 0.5 }}>
                {/* Thumbnail */}
                <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {firstImg ? (
                    <img src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <PictureOutlined style={{ fontSize: 24, color: "#d1d5db" }} />
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#1f2937" }}>{item.title}</h4>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{imgCount} รูป · ลำดับ {item.sortOrder}</span>
                </div>
                {/* Status */}
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: item.isActive ? "#d1fae5" : "#fee2e2", color: item.isActive ? "#065f46" : "#991b1b" }}>
                  {item.isActive ? "เผยแพร่" : "ซ่อน"}
                </span>
                {/* Actions */}
                <div>
                  <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 16, marginRight: 8 }} title="แก้ไข"><EditOutlined /></button>
                  <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }} title="ลบ"><DeleteOutlined /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
