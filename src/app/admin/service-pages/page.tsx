"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined,
  UploadOutlined, PictureOutlined, LoadingOutlined, LinkOutlined,
  FileOutlined, FilterOutlined,
} from "@ant-design/icons";

const CATEGORIES = [
  "สมัครสมาชิก",
  "สวัสดิการ",
  "เงินฝาก",
  "เงินกู้",
  "บริการอื่นๆ",
  "บริการอิเล็กทรอนิกส์",
];

interface DownloadLink {
  label: string;
  url: string;
}

interface ServicePageItem {
  id?: number;
  slug: string;
  title: string;
  category: string;
  infographicUrl: string;
  downloadLinks: string; // JSON string
  sortOrder: number;
  isActive: boolean;
}

const empty: ServicePageItem = {
  slug: "",
  title: "",
  category: CATEGORIES[0],
  infographicUrl: "",
  downloadLinks: "[]",
  sortOrder: 0,
  isActive: true,
};

export default function AdminServicePagesPage() {
  const [items, setItems] = useState<ServicePageItem[]>([]);
  const [editing, setEditing] = useState<ServicePageItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCat, setFilterCat] = useState("ทั้งหมด");
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/service-pages", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    if (filterCat !== "ทั้งหมด" && i.category !== filterCat) return false;
    return true;
  });

  const openEdit = (item: ServicePageItem) => {
    setEditing({ ...item });
    setIsNew(false);
    try {
      setLinks(JSON.parse(item.downloadLinks || "[]"));
    } catch {
      setLinks([]);
    }
  };

  const openNew = () => {
    setEditing({ ...empty });
    setIsNew(true);
    setLinks([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์รูปภาพ"); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB"); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "service-pages");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, infographicUrl: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));
  const updateLink = (idx: number, field: "label" | "url", value: string) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [field]: value };
    setLinks(updated);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.slug.trim()) return alert("กรุณาระบุ slug");
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อหน้า");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      category: editing.category,
      infographicUrl: editing.infographicUrl || null,
      downloadLinks: JSON.stringify(links.filter((l) => l.label.trim() && l.url.trim())),
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/service-pages", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.ok) {
      setEditing(null);
      setIsNew(false);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบหน้าบริการนี้?")) return;
    await fetch(`/api/admin/service-pages?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", display: "block" };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>หน้าบริการ (Infographic)</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการหน้าบริการ แต่ละหน้าแสดง infographic + ลิงก์ดาวน์โหลด</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่มหน้าบริการ
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <FilterOutlined style={{ color: "#9ca3af" }} />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 600 }}>
          <option>ทั้งหมด</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>({filtered.length} รายการ)</span>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{isNew ? "เพิ่มหน้าบริการใหม่" : "แก้ไขหน้าบริการ"}</h3>

          {/* Row 1: slug, title, category */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 160px 80px", gap: 12 }}>
            <div>
              <label style={labelStyle}>Slug (URL path) *</label>
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="เช่น savings" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ชื่อหน้า *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="เช่น เงินฝากออมทรัพย์" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>หมวดหมู่</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ลำดับ</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 12px" }}>URL จะเป็น: /services/<strong>{editing.slug || "xxx"}</strong></p>

          {/* Infographic Upload */}
          <div style={{ marginTop: 8, padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
                  <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} />
                  รูป Infographic
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 8px" }}>
                  อัปโหลดรูป infographic สำหรับหน้านี้ (รองรับ JPG, PNG, WebP ขนาดไม่เกิน 10MB)
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: uploading ? "#d1d5db" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  {uploading ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกรูป Infographic</>}
                </button>
              </div>
              {editing.infographicUrl && (
                <div style={{ position: "relative" }}>
                  <img
                    src={editing.infographicUrl}
                    alt="preview"
                    style={{ maxHeight: 200, maxWidth: 300, borderRadius: 8, border: "1px solid #e5e7eb", objectFit: "contain", background: "#fff" }}
                  />
                  <button
                    onClick={() => setEditing({ ...editing, infographicUrl: "" })}
                    style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Download Links */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>
                <LinkOutlined style={{ color: "#0369a1", marginRight: 6 }} />
                ลิงก์ดาวน์โหลดเอกสาร
              </p>
              <button onClick={addLink} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", background: "#eff6ff", color: "#0369a1", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                <PlusOutlined /> เพิ่มลิงก์
              </button>
            </div>
            {links.length === 0 && (
              <p style={{ fontSize: 12, color: "#9ca3af", padding: "12px 0" }}>ยังไม่มีลิงก์ดาวน์โหลด กดปุ่ม &quot;เพิ่มลิงก์&quot; เพื่อเพิ่ม</p>
            )}
            {links.map((link, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#9ca3af", width: 20, textAlign: "center" }}>{idx + 1}</span>
                <input
                  value={link.label}
                  onChange={(e) => updateLink(idx, "label", e.target.value)}
                  placeholder="ชื่อเอกสาร เช่น แบบฟอร์มเงินฝากออมทรัพย์"
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(idx, "url", e.target.value)}
                  placeholder="URL เช่น /forms หรือ /uploads/xxx.pdf"
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                />
                <button onClick={() => removeLink(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
              </div>
            ))}
          </div>

          {/* Active toggle */}
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

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>หมวดหมู่</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ชื่อหน้า</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Slug</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Infographic</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ลิงก์</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>สถานะ</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              let linkCount = 0;
              try { linkCount = JSON.parse(item.downloadLinks || "[]").length; } catch { /* */ }
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>{item.category}</span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{item.title}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>/services/{item.slug}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    {item.infographicUrl ? (
                      <img src={item.infographicUrl} alt="" style={{ height: 40, borderRadius: 4, border: "1px solid #e5e7eb" }} />
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: 12 }}><FileOutlined /> -</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>{linkCount} ลิงก์</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: item.isActive ? "#d1fae5" : "#fee2e2", color: item.isActive ? "#065f46" : "#991b1b" }}>
                      {item.isActive ? "เผยแพร่" : "ซ่อน"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }} title="แก้ไข"><EditOutlined /></button>
                    <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }} title="ลบ"><DeleteOutlined /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีหน้าบริการ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
