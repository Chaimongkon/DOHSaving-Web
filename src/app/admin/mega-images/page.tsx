"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    CloudUploadOutlined,
    DeleteOutlined,
    PictureOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface SlotConfig {
    key: string;
    label: string;
    hint: string;
}

const slots: SlotConfig[] = [
    { key: "mega-about", label: "เกี่ยวกับสหกรณ์ฯ", hint: "About" },
    { key: "mega-services", label: "บริการ", hint: "Services" },
    { key: "mega-news", label: "ข่าวสาร", hint: "News" },
    { key: "mega-documents", label: "เอกสาร", hint: "Documents" },
    { key: "mega-contact", label: "ติดต่อเรา", hint: "Contact" },
];

export default function MegaImagesPage() {
    const [images, setImages] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const fetchImages = async () => {
        try {
            const res = await fetch("/api/admin/site-images");
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, string> = {};
                for (const item of data) {
                    if (item.value) map[item.key] = item.value;
                }
                setImages(map);
            }
        } catch (err) {
            console.error("Failed to fetch mega images:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpload = async (key: string, file: File) => {
        setUploading(key);

        // 1) Upload image file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "mega-images");

        try {
            const uploadRes = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
                alert(uploadData.error || "อัพโหลดไม่สำเร็จ");
                return;
            }

            // 2) Save to SiteSetting
            const saveRes = await fetch("/api/admin/site-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key,
                    value: uploadData.url,
                    remark: slots.find((s) => s.key === key)?.label || "",
                }),
            });

            if (saveRes.ok) {
                setImages((prev) => ({ ...prev, [key]: uploadData.url }));
                setSaved(key);
                setTimeout(() => setSaved(null), 2000);
            } else {
                alert("บันทึกไม่สำเร็จ");
            }
        } catch {
            alert("เกิดข้อผิดพลาด");
        } finally {
            setUploading(null);
            const ref = fileRefs.current[key];
            if (ref) ref.value = "";
        }
    };

    const handleRemove = async (key: string) => {
        if (!confirm("ต้องการลบรูปนี้?")) return;

        try {
            const res = await fetch("/api/admin/site-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value: "" }),
            });
            if (res.ok) {
                setImages((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            }
        } catch {
            alert("ลบไม่สำเร็จ");
        }
    };

    if (loading) {
        return <div className={css.loading}>กำลังโหลด...</div>;
    }

    return (
        <div>
            <div className={css.header}>
                <h1 className={css.title}>จัดการรูปเมนูหลัก (Mega Menu)</h1>
                <p className={css.subtitle}>
                    อัพโหลดรูปภาพที่จะแสดงในแถบด้านซ้ายของเมนูย่อยแต่ละหมวด
                </p>
            </div>

            <div className={css.grid}>
                {slots.map((slot) => {
                    const imagePath = images[slot.key];
                    const isUploading = uploading === slot.key;
                    const isSaved = saved === slot.key;

                    return (
                        <div key={slot.key} className={css.card}>
                            <div className={css.cardHeader}>
                                <span className={css.cardLabel}>{slot.label}</span>
                                <span className={css.cardHint}>{slot.hint}</span>
                            </div>

                            {imagePath ? (
                                <div className={css.preview}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePath}
                                        alt={slot.label}
                                        className={css.previewImg}
                                    />
                                    <div className={css.previewActions}>
                                        <button
                                            className={css.changeBtn}
                                            onClick={() => fileRefs.current[slot.key]?.click()}
                                            disabled={isUploading}
                                        >
                                            <CloudUploadOutlined /> เปลี่ยนรูป
                                        </button>
                                        <button
                                            className={css.removeBtn}
                                            onClick={() => handleRemove(slot.key)}
                                        >
                                            <DeleteOutlined /> ลบ
                                        </button>
                                    </div>
                                    {isSaved && (
                                        <div className={css.savedBadge}>
                                            <CheckCircleOutlined /> บันทึกแล้ว
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={css.uploadArea}
                                    onClick={() => fileRefs.current[slot.key]?.click()}
                                >
                                    <div className={css.uploadIcon}>
                                        {isUploading ? (
                                            <span className={css.spinner} />
                                        ) : (
                                            <PictureOutlined />
                                        )}
                                    </div>
                                    <p className={css.uploadText}>
                                        {isUploading
                                            ? "กำลังอัพโหลด..."
                                            : "คลิกเพื่อเลือกรูปภาพ"}
                                    </p>
                                    <p className={css.uploadHint}>PNG, JPG, JPEG, GIF, WebP</p>
                                </div>
                            )}

                            <input
                                ref={(el) => { fileRefs.current[slot.key] = el; }}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(slot.key, file);
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
