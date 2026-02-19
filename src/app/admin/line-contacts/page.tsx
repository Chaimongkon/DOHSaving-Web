"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";

interface LineItem {
  id?: number;
  name: string;
  lineUrl: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: LineItem = { name: "", lineUrl: "", sortOrder: 0, isActive: true };

export default function AdminLineContactsPage() {
  const [items, setItems] = useState<LineItem[]>([]);
  const [editing, setEditing] = useState<LineItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/line-contacts");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch("/api/admin/line-contacts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else alert("บันทึกไม่สำเร็จ");
  };

  const remove = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/admin/line-contacts?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>จัดการ LINE ฝ่ายต่างๆ</h1>
        <button onClick={() => { setEditing({ ...empty }); setIsNew(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่ม LINE
        </button>
      </div>

      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{isNew ? "เพิ่ม LINE ใหม่" : "แก้ไข LINE"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ชื่อ LINE
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="LINE ฝ่ายสินเชื่อ 1" style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>LINE URL
              <input value={editing.lineUrl} onChange={(e) => setEditing({ ...editing, lineUrl: e.target.value })} placeholder="https://line.me/ti/p/..." style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ลำดับ
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}><SaveOutlined /> บันทึก</button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><CloseOutlined /> ยกเลิก</button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>#</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ชื่อ LINE</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>URL</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>{i + 1}</td>
                <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, color: "#166534" }}>{item.name}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "#0369a1" }}>
                  <a href={item.lineUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0369a1", textDecoration: "none" }}>{item.lineUrl}</a>
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => { setEditing({ ...item }); setIsNew(false); }} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }}><EditOutlined /></button>
                  <button onClick={() => item.id && remove(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }}><DeleteOutlined /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
