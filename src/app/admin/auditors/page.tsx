"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  UploadOutlined,
  UserOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface Auditor {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  order: number;
}

function generateId() {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function AuditorsEditor() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/auditors")
      .then((res) => res.json())
      .then((data) => setAuditors(data.auditors || []))
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    const newAuditor: Auditor = {
      id: generateId(),
      name: "",
      position: "",
      imageUrl: "",
      order: auditors.length + 1,
    };
    setAuditors((prev) => [...prev, newAuditor]);
  };

  const updateAuditor = (id: string, field: keyof Auditor, value: string | number) => {
    setAuditors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const removeAuditor = (id: string) => {
    if (!confirm("ต้องการลบท่านนี้?")) return;
    setAuditors((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpload = useCallback(async (auditorId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setAuditors((prev) =>
          prev.map((a) => (a.id === auditorId ? { ...a, imageUrl: url } : a))
        );
      } else {
        alert("อัปโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดไม่สำเร็จ");
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auditors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditors }),
      });
      if (res.ok) {
        alert("บันทึกเรียบร้อย");
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch {
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }, [auditors]);

  const sorted = [...auditors].sort((a, b) => a.order - b.order);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ</h1>
          <p>เพิ่ม แก้ไข ลบ อัปโหลดรูปผู้ตรวจสอบ</p>
        </div>
        <div className={css.actions}>
          <button className={css.btnAdd} onClick={handleAdd}>
            <PlusOutlined /> เพิ่มรายชื่อ
          </button>
          <button className={css.btnSave} onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><AuditOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีรายชื่อ — กดปุ่ม &quot;เพิ่มรายชื่อ&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.grid}>
          {sorted.map((auditor) => (
            <div key={auditor.id} className={css.card}>
              {/* Image */}
              <div
                className={css.cardImage}
                onClick={() => fileInputRefs.current[auditor.id]?.click()}
              >
                {auditor.imageUrl ? (
                  <>
                    <img src={auditor.imageUrl} alt={auditor.name} />
                    <div className={css.cardImageOverlay}>
                      <UploadOutlined />
                    </div>
                  </>
                ) : (
                  <div className={css.cardImagePlaceholder}>
                    <UserOutlined />
                  </div>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[auditor.id] = el; }}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(auditor.id, file);
                    e.target.value = "";
                  }}
                />
              </div>
              {/* Body */}
              <div className={css.cardBody}>
                <input
                  className={css.cardInput}
                  value={auditor.name}
                  onChange={(e) => updateAuditor(auditor.id, "name", e.target.value)}
                  placeholder="ชื่อ-สกุล"
                />
                <input
                  className={css.cardInput}
                  value={auditor.position}
                  onChange={(e) => updateAuditor(auditor.id, "position", e.target.value)}
                  placeholder="ตำแหน่ง เช่น ผู้สอบบัญชี, ผู้ตรวจสอบกิจการ"
                />
                <input
                  className={css.cardInput}
                  type="number"
                  value={auditor.order}
                  onChange={(e) => updateAuditor(auditor.id, "order", Number(e.target.value))}
                  placeholder="ลำดับ"
                  min={1}
                />
                <div className={css.cardActions}>
                  <button className={css.btnDel} onClick={() => removeAuditor(auditor.id)}>
                    <DeleteOutlined /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {auditors.length > 0 && (
        <p className={css.status}>ทั้งหมด {auditors.length} ท่าน</p>
      )}
    </div>
  );
}
