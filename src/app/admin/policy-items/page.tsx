"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface PolicyItem {
  id: string;
  text: string;
}

function generateId() {
  return `pi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function PolicyItemsEditor() {
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/policy-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    setItems((prev) => [...prev, { id: generateId(), text: "" }]);
  };

  const handleTextChange = (index: number, text: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, text } : item)));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setItems(updated);
  };

  const handleRemove = (index: number) => {
    if (!confirm("ต้องการลบข้อนี้?")) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/policy-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
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
  }, [items]);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>จัดการนโยบายสหกรณ์</h1>
          <p>เพิ่ม แก้ไข จัดลำดับ นโยบายทั้งหมดที่แสดงบนหน้าเว็บ</p>
        </div>
        <div className={css.actions}>
          <button className={css.btnAdd} onClick={handleAdd}>
            <PlusOutlined /> เพิ่มนโยบาย
          </button>
          <button className={css.btnSave} onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><UnorderedListOutlined /></div>
          <p className={css.emptyText}>ยังไม่มีนโยบาย — กดปุ่ม &quot;เพิ่มนโยบาย&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className={css.list}>
          {items.map((item, i) => (
            <div key={item.id} className={css.item}>
              <div className={css.itemNumber}>{i + 1}</div>
              <div className={css.itemContent}>
                <textarea
                  className={css.itemTextarea}
                  value={item.text}
                  onChange={(e) => handleTextChange(i, e.target.value)}
                  placeholder="พิมพ์เนื้อหานโยบาย..."
                  rows={2}
                />
              </div>
              <div className={css.itemActions}>
                <button
                  className={css.iconBtn}
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  title="ย้ายขึ้น"
                >
                  <ArrowUpOutlined />
                </button>
                <button
                  className={css.iconBtn}
                  onClick={() => handleMove(i, 1)}
                  disabled={i === items.length - 1}
                  title="ย้ายลง"
                >
                  <ArrowDownOutlined />
                </button>
                <button
                  className={`${css.iconBtn} ${css.iconBtnDanger}`}
                  onClick={() => handleRemove(i)}
                  title="ลบ"
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className={css.status}>ทั้งหมด {items.length} ข้อ — กดบันทึกเพื่ออัปเดตหน้าเว็บ</p>
      )}
    </div>
  );
}
