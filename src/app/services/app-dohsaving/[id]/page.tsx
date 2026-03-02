"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LoadingOutlined, HomeOutlined, LeftOutlined, RightOutlined,
  CloseOutlined, ZoomInOutlined, ArrowLeftOutlined, FileSearchOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface GuideImage {
  imageUrl: string;
  caption: string;
}

interface SectionData {
  id: number;
  title: string;
  coverUrl: string | null;
  images: string;
}

export default function AppGuideDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/app-guide/${id}`);
      if (res.ok) { setData(await res.json()); setNotFound(false); }
      else setNotFound(true);
    } catch { setNotFound(true); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  let images: GuideImage[] = [];
  if (data?.images) {
    try { images = JSON.parse(data.images); } catch { /* */ }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const prevImage = () => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const nextImage = () => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0));

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
  }, [lightboxOpen, images.length]);

  // Loading
  if (loading) {
    return (
      <>
        <div className={css.hero}>
          <div className={css.breadcrumb}>
            <Link href="/"><HomeOutlined /></Link>
            <span>/</span>
            <Link href="/services/app-dohsaving">Application DOHSaving</Link>
          </div>
          <h1 className={css.heroTitle}>กำลังโหลด...</h1>
        </div>
        <div className={css.content}>
          <div className={css.loading}><LoadingOutlined style={{ fontSize: 24, marginBottom: 8 }} /><br />กำลังโหลดข้อมูล...</div>
        </div>
      </>
    );
  }

  // Not found
  if (notFound || !data) {
    return (
      <>
        <div className={css.hero}>
          <div className={css.breadcrumb}>
            <Link href="/"><HomeOutlined /></Link>
            <span>/</span>
            <Link href="/services/app-dohsaving">Application DOHSaving</Link>
          </div>
          <h1 className={css.heroTitle}>ไม่พบหัวข้อนี้</h1>
        </div>
        <div className={css.content}>
          <div className={css.notFound}>
            <FileSearchOutlined style={{ fontSize: 48, color: "#d1d5db" }} />
            <h2 className={css.notFoundTitle}>ไม่พบหัวข้อที่ต้องการ</h2>
            <p className={css.notFoundText}>หัวข้อนี้อาจถูกลบหรือยังไม่เปิดให้บริการ</p>
            <Link href="/services/app-dohsaving" className={css.backLink}>
              <ArrowLeftOutlined /> กลับหน้ารวม
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.breadcrumb}>
          <Link href="/"><HomeOutlined /></Link>
          <span>/</span>
          <Link href="/services/app-dohsaving">Application DOHSaving</Link>
          <span>/</span>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>{data.title}</span>
        </div>
        <h1 className={css.heroTitle}>{data.title}</h1>
        <p className={css.heroSub}>คลิกที่รูปภาพเพื่อดูขนาดเต็ม</p>
      </div>

      <div className={css.content}>
        {/* Back */}
        <Link href="/services/app-dohsaving" className={css.backLink}>
          <ArrowLeftOutlined /> กลับหน้ารวม
        </Link>

        {/* Image Grid */}
        <div className={css.imageGrid}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className={css.imageCard}
              onClick={() => openLightbox(idx)}
            >
              <img
                src={img.imageUrl}
                alt={img.caption || data.title}
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

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className={css.lightbox} onClick={closeLightbox}>
          <button className={css.lightboxClose} onClick={closeLightbox}>
            <CloseOutlined />
          </button>

          <div className={css.lightboxCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button
              className={`${css.lightboxNav} ${css.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <LeftOutlined />
            </button>
          )}

          <img
            src={images[lightboxIndex].imageUrl}
            alt={images[lightboxIndex].caption || ""}
            className={css.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              className={`${css.lightboxNav} ${css.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <RightOutlined />
            </button>
          )}

          {images[lightboxIndex].caption && (
            <div className={css.lightboxCaption}>
              {images[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
