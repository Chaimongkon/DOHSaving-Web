"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, UploadOutlined, FilePdfOutlined, LoadingOutlined, FileTextOutlined, PictureOutlined } from "@ant-design/icons";

interface DocItem {
  id?: number;
  year: number;
  title: string;
  fileUrl: string;
  coverUrl: string;
  category: string;
  sortOrder: number;
  description: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "general", label: "ทั่วไป" },
  { value: "agenda", label: "ระเบียบวาระ" },
  { value: "financial", label: "งบการเงิน" },
  { value: "plan", label: "แผนงาน" },
  { value: "report", label: "รายงาน" },
  { value: "other", label: "อื่นๆ" },
];

const currentBEYear = new Date().getFullYear() + 543;
const empty: DocItem = { year: currentBEYear, title: "", fileUrl: "", coverUrl: "", category: "general", sortOrder: 0, description: "", isActive: true };

export default function AdminMeetingDocumentsPage() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [editing, setEditing] = useState<DocItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState<"pdf" | "cover" | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/meeting-documents", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อเอกสาร");
    if (!editing.fileUrl) return alert("กรุณาอัปโหลดไฟล์ PDF");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      year: editing.year,
      title: editing.title.trim(),
      fileUrl: editing.fileUrl,
      coverUrl: editing.coverUrl || null,
      category: editing.category,
      sortOrder: editing.sortOrder,
      description: editing.description?.trim() || null,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/meeting-documents", {
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
    if (!confirm("ลบเอกสารนี้?")) return;
    await fetch(`/api/admin/meeting-documents?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const uploadFile = async (file: File, type: "pdf" | "cover") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "meeting-documents");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (editing) {
          if (type === "pdf") setEditing({ ...editing, fileUrl: data.url });
          else setEditing({ ...editing, coverUrl: data.url });
        }
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploading(null);
  };

  const getCategoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <FileTextOutlined /> เอกสารประกอบการประชุม
        </h2>
        <button
          onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
          <PlusOutlined /> เพิ่มเอกสาร
        </button>
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isNew ? "เพิ่มเอกสารใหม่" : "แก้ไขเอกสาร"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ปี พ.ศ.</label>
              <input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>หมวดหมู่</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ลำดับ</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>ชื่อเอกสาร</label>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={inputStyle} placeholder="เช่น รายงานการประชุมใหญ่สามัญประจำปี 2568" />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>คำอธิบาย (ไม่บังคับ)</label>
            <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="คำอธิบายเอกสาร..." />
          </div>

          {/* File Uploads */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ไฟล์ PDF</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "pdf"); }} />
                <button onClick={() => pdfInputRef.current?.click()} disabled={uploading === "pdf"} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>
                  {uploading === "pdf" ? <LoadingOutlined spin /> : <UploadOutlined />}
                  {uploading === "pdf" ? "กำลังอัปโหลด..." : "เลือกไฟล์ PDF"}
                </button>
                {editing.fileUrl && (
                  <a href={editing.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#dc2626" }}>
                    <FilePdfOutlined /> ดูไฟล์
                  </a>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>ภาพปก (ไม่บังคับ)</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "cover"); }} />
                <button onClick={() => coverInputRef.current?.click()} disabled={uploading === "cover"} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>
                  {uploading === "cover" ? <LoadingOutlined spin /> : <PictureOutlined />}
                  {uploading === "cover" ? "กำลังอัปโหลด..." : "เลือกภาพปก"}
                </button>
                {editing.coverUrl && <img src={editing.coverUrl} alt="cover" style={{ height: 36, borderRadius: 4, border: "1px solid #e5e7eb" }} />}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            <label style={{ fontSize: 13 }}>เผยแพร่</label>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <SaveOutlined /> บันทึก
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <CloseOutlined /> ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <FileTextOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีเอกสารประกอบการประชุม</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", opacity: item.isActive ? 1 : 0.5, transition: "all 0.2s" }}>
              <div style={{ width: 40, height: 40, background: "#fef3c7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FilePdfOutlined style={{ fontSize: 18, color: "#d97706" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{item.title}</h4>
                  <span style={{ background: "#dbeafe", color: "#1e40af", padding: "1px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>พ.ศ. {item.year}</span>
                  <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "1px 8px", borderRadius: 4, fontSize: 10 }}>{getCategoryLabel(item.category)}</span>
                  {!item.isActive && <span style={{ background: "#fef2f2", color: "#dc2626", padding: "1px 8px", borderRadius: 4, fontSize: 10 }}>ซ่อน</span>}
                </div>
                {item.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{item.description}</p>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditing({ ...item }); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>
                  <EditOutlined /> แก้ไข
                </button>
                <button onClick={() => item.id && remove(item.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
                  <DeleteOutlined /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
