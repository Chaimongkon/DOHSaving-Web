"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined,
  UploadOutlined, FileTextOutlined, LoadingOutlined, PictureOutlined,
  FilterOutlined,
} from "@ant-design/icons";

interface RegItem {
  id?: number;
  title: string;
  typeForm: string;
  typeMember: string;
  filePath: string;
  imagePath: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const TYPE_OPTIONS = [
  { value: "statute", label: "ข้อบังคับ" },
  { value: "rules", label: "ระเบียบ" },
  { value: "announcements", label: "ประกาศ" },
];

const empty: RegItem = {
  title: "", typeForm: "statute", typeMember: "", filePath: "", imagePath: "",
  description: "", sortOrder: 0, isActive: true,
};

export default function AdminRegulationsPage() {
  const [items, setItems] = useState<RegItem[]>([]);
  const [editing, setEditing] = useState<RegItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/regulations", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique categories for autocomplete
  const categories = Array.from(new Set(items.map((i) => i.typeMember).filter(Boolean)));

  const filtered = filterType === "all" ? items : items.filter((i) => i.typeForm === filterType);

  // Group by typeForm then typeMember
  const grouped: { typeForm: string; typeLabel: string; groups: { typeMember: string; items: RegItem[] }[] }[] = [];
  for (const item of filtered) {
    const tf = item.typeForm || "(ไม่ระบุ)";
    const tLabel = TYPE_OPTIONS.find((t) => t.value === tf)?.label || tf;
    let typeGroup = grouped.find((g) => g.typeForm === tf);
    if (!typeGroup) { typeGroup = { typeForm: tf, typeLabel: tLabel, groups: [] }; grouped.push(typeGroup); }
    const tm = item.typeMember || "(ไม่ระบุกลุ่ม)";
    let memberGroup = typeGroup.groups.find((g) => g.typeMember === tm);
    if (!memberGroup) { memberGroup = { typeMember: tm, items: [] }; typeGroup.groups.push(memberGroup); }
    memberGroup.items.push(item);
  }

  const openNew = () => { setEditing({ ...empty }); setIsNew(true); };
  const openEdit = (item: RegItem) => { setEditing({ ...item }); setIsNew(false); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "regulations");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, filePath: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) { alert("รองรับเฉพาะไฟล์รูปภาพ"); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "regulations");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, imagePath: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploadingImage(false);
    if (imgRef.current) imgRef.current.value = "";
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) return alert("กรุณาระบุชื่อเรื่อง");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      title: editing.title.trim(),
      typeForm: editing.typeForm,
      typeMember: editing.typeMember.trim() || null,
      filePath: editing.filePath || null,
      imagePath: editing.imagePath || null,
      description: editing.description.trim() || null,
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/regulations", {
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
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/admin/regulations?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", display: "block" };
  const btnStyle = (bg: string, color: string): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: bg, color, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>ข้อบังคับ ระเบียบ ประกาศ</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการเอกสารข้อบังคับ ระเบียบ และประกาศของสหกรณ์</p>
        </div>
        <button onClick={openNew} style={{ ...btnStyle("#E8652B", "#fff"), padding: "8px 16px", fontSize: 13 }}>
          <PlusOutlined /> เพิ่มรายการ
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <FilterOutlined style={{ color: "#6b7280" }} />
        <button onClick={() => setFilterType("all")} style={{ padding: "5px 14px", borderRadius: 20, border: filterType === "all" ? "2px solid #E8652B" : "1px solid #d1d5db", background: filterType === "all" ? "#FFF7ED" : "#fff", color: filterType === "all" ? "#E8652B" : "#6b7280", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>ทั้งหมด ({items.length})</button>
        {TYPE_OPTIONS.map((t) => {
          const count = items.filter((i) => i.typeForm === t.value).length;
          const active = filterType === t.value;
          return (
            <button key={t.value} onClick={() => setFilterType(t.value)} style={{ padding: "5px 14px", borderRadius: 20, border: active ? "2px solid #E8652B" : "1px solid #d1d5db", background: active ? "#FFF7ED" : "#fff", color: active ? "#E8652B" : "#6b7280", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{isNew ? "เพิ่มรายการใหม่" : "แก้ไขรายการ"}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12, maxWidth: 700 }}>
            <div>
              <label style={labelStyle}>ประเภท *</label>
              <select value={editing.typeForm} onChange={(e) => setEditing({ ...editing, typeForm: e.target.value })} style={inputStyle}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>กลุ่มสมาชิก / หมวดหมู่</label>
              <input
                list="memberTypeList"
                value={editing.typeMember}
                onChange={(e) => setEditing({ ...editing, typeMember: e.target.value })}
                placeholder='เช่น "สมาชิกสามัญประเภท ก"'
                style={inputStyle}
              />
              <datalist id="memberTypeList">
                {categories.map((c, i) => <option key={i} value={c} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>ลำดับ</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 8, maxWidth: 700 }}>
            <label style={labelStyle}>ชื่อเรื่อง *</label>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="เช่น ข้อบังคับสหกรณ์ พ.ศ.2562" style={inputStyle} />
          </div>

          <div style={{ marginTop: 8, maxWidth: 700 }}>
            <label style={labelStyle}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
            <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="คำอธิบายสั้นๆ" style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* File + Image upload */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12, maxWidth: 700 }}>
            {/* PDF File */}
            <div style={{ padding: 14, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>
                <FileTextOutlined style={{ color: "#E8652B", marginRight: 6 }} /> ไฟล์เอกสาร (PDF)
              </p>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploadingFile} style={btnStyle(uploadingFile ? "#d1d5db" : "#0369a1", "#fff")}>
                {uploadingFile ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกไฟล์</>}
              </button>
              {editing.filePath && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <a href={editing.filePath} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0369a1", wordBreak: "break-all" }}>
                    {editing.filePath.split("/").pop()}
                  </a>
                  <button onClick={() => setEditing({ ...editing, filePath: "" })} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              )}
            </div>

            {/* Image */}
            <div style={{ padding: 14, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>
                <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} /> รูปประกอบ (ไม่บังคับ)
              </p>
              <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <button onClick={() => imgRef.current?.click()} disabled={uploadingImage} style={btnStyle(uploadingImage ? "#d1d5db" : "#0369a1", "#fff")}>
                {uploadingImage ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกรูป</>}
              </button>
              {editing.imagePath && (
                <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
                  <img src={editing.imagePath} alt="" style={{ height: 80, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <button onClick={() => setEditing({ ...editing, imagePath: "" })} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Active + Actions */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            <label style={{ fontSize: 13 }}>เผยแพร่</label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={save} style={{ ...btnStyle("#16a34a", "#fff"), padding: "8px 20px", fontSize: 13 }}><SaveOutlined /> บันทึก</button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><CloseOutlined /> ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Items List — grouped */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <FileTextOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีรายการ</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {grouped.map((tg, tIdx) => (
            <div key={tIdx}>
              {filterType === "all" && (
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 12px", paddingLeft: 12, borderLeft: "4px solid #E8652B" }}>
                  {tg.typeLabel}
                </h2>
              )}
              {tg.groups.map((mg, mIdx) => (
                <div key={mIdx} style={{ marginBottom: 16, paddingLeft: filterType === "all" ? 16 : 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "0 0 8px", paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>
                    {mg.typeMember}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mg.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, opacity: item.isActive ? 1 : 0.5 }}>
                        {item.imagePath ? (
                          <img src={item.imagePath} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileTextOutlined style={{ fontSize: 18, color: "#94a3b8" }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                          {item.filePath && (
                            <a href={item.filePath} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0369a1" }}>ดูไฟล์</a>
                          )}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: item.isActive ? "#d1fae5" : "#fee2e2", color: item.isActive ? "#065f46" : "#991b1b", flexShrink: 0 }}>
                          {item.isActive ? "เผยแพร่" : "ซ่อน"}
                        </span>
                        <div style={{ flexShrink: 0 }}>
                          <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 4 }} title="แก้ไข"><EditOutlined /></button>
                          <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }} title="ลบ"><DeleteOutlined /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
