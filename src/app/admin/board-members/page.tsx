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

interface BoardMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const TIERS = [
  { value: 0, label: "ทั้งหมด" },
  { value: 1, label: "ประธาน" },
  { value: 2, label: "รองประธาน" },
  { value: 3, label: "เหรัญญิก / เลขานุการ" },
  { value: 4, label: "กรรมการ" },
];

const TIER_OPTIONS = TIERS.filter((t) => t.value > 0);

function generateId() {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function BoardMembersEditor() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTier, setActiveTier] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/board-members")
      .then((res) => res.json())
      .then((data) => setMembers(data.members || []))
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    const tier = activeTier === 0 ? 1 : activeTier;
    const sameTier = members.filter((m) => m.tier === tier);
    const newMember: BoardMember = {
      id: generateId(),
      name: "",
      position: "",
      imageUrl: "",
      tier,
      order: sameTier.length + 1,
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const updateMember = (id: string, field: keyof BoardMember, value: string | number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMember = (id: string) => {
    if (!confirm("ต้องการลบกรรมการท่านนี้?")) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, imageUrl: url } : m))
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
      const res = await fetch("/api/admin/board-members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
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
  }, [members]);

  const filtered = activeTier === 0
    ? members
    : members.filter((m) => m.tier === activeTier);

  const sorted = [...filtered].sort((a, b) => a.tier - b.tier || a.order - b.order);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>จัดการคณะกรรมการดำเนินการ</h1>
          <p>เพิ่ม แก้ไข ลบ อัปโหลดรูปกรรมการแต่ละท่าน</p>
        </div>
        <div className={css.actions}>
          <button className={css.btnAdd} onClick={handleAdd}>
            <PlusOutlined /> เพิ่มกรรมการ
          </button>
          <button className={css.btnSave} onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {/* Tier filter tabs */}
      <div className={css.tierTabs}>
        {TIERS.map((t) => (
          <button
            key={t.value}
            className={`${css.tierTab} ${activeTier === t.value ? css.tierTabActive : ""}`}
            onClick={() => setActiveTier(t.value)}
          >
            {t.label}
            {t.value === 0
              ? ` (${members.length})`
              : ` (${members.filter((m) => m.tier === t.value).length})`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><TeamOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีกรรมการ — กดปุ่ม &quot;เพิ่มกรรมการ&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.grid}>
          {sorted.map((member) => (
            <div key={member.id} className={css.card}>
              {/* Image */}
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
              {/* Body */}
              <div className={css.cardBody}>
                <input
                  className={css.cardInput}
                  value={member.name}
                  onChange={(e) => updateMember(member.id, "name", e.target.value)}
                  placeholder="ชื่อ-สกุล"
                />
                <input
                  className={css.cardInput}
                  value={member.position}
                  onChange={(e) => updateMember(member.id, "position", e.target.value)}
                  placeholder="ตำแหน่ง"
                />
                <select
                  className={css.cardSelect}
                  value={member.tier}
                  onChange={(e) => updateMember(member.id, "tier", Number(e.target.value))}
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  className={css.cardInput}
                  type="number"
                  value={member.order}
                  onChange={(e) => updateMember(member.id, "order", Number(e.target.value))}
                  placeholder="ลำดับ"
                  min={1}
                />
                <div className={css.cardActions}>
                  <button className={css.btnDel} onClick={() => removeMember(member.id)}>
                    <DeleteOutlined /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 && (
        <p className={css.status}>ทั้งหมด {members.length} ท่าน — กดบันทึกเพื่ออัปเดตหน้าเว็บ</p>
      )}
    </div>
  );
}
