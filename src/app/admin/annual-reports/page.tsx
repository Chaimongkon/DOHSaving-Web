"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, UploadOutlined, FilePdfOutlined, LoadingOutlined, BookOutlined, PictureOutlined } from "@ant-design/icons";

interface ReportItem {
  id?: number;
  year: number;
  title: string;
  coverUrl: string;
  fileUrl: string;
  legacyPath: string;
  description: string;
  isActive: boolean;
}

const currentBEYear = new Date().getFullYear() + 543;
const empty: ReportItem = { year: currentBEYear, title: "", coverUrl: "", fileUrl: "", legacyPath: "", description: "", isActive: true };

export default function AdminAnnualReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [editing, setEditing] = useState<ReportItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState<"pdf" | "cover" | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/annual-reports", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อรายงาน");
    if (!editing.fileUrl) return alert("กรุณาอัปโหลดไฟล์ PDF");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      year: editing.year,
      title: editing.title.trim(),
      coverUrl: editing.coverUrl || null,
      fileUrl: editing.fileUrl,
      legacyPath: editing.legacyPath?.trim() || null,
      description: editing.description?.trim() || null,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/annual-reports", {
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
    if (!confirm("ลบรายงานนี้?")) return;
    await fetch(`/api/admin/annual-reports?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const uploadFile = async (file: File, type: "pdf" | "cover") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "annual-reports");
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

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOutlined /> รายงานประจำปี (eBook)
        </h2>
        <button
          onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
          <PlusOutlined /> เพิ่มรายงาน
        </button>
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isNew ? "เพิ่มรายงานใหม่" : "แก้ไขรายงาน"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ปี พ.ศ.</label>
              <input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ชื่อรายงาน</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={inputStyle} placeholder="เช่น รายงานประจำปี 2567" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>คำอธิบาย (ไม่บังคับ)</label>
            <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="คำอธิบายรายงาน..." />
          </div>

          {/* PDF Upload */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ไฟล์ PDF</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "pdf"); }}
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploading === "pdf"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}
                >
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

            {/* Cover Upload */}
            <div>
              <label style={labelStyle}>ภาพปก (ไม่บังคับ)</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "cover"); }}
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading === "cover"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}
                >
                  {uploading === "cover" ? <LoadingOutlined spin /> : <PictureOutlined />}
                  {uploading === "cover" ? "กำลังอัปโหลด..." : "เลือกภาพปก"}
                </button>
                {editing.coverUrl && (
                  <img src={editing.coverUrl} alt="cover" style={{ height: 36, borderRadius: 4, border: "1px solid #e5e7eb" }} />
                )}
              </div>
            </div>
          </div>

          {/* Legacy Path */}
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>ชื่อไฟล์เก่า (Legacy Redirect)</label>
            <input value={editing.legacyPath} onChange={(e) => setEditing({ ...editing, legacyPath: e.target.value })} placeholder="เช่น a1710c90-bb47-46d6-bae2-8335eccefc1e.pdf" style={inputStyle} />
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "block" }}>
              ใส่ชื่อไฟล์เก่า เพื่อให้ /BusinessReport/File/Pdf/xxx.pdf ยัง redirect ได้
            </span>
          </div>

          {/* Active toggle */}
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
          <BookOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีรายงานประจำปี</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: item.isActive ? 1 : 0.5, transition: "all 0.2s" }}>
              {/* Cover */}
              <div style={{ height: 180, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                    <BookOutlined style={{ fontSize: 48 }} />
                    <p style={{ marginTop: 8, fontSize: 12 }}>ไม่มีภาพปก</p>
                  </div>
                )}
                {!item.isActive && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>ซ่อน</div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>พ.ศ. {item.year}</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "8px 0 4px" }}>{item.title}</h4>
                {item.description && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{item.description}</p>}

                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <button onClick={() => { setEditing({ ...item }); setIsNew(false); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 0", border: "1px solid #d1d5db", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>
                    <EditOutlined /> แก้ไข
                  </button>
                  <button onClick={() => item.id && remove(item.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 0", border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
                    <DeleteOutlined /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
