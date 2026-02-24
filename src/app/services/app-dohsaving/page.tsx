"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LoadingOutlined, HomeOutlined, LeftOutlined, RightOutlined, CloseOutlined, ZoomInOutlined } from "@ant-design/icons";
import css from "./page.module.css";

interface GuideImage {
  imageUrl: string;
  caption: string;
}

interface Section {
  id: number;
  title: string;
  images: string;
  sortOrder: number;
}

export default function AppDohsavingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<GuideImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app-guide");
      if (res.ok) setSections(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLightbox = (images: GuideImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const prevImage = () => setLightboxIndex((i) => (i > 0 ? i - 1 : lightboxImages.length - 1));
  const nextImage = () => setLightboxIndex((i) => (i < lightboxImages.length - 1 ? i + 1 : 0));

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, lightboxImages.length]);

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.breadcrumb}>
          <Link href="/"><HomeOutlined /></Link>
          <span>/</span>
          <span>บริการ</span>
          <span>/</span>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>Application DOHSaving</span>
        </div>
        <h1 className={css.heroTitle}>วิธีใช้งาน Application DOHSaving</h1>
        <p className={css.heroSub}>เพิ่มความสะดวกสบายกับบริการออนไลน์ ทุกที่ ทุกเวลา</p>
      </div>

      <div className={css.content}>
        {/* Intro */}
        <div className={css.intro}>
          เพื่อความสะดวกในการทำธุรกรรมของสมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง ทุกท่าน ทางสหกรณ์ฯ ได้จัดทำคู่มือการใช้งานแอปพลิเคชั่น เพื่อง่ายต่อการใช้งาน
          <br />
          <strong>คลิกที่รูปภาพเพื่อดูขนาดเต็ม</strong>
        </div>

        {/* Loading */}
        {loading && (
          <div className={css.loading}>
            <LoadingOutlined style={{ fontSize: 24, marginBottom: 8 }} /><br />กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Sections */}
        {sections.map((section, sIdx) => {
          let images: GuideImage[] = [];
          try { images = JSON.parse(section.images || "[]"); } catch { /* */ }
          if (images.length === 0) return null;

          return (
            <div key={section.id} className={css.section}>
              <h2 className={css.sectionTitle}>
                <span className={css.sectionNumber}>{sIdx + 1}.</span> {section.title}
              </h2>
              <div className={css.imageGrid}>
                {images.map((img, iIdx) => (
                  <div
                    key={iIdx}
                    className={css.imageCard}
                    onClick={() => openLightbox(images, iIdx)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.caption || section.title}
                      className={css.imageThumb}
                      loading="lazy"
                    />
                    {img.caption && (
                      <div className={css.imageCaption}>{img.caption}</div>
                    )}
                    <div className={css.zoomHint}>
                      <ZoomInOutlined /> คลิกเพื่อขยาย
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div className={css.lightbox} onClick={closeLightbox}>
          {/* Close */}
          <button className={css.lightboxClose} onClick={closeLightbox}>
            <CloseOutlined />
          </button>

          {/* Counter */}
          <div className={css.lightboxCounter}>
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {/* Prev */}
          {lightboxImages.length > 1 && (
            <button
              className={`${css.lightboxNav} ${css.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <LeftOutlined />
            </button>
          )}

          {/* Image */}
          <img
            src={lightboxImages[lightboxIndex].imageUrl}
            alt={lightboxImages[lightboxIndex].caption || ""}
            className={css.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxImages.length > 1 && (
            <button
              className={`${css.lightboxNav} ${css.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <RightOutlined />
            </button>
          )}

          {/* Caption */}
          {lightboxImages[lightboxIndex].caption && (
            <div className={css.lightboxCaption}>
              {lightboxImages[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
