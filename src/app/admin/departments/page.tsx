"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";

interface Dept {
  id?: number;
  name: string;
  dohCodes: string;
  coopExt: string;
  mobile: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: Dept = { name: "", dohCodes: "", coopExt: "", mobile: "", sortOrder: 0, isActive: true };

export default function AdminDepartmentsPage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/departments");
    if (res.ok) setDepts(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch("/api/admin/departments", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else alert("บันทึกไม่สำเร็จ");
  };

  const remove = async (id: number) => {
    if (!confirm("ลบฝ่ายงานนี้?")) return;
    await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>จัดการฝ่ายงาน / เบอร์โทร</h1>
        <button onClick={() => { setEditing({ ...empty }); setIsNew(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          <PlusOutlined /> เพิ่มฝ่ายงาน
        </button>
      </div>

      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{isNew ? "เพิ่มฝ่ายงานใหม่" : "แก้ไขฝ่ายงาน"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ชื่อฝ่ายงาน
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>สายตรงกรมทางหลวง
              <input value={editing.dohCodes} onChange={(e) => setEditing({ ...editing, dohCodes: e.target.value })} placeholder="27008, 27009, ..." style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>สายภายในสหกรณ์
              <input value={editing.coopExt} onChange={(e) => setEditing({ ...editing, coopExt: e.target.value })} placeholder="105, 107, ..." style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>เบอร์มือถือ
              <input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} placeholder="098-888-3274" style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
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
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ฝ่ายงาน</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>สายตรง</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ภายใน</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>มือถือ</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>{i + 1}</td>
                <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, color: "#1f2937" }}>{d.name}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{d.dohCodes}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{d.coopExt}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#0369a1" }}>{d.mobile || "—"}</td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => { setEditing({ ...d }); setIsNew(false); }} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }}><EditOutlined /></button>
                  <button onClick={() => d.id && remove(d.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }}><DeleteOutlined /></button>
                </td>
              </tr>
            ))}
            {depts.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
