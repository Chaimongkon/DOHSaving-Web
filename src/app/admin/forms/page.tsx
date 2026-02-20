"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, FileOutlined, UploadOutlined, FilePdfOutlined, LoadingOutlined, FilterOutlined } from "@ant-design/icons";

const CATEGORIES = ["สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ", "สมาชิกทุกประเภท"];
const GROUPS = [
  "แบบฟอร์มสมัครสมาชิก",
  "แบบฟอร์มเงินฝาก-ถอน",
  "แบบฟอร์มเกี่ยวกับเงินกู้",
  "แบบฟอร์มขอสวัสดิการ",
  "แบบฟอร์มหนังสือร้องทุกข์",
  "หนังสือแต่งตั้งผู้รับโอนประโยชน์",
  "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์",
  "แบบฟอร์มอื่นๆ",
];

interface FormItem {
  id?: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: FormItem = { category: CATEGORIES[0], group: GROUPS[0], title: "", fileUrl: "", sortOrder: 0, isActive: true };

export default function AdminFormsPage() {
  const [items, setItems] = useState<FormItem[]>([]);
  const [editing, setEditing] = useState<FormItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("ทั้งหมด");
  const [filterGroup, setFilterGroup] = useState<string>("ทั้งหมด");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/forms", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    if (filterCat !== "ทั้งหมด" && i.category !== filterCat) return false;
    if (filterGroup !== "ทั้งหมด" && i.group !== filterGroup) return false;
    return true;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์ PDF หรือรูปภาพ"); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB"); return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "forms");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, fileUrl: data.url });
      } else {
        const err = await res.json().catch(() => ({}));
        alert("อัปโหลดไม่สำเร็จ: " + (err.error || res.statusText));
      }
    } catch (err) { alert("อัปโหลดไม่สำเร็จ: " + String(err)); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { alert("กรุณาระบุชื่อแบบฟอร์ม"); return; }
    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      category: editing.category,
      group: editing.group,
      title: editing.title.trim(),
      fileUrl: editing.fileUrl || null,
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/forms", {
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
    if (!confirm("ลบแบบฟอร์มนี้?")) return;
    await fetch(`/api/admin/forms?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  const catColor = (cat: string) => {
    switch (cat) {
      case "สมาชิกสามัญ ก": return { bg: "#dbeafe", color: "#1e40af" };
      case "สมาชิกสามัญ ข": return { bg: "#fef3c7", color: "#92400e" };
      case "สมาชิกสมทบ": return { bg: "#d1fae5", color: "#065f46" };
      case "สมาชิกทุกประเภท": return { bg: "#fce7f3", color: "#9d174d" };
      default: return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>แบบฟอร์มต่างๆ</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการแบบฟอร์มสำหรับดาวน์โหลด แยกตามประเภทสมาชิก</p>
        </div>
        <button onClick={() => { setEditing({ ...empty }); setIsNew(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่มแบบฟอร์ม
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <FilterOutlined style={{ color: "#9ca3af" }} />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 600 }}>
          <option>ทั้งหมด</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 600 }}>
          <option>ทั้งหมด</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>({filtered.length} รายการ)</span>
      </div>

      {/* ── Edit / Create Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{isNew ? "เพิ่มแบบฟอร์มใหม่" : "แก้ไขแบบฟอร์ม"}</h3>

          {/* Row 1: Category + Group */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, maxWidth: 700 }}>
            <label style={labelStyle}>ประเภทสมาชิก
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={labelStyle}>หมวดหมู่
              <select value={editing.group} onChange={(e) => setEditing({ ...editing, group: e.target.value })} style={inputStyle}>
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label style={labelStyle}>ลำดับการแสดง
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </label>
          </div>

          {/* Row 2: Title */}
          <div style={{ marginTop: 12, maxWidth: 700 }}>
            <label style={labelStyle}>ชื่อแบบฟอร์ม *
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="เช่น แบบฟอร์มสมัครสมาชิก" style={inputStyle} />
            </label>
          </div>

          {/* Row 3: PDF Upload */}
          <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
                  <FilePdfOutlined style={{ color: "#dc2626", marginRight: 6 }} />
                  ไฟล์แบบฟอร์ม (PDF)
                </p>
                {editing.fileUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ อัปโหลดแล้ว</span>
                    <a href={editing.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0369a1", textDecoration: "underline" }}>ดูไฟล์</a>
                    <button onClick={() => setEditing({ ...editing, fileUrl: "" })} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>ลบไฟล์</button>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>รองรับ PDF และรูปภาพ ขนาดไม่เกิน 10MB</p>
                )}
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleUpload} style={{ display: "none" }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: uploading ? "#d1d5db" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  {uploading ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกไฟล์ PDF</>}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}><SaveOutlined /> บันทึก</button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><CloseOutlined /> ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ประเภทสมาชิก</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>หมวดหมู่</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ชื่อแบบฟอร์ม</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ไฟล์</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280", width: 60 }}>ลำดับ</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const cc = catColor(item.category);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: cc.bg, color: cc.color }}>{item.category}</span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{item.group}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{item.title}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    {item.fileUrl ? (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#eff6ff", borderRadius: 6, color: "#0369a1", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        <FilePdfOutlined /> PDF
                      </a>
                    ) : <span style={{ color: "#d1d5db", fontSize: 12 }}><FileOutlined /> -</span>}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{item.sortOrder}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button onClick={() => { setEditing({ ...item }); setIsNew(false); }} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }} title="แก้ไข"><EditOutlined /></button>
                    <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }} title="ลบ"><DeleteOutlined /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีแบบฟอร์ม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
