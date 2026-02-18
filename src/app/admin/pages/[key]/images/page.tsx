"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  UploadOutlined,
  SaveOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

const PAGE_LABELS: Record<string, string> = {
  history: "ประวัติสหกรณ์",
  vision: "วิสัยทัศน์และพันธกิจ",
  "ethics-board": "จรรยาบรรณคณะกรรมการ",
  "ethics-staff": "จรรยาบรรณเจ้าหน้าที่",
  policy: "นโยบายสหกรณ์",
  board: "คณะกรรมการ",
  organization: "โครงสร้างองค์กร",
};

export default function PageImagesEditor() {
  const params = useParams();
  const key = params.key as string;
  const label = PAGE_LABELS[key] || key;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // โหลดรูปจาก API
  useEffect(() => {
    fetch(`/api/admin/pages/${key}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data.images || []))
      .catch((err) => console.error("Failed to load images:", err))
      .finally(() => setLoading(false));
  }, [key]);

  // Upload
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "pages");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push(data.url);
        } else {
          const err = await res.json();
          alert(`อัพโหลดไม่สำเร็จ: ${err.error || "unknown error"}`);
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch {
      alert("อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  // บันทึกลำดับรูปลง DB
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${key}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
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
  }, [images, key]);

  // ย้ายลำดับ
  const moveImage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setImages(updated);
  };

  // ลบรูป
  const removeImage = (index: number) => {
    if (!confirm("ต้องการลบรูปนี้?")) return;
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop zone
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <div>
          <h1 className={css.title}>จัดการรูป Infographic: {label}</h1>
          <p className={css.subtitle}>อัพโหลดและจัดลำดับรูป Infographic ที่แสดงในหน้าเว็บ</p>
        </div>
        <div className={css.actions}>
          <button
            className={css.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadOutlined /> {uploading ? "กำลังอัพโหลด..." : "อัพโหลดรูป"}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className={css.hiddenInput}
        onChange={(e) => handleUpload(e.target.files)}
      />

      {images.length === 0 ? (
        <div
          className={css.dropZone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={css.dropIcon}><PictureOutlined /></div>
          <p className={css.dropText}>ลากไฟล์รูปมาวางที่นี่ หรือ คลิกเพื่ออัพโหลด</p>
          <p className={css.dropHint}>รองรับ JPG, PNG, WebP, SVG (ไม่เกิน 10MB)</p>
        </div>
      ) : (
        <div className={css.grid}>
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className={css.card}>
              <img src={url} alt={`Infographic ${i + 1}`} className={css.cardImage} />
              <div className={css.cardActions}>
                <span className={css.cardOrder}>ลำดับ {i + 1}</span>
                <div className={css.cardBtns}>
                  <button
                    className={css.iconBtn}
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    title="ย้ายขึ้น"
                  >
                    <ArrowUpOutlined />
                  </button>
                  <button
                    className={css.iconBtn}
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    title="ย้ายลง"
                  >
                    <ArrowDownOutlined />
                  </button>
                  <button
                    className={`${css.iconBtn} ${css.iconBtnDanger}`}
                    onClick={() => removeImage(i)}
                    title="ลบ"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className={css.status}>ทั้งหมด {images.length} รูป — กดบันทึกเพื่ออัปเดต</p>
      )}
    </div>
  );
}
