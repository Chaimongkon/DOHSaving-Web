"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface PageConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const PAGES: PageConfig[] = [];

export default function InfographicManager() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // โหลดรูปทั้งหมด
  useEffect(() => {
    Promise.all(
      PAGES.map((p) =>
        fetch(`/api/admin/pages/${p.key}/images`)
          .then((res) => res.json())
          .then((data) => ({ key: p.key, image: data.image || "" }))
          .catch(() => ({ key: p.key, image: "" }))
      )
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach((r) => { if (r.image) map[r.key] = r.image; });
      setImages(map);
      setLoading(false);
    });
  }, []);

  // Upload รูป
  const handleUpload = useCallback(async (pageKey: string, file: File) => {
    setUploading(pageKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pages");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(`อัพโหลดไม่สำเร็จ: ${err.error}`);
        return;
      }
      const { url } = await uploadRes.json();

      // บันทึก URL ลง DB
      const saveRes = await fetch(`/api/admin/pages/${pageKey}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });

      if (saveRes.ok) {
        setImages((prev) => ({ ...prev, [pageKey]: url }));
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch {
      alert("อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(null);
    }
  }, []);

  // ลบรูป
  const handleDelete = useCallback(async (pageKey: string) => {
    if (!confirm("ต้องการลบรูปนี้?")) return;

    try {
      const res = await fetch(`/api/admin/pages/${pageKey}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "" }),
      });

      if (res.ok) {
        setImages((prev) => {
          const updated = { ...prev };
          delete updated[pageKey];
          return updated;
        });
      }
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  }, []);

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <h1 className={css.title}>จัดการรูป Infographic</h1>
        <p className={css.subtitle}>อัพโหลดรูป Infographic สำหรับหน้าเกี่ยวกับสหกรณ์ฯ (หน้าละ 1 รูป)</p>
      </div>

      <div className={css.grid}>
        {PAGES.map((page) => {
          const imgUrl = images[page.key];
          const isUploading = uploading === page.key;

          return (
            <div key={page.key} className={css.card}>
              <div className={css.cardHeader}>
                <span className={css.cardIcon}>{page.icon}</span>
                <h3 className={css.cardLabel}>{page.label}</h3>
              </div>

              <div className={css.cardBody}>
                {imgUrl ? (
                  <div className={css.preview}>
                    <img src={imgUrl} alt={page.label} className={css.previewImg} />
                  </div>
                ) : (
                  <div
                    className={css.placeholder}
                    onClick={() => fileInputRefs.current[page.key]?.click()}
                  >
                    <div className={css.placeholderIcon}><PictureOutlined /></div>
                    <p className={css.placeholderText}>คลิกเพื่ออัพโหลดรูป</p>
                  </div>
                )}
              </div>

              <div className={css.cardFooter}>
                <Link href={page.href} target="_blank" className={css.btnView}>
                  <EyeOutlined /> ดูหน้าเว็บ
                </Link>
                {imgUrl && (
                  <button className={css.btnDelete} onClick={() => handleDelete(page.key)}>
                    <DeleteOutlined /> ลบ
                  </button>
                )}
                <button
                  className={css.btnUpload}
                  onClick={() => fileInputRefs.current[page.key]?.click()}
                  disabled={isUploading}
                >
                  <UploadOutlined /> {isUploading ? "กำลังอัพโหลด..." : imgUrl ? "เปลี่ยนรูป" : "อัพโหลด"}
                </button>
              </div>

              <input
                ref={(el) => { fileInputRefs.current[page.key] = el; }}
                type="file"
                accept="image/*"
                className={css.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(page.key, file);
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
