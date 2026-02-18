"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SaveOutlined,
  HeartOutlined,
  EyeOutlined,
  CompassOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface MissionItem {
  id: string;
  text: string;
}

interface VisionData {
  coreValues: string;
  vision: string;
  missions: MissionItem[];
}

function generateId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function VisionDataEditor() {
  const [data, setData] = useState<VisionData>({
    coreValues: "",
    vision: "",
    missions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/vision-data")
      .then((res) => res.json())
      .then((d) =>
        setData({
          coreValues: d.coreValues || "",
          vision: d.vision || "",
          missions: d.missions || [],
        })
      )
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vision-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
  }, [data]);

  const addMission = () => {
    setData((prev) => ({
      ...prev,
      missions: [...prev.missions, { id: generateId(), text: "" }],
    }));
  };

  const updateMission = (index: number, text: string) => {
    setData((prev) => ({
      ...prev,
      missions: prev.missions.map((m, i) => (i === index ? { ...m, text } : m)),
    }));
  };

  const moveMission = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= data.missions.length) return;
    setData((prev) => {
      const updated = [...prev.missions];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return { ...prev, missions: updated };
    });
  };

  const removeMission = (index: number) => {
    if (!confirm("ต้องการลบข้อนี้?")) return;
    setData((prev) => ({
      ...prev,
      missions: prev.missions.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>จัดการค่านิยม วิสัยทัศน์ พันธกิจ</h1>
          <p>แก้ไขเนื้อหาที่แสดงบนหน้าเว็บ &quot;วิสัยทัศน์และพันธกิจ&quot;</p>
        </div>
        <button className={css.btnSave} onClick={handleSave} disabled={saving}>
          <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      <div className={css.sections}>
        {/* ค่านิยม */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}>
              <HeartOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>ค่านิยม</h2>
              <p className={css.sectionDesc}>ค่านิยมหลักของสหกรณ์ (แยกบรรทัดละข้อ)</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <textarea
              className={css.textarea}
              value={data.coreValues}
              onChange={(e) => setData((prev) => ({ ...prev, coreValues: e.target.value }))}
              placeholder="มุ่งมั่นพัฒนา&#10;ยึดหลักธรรมาภิบาล&#10;บริการด้วยใจ"
              rows={4}
            />
          </div>
        </div>

        {/* วิสัยทัศน์ */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
              <EyeOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>วิสัยทัศน์</h2>
              <p className={css.sectionDesc}>วิสัยทัศน์ของสหกรณ์</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <textarea
              className={css.textarea}
              value={data.vision}
              onChange={(e) => setData((prev) => ({ ...prev, vision: e.target.value }))}
              placeholder="เป็นสหกรณ์ที่มั่นคง ดำรงหลักธรรมาภิบาล..."
              rows={3}
            />
          </div>
        </div>

        {/* พันธกิจ */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              <CompassOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>พันธกิจ</h2>
              <p className={css.sectionDesc}>พันธกิจของสหกรณ์ (เพิ่ม แก้ไข จัดลำดับได้)</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <div className={css.missionList}>
              {data.missions.map((m, i) => (
                <div key={m.id} className={css.missionItem}>
                  <div className={css.missionNumber}>{i + 1}</div>
                  <div className={css.missionInput}>
                    <textarea
                      className={css.textarea}
                      value={m.text}
                      onChange={(e) => updateMission(i, e.target.value)}
                      placeholder="พิมพ์เนื้อหาพันธกิจ..."
                      rows={2}
                    />
                  </div>
                  <div className={css.missionActions}>
                    <button className={css.iconBtn} onClick={() => moveMission(i, -1)} disabled={i === 0} title="ย้ายขึ้น">
                      <ArrowUpOutlined />
                    </button>
                    <button className={css.iconBtn} onClick={() => moveMission(i, 1)} disabled={i === data.missions.length - 1} title="ย้ายลง">
                      <ArrowDownOutlined />
                    </button>
                    <button className={`${css.iconBtn} ${css.iconBtnDanger}`} onClick={() => removeMission(i)} title="ลบ">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className={css.btnAdd} onClick={addMission}>
              <PlusOutlined /> เพิ่มพันธกิจ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
