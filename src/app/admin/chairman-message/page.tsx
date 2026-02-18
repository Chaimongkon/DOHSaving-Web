"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SaveOutlined,
  UserOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface ChairmanData {
  portraitUrl: string;
  messageUrl: string;
  name: string;
  title: string;
}

export default function ChairmanMessageEditor() {
  const [data, setData] = useState<ChairmanData>({
    portraitUrl: "",
    messageUrl: "",
    name: "",
    title: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/chairman-message")
      .then((res) => res.json())
      .then((d) =>
        setData({
          portraitUrl: d.portraitUrl || "",
          messageUrl: d.messageUrl || "",
          name: d.name || "",
          title: d.title || "",
        })
      )
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = useCallback(
    async (field: "portraitUrl" | "messageUrl", file: File) => {
      setUploading(field);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const { url } = await res.json();
          setData((prev) => ({ ...prev, [field]: url }));
        } else {
          alert("อัปโหลดไม่สำเร็จ");
        }
      } catch {
        alert("อัปโหลดไม่สำเร็จ");
      } finally {
        setUploading(null);
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/chairman-message", {
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

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerLeft}>
          <h1>สารจากประธานกรรมการดำเนินการ</h1>
          <p>จัดการรูปภาพและข้อมูลที่แสดงบนหน้าเว็บ</p>
        </div>
        <button className={css.btnSave} onClick={handleSave} disabled={saving}>
          <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      <div className={css.sections}>
        {/* ชื่อ / ตำแหน่ง */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              <UserOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>ข้อมูลประธาน</h2>
              <p className={css.sectionDesc}>ชื่อ-สกุล และตำแหน่ง</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <div className={css.inputRow}>
              <div className={css.inputGroup}>
                <label className={css.inputLabel}>ชื่อ-สกุล</label>
                <input
                  type="text"
                  className={css.inputText}
                  value={data.name}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น นายจิระพงศ์ เทพพิทักษ์"
                />
              </div>
              <div className={css.inputGroup}>
                <label className={css.inputLabel}>ตำแหน่ง</label>
                <input
                  type="text"
                  className={css.inputText}
                  value={data.title}
                  onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="เช่น ประธานกรรมการดำเนินการ"
                />
              </div>
            </div>
          </div>
        </div>

        {/* รูปภาพประธาน */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <UserOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>รูปภาพประธาน</h2>
              <p className={css.sectionDesc}>รูปโปรไฟล์ประธานกรรมการ</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <div className={css.imageUpload}>
              <div className={css.imagePreview}>
                {data.portraitUrl ? (
                  <img src={data.portraitUrl} alt="Portrait" />
                ) : (
                  <div className={css.imagePlaceholder}>
                    <span><PictureOutlined /></span>
                    <p>ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
              <div className={css.imageActions}>
                <input
                  ref={portraitInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload("portraitUrl", file);
                    e.target.value = "";
                  }}
                />
                <button
                  className={css.btnUpload}
                  onClick={() => portraitInputRef.current?.click()}
                  disabled={uploading === "portraitUrl"}
                >
                  <UploadOutlined /> {uploading === "portraitUrl" ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                </button>
                {data.portraitUrl && (
                  <button className={css.btnDelete} onClick={() => setData((prev) => ({ ...prev, portraitUrl: "" }))}>
                    <DeleteOutlined /> ลบ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* รูปหนังสือสาร */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <div className={css.sectionIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
              <FileTextOutlined />
            </div>
            <div>
              <h2 className={css.sectionTitle}>หนังสือสาร</h2>
              <p className={css.sectionDesc}>รูปหนังสือสารจากประธาน</p>
            </div>
          </div>
          <div className={css.sectionBody}>
            <div className={css.imageUpload}>
              <div className={`${css.imagePreview} ${css.imagePreviewFull}`}>
                {data.messageUrl ? (
                  <img src={data.messageUrl} alt="Message" />
                ) : (
                  <div className={css.imagePlaceholder}>
                    <span><PictureOutlined /></span>
                    <p>ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
              <div className={css.imageActions}>
                <input
                  ref={messageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload("messageUrl", file);
                    e.target.value = "";
                  }}
                />
                <button
                  className={css.btnUpload}
                  onClick={() => messageInputRef.current?.click()}
                  disabled={uploading === "messageUrl"}
                >
                  <UploadOutlined /> {uploading === "messageUrl" ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                </button>
                {data.messageUrl && (
                  <button className={css.btnDelete} onClick={() => setData((prev) => ({ ...prev, messageUrl: "" }))}>
                    <DeleteOutlined /> ลบ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
