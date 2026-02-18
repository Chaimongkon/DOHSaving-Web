"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  UploadOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface StaffMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const TIERS = [
  { value: 1, label: "ผู้จัดการ / หัวหน้า" },
  { value: 2, label: "อาวุโส" },
  { value: 3, label: "เจ้าหน้าที่" },
];

const DEPARTMENTS = [
  { key: "managers", label: "ผู้จัดการใหญ่และรองผู้จัดการฯ" },
  { key: "dept-credit", label: "ฝ่ายสินเชื่อ" },
  { key: "dept-finance", label: "ฝ่ายการเงินและการลงทุน" },
  { key: "dept-welfare", label: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ" },
  { key: "dept-shares", label: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน" },
  { key: "dept-general", label: "ฝ่ายบริหารทั่วไป" },
  { key: "dept-accounting", label: "ฝ่ายบัญชี" },
  { key: "dept-it", label: "ฝ่ายสารสนเทศ" },
];

function generateId() {
  return `stf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function DepartmentStaffEditor() {
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0].key);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadDept = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/department-staff?dept=${dept}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDept(activeDept);
  }, [activeDept, loadDept]);

  const handleAdd = () => {
    const newMember: StaffMember = {
      id: generateId(),
      name: "",
      position: "",
      imageUrl: "",
      tier: 3,
      order: staff.length + 1,
    };
    setStaff((prev) => [...prev, newMember]);
  };

  const updateStaff = (id: string, field: keyof StaffMember, value: string | number) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeStaff = (id: string) => {
    if (!confirm("ต้องการลบท่านนี้?")) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpload = useCallback(async (memberId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setStaff((prev) =>
          prev.map((s) => (s.id === memberId ? { ...s, imageUrl: url } : s))
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
      const res = await fetch(`/api/admin/department-staff?dept=${activeDept}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff }),
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
  }, [staff, activeDept]);

  const sorted = [...staff].sort((a, b) => a.tier - b.tier || a.order - b.order);
  const currentLabel = DEPARTMENTS.find((d) => d.key === activeDept)?.label ?? "";

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>บุคลากร — {currentLabel}</h1>
          <p>เพิ่ม แก้ไข ลบ อัปโหลดรูปบุคลากรแต่ละแผนก</p>
        </div>
        <div className={css.actions}>
          <button className={css.btnAdd} onClick={handleAdd}>
            <PlusOutlined /> เพิ่มบุคลากร
          </button>
          <button className={css.btnSave} onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {/* Department tabs */}
      <div className={css.deptTabs}>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.key}
            className={`${css.deptTab} ${activeDept === d.key ? css.deptTabActive : ""}`}
            onClick={() => setActiveDept(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={css.loading}>กำลังโหลด...</div>
      ) : sorted.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><TeamOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีบุคลากรในแผนกนี้ — กดปุ่ม &quot;เพิ่มบุคลากร&quot;</p>
        </div>
      ) : (
        <div className={css.grid}>
          {sorted.map((member) => (
            <div key={member.id} className={css.card}>
              <div
                className={css.cardImage}
                onClick={() => fileInputRefs.current[member.id]?.click()}
              >
                {member.imageUrl ? (
                  <>
                    <img src={member.imageUrl} alt={member.name} />
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
                  ref={(el) => { fileInputRefs.current[member.id] = el; }}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(member.id, file);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className={css.cardBody}>
                <input
                  className={css.cardInput}
                  value={member.name}
                  onChange={(e) => updateStaff(member.id, "name", e.target.value)}
                  placeholder="ชื่อ-สกุล"
                />
                <input
                  className={css.cardInput}
                  value={member.position}
                  onChange={(e) => updateStaff(member.id, "position", e.target.value)}
                  placeholder="ตำแหน่ง"
                />
                <select
                  className={css.cardSelect}
                  value={member.tier}
                  onChange={(e) => updateStaff(member.id, "tier", Number(e.target.value))}
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  className={css.cardInput}
                  type="number"
                  value={member.order}
                  onChange={(e) => updateStaff(member.id, "order", Number(e.target.value))}
                  placeholder="ลำดับ"
                  min={1}
                />
                <div className={css.cardActions}>
                  <button className={css.btnDel} onClick={() => removeStaff(member.id)}>
                    <DeleteOutlined /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {staff.length > 0 && (
        <p className={css.status}>ทั้งหมด {staff.length} ท่าน</p>
      )}
    </div>
  );
}
