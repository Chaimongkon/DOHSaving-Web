"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, FileOutlined, UploadOutlined, FilePdfOutlined, LoadingOutlined } from "@ant-design/icons";

const MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const LAST_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function autoTitle(month: number, year: number): string {
  const lastDay = LAST_DAYS[month - 1] || 31;
  return `รายการย่อแสดงสินทรัพย์และหนี้สิน ณ วันที่ ${lastDay} ${MONTHS_FULL[month - 1]} ${year}`;
}

interface FinItem {
  id?: number;
  year: number;
  month: number;
  title: string;
  fileUrl: string;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  totalMembers: string;
  isActive: boolean;
}

const currentBE = new Date().getFullYear() + 543;
const empty: FinItem = { year: currentBE, month: 1, title: "", fileUrl: "", totalAssets: "", totalLiabilities: "", totalEquity: "", totalMembers: "", isActive: true };


export default function AdminFinancialSummaryPage() {
  const [items, setItems] = useState<FinItem[]>([]);
  const [editing, setEditing] = useState<FinItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(currentBE);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLoaded = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/financial-summary");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      // Auto-select year with data on first load
      if (!initialLoaded.current && data.length > 0) {
        const dataYears = (Array.from(new Set(data.map((i: FinItem) => i.year))) as number[]).sort((a, b) => b - a);
        if (dataYears.length > 0 && !dataYears.includes(filterYear)) {
          setFilterYear(dataYears[0]);
        }
        initialLoaded.current = true;
      }
    }
  }, [filterYear]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => i.year === filterYear);
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
  if (!years.includes(currentBE)) years.unshift(currentBE);

  /* ── Upload PDF ── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์ PDF หรือรูปภาพ");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "financial-summary");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, fileUrl: data.url });
      } else {
        const err = await res.json().catch(() => ({}));
        alert("อัปโหลดไม่สำเร็จ: " + (err.error || res.statusText));
      }
    } catch (err) {
      alert("อัปโหลดไม่สำเร็จ: " + String(err));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    if (!editing) return;
    const method = isNew ? "POST" : "PATCH";
    const generatedTitle = editing.title || autoTitle(editing.month, editing.year);
    const payload: Record<string, unknown> = {
      year: editing.year,
      month: editing.month,
      title: generatedTitle,
      fileUrl: editing.fileUrl || null,
      totalAssets: editing.totalAssets ? parseFloat(editing.totalAssets.replace(/,/g, "")) : null,
      totalLiabilities: editing.totalLiabilities ? parseFloat(editing.totalLiabilities.replace(/,/g, "")) : null,
      totalEquity: editing.totalEquity ? parseFloat(editing.totalEquity.replace(/,/g, "")) : null,
      totalMembers: editing.totalMembers ? parseInt(editing.totalMembers.replace(/,/g, "")) : null,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/financial-summary", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/admin/financial-summary?id=${id}`, { method: "DELETE" });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>รายการย่อแสดงสินทรัพย์และหนี้สิน</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>เลือกเดือน → อัปโหลด PDF → บันทึก</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontWeight: 600 }}>
            {years.map((y) => <option key={y} value={y}>ปี พ.ศ. {y}</option>)}
          </select>
          <button onClick={() => { setEditing({ ...empty, year: filterYear }); setIsNew(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            <PlusOutlined /> เพิ่มเดือน
          </button>
        </div>
      </div>

      {/* ── Edit / Create Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{isNew ? "เพิ่มรายการใหม่" : "แก้ไขรายการ"}</h3>

          {/* Row 1: Year + Month */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 400 }}>
            <label style={labelStyle}>ปี พ.ศ.
              <input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: parseInt(e.target.value) || currentBE })} style={inputStyle} />
            </label>
            <label style={labelStyle}>เดือน
              <select value={editing.month} onChange={(e) => setEditing({ ...editing, month: parseInt(e.target.value) })} style={inputStyle}>
                {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </label>
          </div>

          {/* Auto-generated title preview */}
          <p style={{ fontSize: 11, color: "#6b7280", margin: "8px 0 0", background: "#f9fafb", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
            ชื่อรายการ: <strong style={{ color: "#374151" }}>{autoTitle(editing.month, editing.year)}</strong>
          </p>

          {/* Row 2: PDF Upload */}
          <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
                  <FilePdfOutlined style={{ color: "#dc2626", marginRight: 6 }} />
                  ไฟล์ PDF รายงาน
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
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>เดือน</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ชื่อรายการ</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ไฟล์ PDF</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => a.month - b.month).map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>{MONTHS_SHORT[item.month - 1]} {item.year}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "#374151" }}>{item.title || autoTitle(item.month, item.year)}</td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  {item.fileUrl ? (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#eff6ff", borderRadius: 6, color: "#0369a1", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      <FilePdfOutlined /> ดู PDF
                    </a>
                  ) : <span style={{ color: "#d1d5db", fontSize: 12 }}><FileOutlined /> ยังไม่มี</span>}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => { setEditing({ ...item, totalAssets: item.totalAssets?.toString() || "", totalLiabilities: item.totalLiabilities?.toString() || "", totalEquity: item.totalEquity?.toString() || "", totalMembers: item.totalMembers?.toString() || "" }); setIsNew(false); }} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }} title="แก้ไข"><EditOutlined /></button>
                  <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }} title="ลบ"><DeleteOutlined /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูลปี พ.ศ. {filterYear}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
