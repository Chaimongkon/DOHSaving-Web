"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SaveOutlined, CheckCircleOutlined } from "@ant-design/icons";

interface InfoField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

const fields: InfoField[] = [
  { key: "address", label: "ที่อยู่", placeholder: "2/486 อาคาร 26\nถนนศรีอยุธยา ...", multiline: true },
  { key: "hours", label: "เวลาทำการ", placeholder: "วันจันทร์ – ศุกร์\n08.30 – 16.30 น.", multiline: true },
  { key: "hoursNote", label: "หมายเหตุเวลา", placeholder: "(ภายใน ปิดทำการเวลา 15.30 น.)" },
  { key: "phone", label: "โทรศัพท์หลัก", placeholder: "02-245-0668" },
  { key: "phoneSub1", label: "โทรศัพท์รอง 1", placeholder: "02-644-7940-43" },
  { key: "phoneSub2", label: "โทรศัพท์รอง 2", placeholder: "02-644-9243, 02-644-4833" },
  { key: "mainPhone", label: "สายตรงกรมทางหลวง", placeholder: "02-245-0668" },
  { key: "fax1", label: "FAX 1", placeholder: "02-354-6717" },
  { key: "fax1Note", label: "FAX 1 หมายเหตุ", placeholder: "ฝ่ายทะเบียนหุ้นฯ, ฝ่ายสินเชื่อ, ..." },
  { key: "fax2", label: "FAX 2", placeholder: "02-644-4825" },
  { key: "fax2Note", label: "FAX 2 หมายเหตุ", placeholder: "ฝ่ายการเงินฯ, ฝ่ายสมาชิกฯ, ..." },
  { key: "email", label: "อีเมล", placeholder: "dohcoop@hotmail.com" },
  { key: "lineOfficial", label: "LINE Official ID", placeholder: "@dohcoop" },
];

export default function AdminContactInfoPage() {
  const [data, setData] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contact");
      if (res.ok) {
        const json = await res.json();
        if (json.info && Array.isArray(json.info)) {
          const map: Record<string, string> = {};
          for (const item of json.info) map[item.key] = item.value;
          setData(map);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveField = async (key: string) => {
    const res = await fetch("/api/admin/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: data[key] || "" }),
    });
    if (res.ok) {
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    } else {
      alert("บันทึกไม่สำเร็จ");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>ข้อมูลติดต่อสหกรณ์</h1>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
        แก้ไขข้อมูลที่อยู่ เบอร์โทร อีเมล และ LINE ที่แสดงในหน้าติดต่อสหกรณ์
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {fields.map((field) => (
          <div key={field.key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
              {field.label}
              <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>({field.key})</span>
            </label>
            {field.multiline ? (
              <textarea
                value={data[field.key] || ""}
                onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={3}
                style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
              />
            ) : (
              <input
                value={data[field.key] || ""}
                onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{ display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}
              />
            )}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => saveField(field.key)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                <SaveOutlined /> บันทึก
              </button>
              {saved[field.key] && (
                <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircleOutlined /> บันทึกแล้ว
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
