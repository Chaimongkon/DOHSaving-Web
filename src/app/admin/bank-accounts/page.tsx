"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";

interface Bank {
  id?: number;
  bankName: string;
  bankNameSub: string;
  accountNumber: string;
  accountType: string;
  brandColor: string;
  abbr: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: Bank = { bankName: "", bankNameSub: "จำกัด (มหาชน)", accountNumber: "", accountType: "ออมทรัพย์", brandColor: "#1a2d4a", abbr: "", sortOrder: 0, isActive: true };

export default function AdminBankAccountsPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bank-accounts");
    if (res.ok) setBanks(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch("/api/admin/bank-accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else alert("บันทึกไม่สำเร็จ");
  };

  const remove = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/admin/bank-accounts?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>จัดการบัญชีธนาคาร</h1>
        <button
          onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#E8652B", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
        >
          <PlusOutlined /> เพิ่มธนาคาร
        </button>
      </div>

      {/* Edit / Create Form */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{isNew ? "เพิ่มธนาคารใหม่" : "แก้ไขธนาคาร"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ชื่อธนาคาร
              <input value={editing.bankName} onChange={(e) => setEditing({ ...editing, bankName: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>คำอธิบายย่อย
              <input value={editing.bankNameSub} onChange={(e) => setEditing({ ...editing, bankNameSub: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>เลขที่บัญชี
              <input value={editing.accountNumber} onChange={(e) => setEditing({ ...editing, accountNumber: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13, fontWeight: 700, letterSpacing: 1 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ประเภทบัญชี
              <input value={editing.accountType} onChange={(e) => setEditing({ ...editing, accountType: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ตัวย่อ
              <input value={editing.abbr} onChange={(e) => setEditing({ ...editing, abbr: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>สีแบรนด์
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input type="color" value={editing.brandColor} onChange={(e) => setEditing({ ...editing, brandColor: e.target.value })} style={{ width: 40, height: 36, border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }} />
                <input value={editing.brandColor} onChange={(e) => setEditing({ ...editing, brandColor: e.target.value })} style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
              </div>
            </label>
            <label style={{ fontSize: 12, color: "#6b7280" }}>ลำดับ
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <SaveOutlined /> บันทึก
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              <CloseOutlined /> ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ลำดับ</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>ธนาคาร</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>เลขบัญชี</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>สี</th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>{b.sortOrder}</td>
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>{b.bankName}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.abbr}</div>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 700, letterSpacing: 1, color: "#1f2937" }}>{b.accountNumber}</td>
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: b.brandColor }} />
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => { setEditing({ ...b }); setIsNew(false); }} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 15, marginRight: 8 }}><EditOutlined /></button>
                  <button onClick={() => b.id && remove(b.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 15 }}><DeleteOutlined /></button>
                </td>
              </tr>
            ))}
            {banks.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
