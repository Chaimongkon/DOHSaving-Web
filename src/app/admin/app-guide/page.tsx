/* eslint-disable react-hooks/set-state-in-effect */
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
  groupTitle: string;
  groupOrder: number;
  title: string;
  coverUrl: string;
  images: string; // JSON
  sortOrder: number;
  isActive: boolean;
}

const empty: SectionItem = { groupTitle: "", groupOrder: 0, title: "", coverUrl: "", images: "[]", sortOrder: 0, isActive: true };

export default function AdminAppGuidePage() {
  const [items, setItems] = useState<SectionItem[]>([]);
  const [editing, setEditing] = useState<SectionItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [images, setImages] = useState<GuideImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/app-guide", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Collect unique group titles for autocomplete
  const groupTitles = Array.from(new Set(items.map((i) => i.groupTitle).filter(Boolean)));

  const openEdit = (item: SectionItem) => {
    setEditing({ ...item, groupTitle: item.groupTitle || "", coverUrl: item.coverUrl || "" });
    setIsNew(false);
    try { setImages(JSON.parse(item.images || "[]")); } catch { setImages([]); }
  };

  const openNew = () => {
    setEditing({ ...empty });
    setIsNew(true);
    setImages([]);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) { alert("รองรับเฉพาะไฟล์รูปภาพ"); return; }
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "app-guide");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, coverUrl: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
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
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อหัวข้อย่อย");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      groupTitle: editing.groupTitle.trim() || null,
      groupOrder: editing.groupOrder,
      title: editing.title.trim(),
      coverUrl: editing.coverUrl || null,
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

  // Group items by groupTitle for display
  const grouped: { groupTitle: string; groupOrder: number; items: SectionItem[] }[] = [];
  for (const item of items) {
    const gt = item.groupTitle || "(ไม่มีกลุ่ม)";
    let group = grouped.find((g) => g.groupTitle === gt);
    if (!group) { group = { groupTitle: gt, groupOrder: item.groupOrder, items: [] }; grouped.push(group); }
    group.items.push(item);
  }
  grouped.sort((a, b) => a.groupOrder - b.groupOrder);

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", display: "block" };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>วิธีใช้งาน Application DOHSaving</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการหัวข้อหลักและหัวข้อย่อยพร้อมรูปปกและรูปรายละเอียด</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่มหัวข้อย่อย
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{isNew ? "เพิ่มหัวข้อย่อยใหม่" : "แก้ไขหัวข้อย่อย"}</h3>

          {/* Group Title + Group Order */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12, maxWidth: 700 }}>
            <div>
              <label style={labelStyle}>หัวข้อหลัก (กลุ่ม)</label>
              <input
                list="groupTitleList"
                value={editing.groupTitle}
                onChange={(e) => setEditing({ ...editing, groupTitle: e.target.value })}
                placeholder='เช่น "วิธีการติดตั้ง และ การลืมรหัสผ่าน"'
                style={inputStyle}
              />
              <datalist id="groupTitleList">
                {groupTitles.map((gt, i) => <option key={i} value={gt} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>ชื่อหัวข้อย่อย *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder='เช่น "ขั้นตอนดาวน์โหลด App"' style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ลำดับกลุ่ม</label>
              <input type="number" value={editing.groupOrder} onChange={(e) => setEditing({ ...editing, groupOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          {/* Sort Order */}
          <div style={{ display: "grid", gridTemplateColumns: "100px", gap: 12, maxWidth: 700, marginTop: 8 }}>
            <div>
              <label style={labelStyle}>ลำดับย่อย</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          {/* Cover Upload */}
          <div style={{ marginTop: 12, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
                  <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} />
                  รูปปก (Cover)
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 8px" }}>รูปที่จะแสดงในหน้ารวม (แนะนำขนาด 400x300)</p>
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: uploadingCover ? "#d1d5db" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: uploadingCover ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  {uploadingCover ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกรูปปก</>}
                </button>
              </div>
              {editing.coverUrl && (
                <div style={{ position: "relative" }}>
                  <img src={editing.coverUrl} alt="cover" style={{ height: 120, borderRadius: 8, border: "1px solid #e5e7eb", objectFit: "cover" }} />
                  <button onClick={() => setEditing({ ...editing, coverUrl: "" })} style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Images Upload */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>
                <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} />
                รูปภาพรายละเอียด ({images.length} รูป)
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

      {/* Grouped Section Cards */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <MenuOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีหัวข้อ</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {grouped.map((group, gIdx) => (
            <div key={gIdx}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 10px", paddingLeft: 12, borderLeft: "4px solid #E8652B" }}>
                <span style={{ color: "#E8652B", marginRight: 6 }}>{gIdx + 1}.</span>
                {group.groupTitle}
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>ลำดับกลุ่ม: {group.groupOrder}</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
                {group.items.map((item) => {
                  let imgCount = 0;
                  let firstImg = "";
                  try {
                    const parsed = JSON.parse(item.images || "[]");
                    imgCount = parsed.length;
                    if (parsed[0]?.imageUrl) firstImg = parsed[0].imageUrl;
                  } catch { /* */ }
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, opacity: item.isActive ? 1 : 0.5 }}>
                      <div style={{ width: 72, height: 54, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {(item.coverUrl || firstImg) ? (
                          <img src={item.coverUrl || firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <PictureOutlined style={{ fontSize: 22, color: "#d1d5db" }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#1f2937" }}>{item.title}</h4>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{imgCount} รูป · ลำดับย่อย {item.sortOrder}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: item.isActive ? "#d1fae5" : "#fee2e2", color: item.isActive ? "#065f46" : "#991b1b" }}>
                        {item.isActive ? "เผยแพร่" : "ซ่อน"}
                      </span>
                      <div>
                        <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 6 }} title="แก้ไข"><EditOutlined /></button>
                        <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }} title="ลบ"><DeleteOutlined /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
