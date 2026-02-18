"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { SaveOutlined, EyeOutlined, FormOutlined } from "@ant-design/icons";
import css from "./page.module.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const PAGE_LABELS: Record<string, string> = {
  history: "ประวัติสหกรณ์",
  vision: "วิสัยทัศน์และพันธกิจ",
  "ethics-board": "จรรยาบรรณคณะกรรมการ",
  "ethics-staff": "จรรยาบรรณเจ้าหน้าที่",
  policy: "นโยบายสหกรณ์",
  board: "คณะกรรมการ",
  organization: "โครงสร้างองค์กร",
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

export default function PageEditorPage() {
  const params = useParams();
  const key = params.key as string;
  const label = PAGE_LABELS[key] || key;

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/pages/${key}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || "");
        if (data.updatedAt) {
          setLastSaved(
            new Date(data.updatedAt).toLocaleString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [key]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, remark: `เนื้อหาหน้า ${label}` }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastSaved(
          new Date(data.updatedAt).toLocaleString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        alert("บันทึกเรียบร้อย");
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch {
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }, [content, key, label]);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div>
          <h1 className={css.title}>จัดการเนื้อหา: {label}</h1>
          <p className={css.subtitle}>แก้ไขเนื้อหาที่แสดงในหน้าเว็บไซต์สาธารณะ</p>
        </div>
        <div className={css.actions}>
          <button
            className={`${css.previewBtn} ${preview ? css.previewBtnActive : ""}`}
            onClick={() => setPreview(!preview)}
          >
            {preview ? <><FormOutlined /> แก้ไข</> : <><EyeOutlined /> ตัวอย่าง</>}
          </button>
          <button
            className={css.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {preview ? (
        <div className={css.previewWrap}>
          <div
            className={css.previewContent}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        <div className={css.editorWrap}>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            style={{ minHeight: 450 }}
          />
        </div>
      )}

      {lastSaved && (
        <p className={css.status}>บันทึกล่าสุด: {lastSaved}</p>
      )}
    </div>
  );
}
