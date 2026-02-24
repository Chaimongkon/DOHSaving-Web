"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, ArrowLeft, ChevronLeft, ChevronRight, X, Images, ZoomIn, FolderOpen } from "lucide-react";
import css from "./page.module.css";

/* ── Types ── */
interface Album {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  eventDate: string | null;
  _count: { photos: number };
}

interface Photo {
  id: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface AlbumDetail extends Omit<Album, "_count"> {
  photos: Photo[];
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <ActivitiesContent />
    </Suspense>
  );
}

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Album detail view
  const [detail, setDetail] = useState<AlbumDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  /* ── Open album detail ── */
  const openAlbum = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/activity-albums?id=${id}`);
      if (res.ok) setDetail(await res.json());
    } catch { /* ignore */ }
    setLoadingDetail(false);
  }, []);

  /* ── Load albums + auto-open from ?album=ID ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/activity-albums");
        if (res.ok) {
          const data = await res.json();
          setAlbums(data);
          const albumParam = searchParams.get("album");
          if (albumParam) openAlbum(Number(albumParam));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [searchParams, openAlbum]);

  /* ── Lightbox keyboard nav ── */
  useEffect(() => {
    if (lightboxIdx === null || !detail) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      if (e.key === "ArrowRight") setLightboxIdx((prev) => (prev !== null && detail && prev < detail.photos.length - 1 ? prev + 1 : prev));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, detail]);

  /* ── Lock body scroll when lightbox open ── */
  useEffect(() => {
    if (lightboxIdx !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <>
      <div className={css.hero}>
        {/* Animated mosaic background */}
        <div className={css.heroBg}>
          {Array.from({ length: 10 }).map((_, col) => (
            <div key={col} className={css.heroBgCol}>
              {Array.from({ length: 8 }).map((_, row) => (
                <div key={row} className={css.heroBgBlock} />
              ))}
              {Array.from({ length: 8 }).map((_, row) => (
                <div key={`d-${row}`} className={css.heroBgBlock} />
              ))}
            </div>
          ))}
        </div>

        <div className={css.heroInner}>
          <div className={css.heroIcon}>
            <Camera size={28} />
          </div>
          <h1 className={css.heroTitle}>ภาพกิจกรรมสหกรณ์</h1>
          <p className={css.heroSub}>รวมภาพบรรยากาศกิจกรรมต่าง ๆ ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
        </div>
      </div>

      <div className={css.content}>
        {loading || loadingDetail ? (
          <div className={css.loading}>กำลังโหลด...</div>
        ) : detail ? (
          /* ── Album Detail View ── */
          <>
            <button className={css.backBtn} onClick={() => { setDetail(null); setLightboxIdx(null); }}>
              <ArrowLeft size={16} /> กลับ
            </button>

            <div className={css.detailHeader}>
              <h2 className={css.detailTitle}>{detail.title}</h2>
              {detail.eventDate && <p className={css.detailDate}>{formatDate(detail.eventDate)}</p>}
              {detail.description && <p className={css.detailDesc}>{detail.description}</p>}
            </div>

            {detail.photos.length === 0 ? (
              <div className={css.empty}>
                <FolderOpen size={56} />
                <p>ยังไม่มีรูปภาพในอัลบั้มนี้</p>
              </div>
            ) : (
              <div className={css.photoGrid}>
                {detail.photos.map((photo, idx) => (
                  <div key={photo.id} className={css.photoItem} onClick={() => setLightboxIdx(idx)}>
                    <img src={photo.imageUrl} alt={photo.caption || `ภาพที่ ${idx + 1}`} loading="lazy" />
                    <div className={css.photoOverlay}>
                      <div className={css.photoOverlayIcon}>
                        <ZoomIn size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Lightbox ── */}
            {lightboxIdx !== null && detail.photos[lightboxIdx] && (
              <div className={css.lightbox} onClick={() => setLightboxIdx(null)}>
                <button className={css.lightboxClose} onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}>
                  <X size={20} />
                </button>

                {lightboxIdx > 0 && (
                  <button
                    className={`${css.lightboxNav} ${css.lightboxPrev}`}
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {lightboxIdx < detail.photos.length - 1 && (
                  <button
                    className={`${css.lightboxNav} ${css.lightboxNext}`}
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                <img
                  src={detail.photos[lightboxIdx].imageUrl}
                  alt={detail.photos[lightboxIdx].caption || ""}
                  className={css.lightboxImage}
                  onClick={(e) => e.stopPropagation()}
                />

                {detail.photos[lightboxIdx].caption && (
                  <div className={css.lightboxCaption}>{detail.photos[lightboxIdx].caption}</div>
                )}

                <div className={css.lightboxCounter}>
                  {lightboxIdx + 1} / {detail.photos.length}
                </div>
              </div>
            )}
          </>
        ) : albums.length === 0 ? (
          <div className={css.empty}>
            <FolderOpen size={56} />
            <p>ยังไม่มีภาพกิจกรรม</p>
          </div>
        ) : (
          /* ── Album Grid ── */
          <div className={css.albumGrid}>
            {albums.map((album, idx) => (
              <div
                key={album.id}
                className={`${css.albumCard} ${idx === 0 && albums.length > 1 ? css.albumCardFeatured : ""}`}
                onClick={() => openAlbum(album.id)}
              >
                <div className={css.albumCover}>
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.title} loading="lazy" />
                  ) : (
                    <div className={css.albumCoverEmpty}>
                      <Camera size={48} />
                      <span>ภาพกิจกรรม</span>
                    </div>
                  )}
                  <div className={css.albumCoverOverlay} />
                  <div className={css.albumPhotoCount}>
                    <Images size={14} />
                    {album._count.photos} ภาพ
                  </div>
                  <div className={css.albumCoverInfo}>
                    <h3 className={css.albumCoverTitle}>{album.title}</h3>
                    {album.eventDate && <p className={css.albumCoverDate}>{formatDate(album.eventDate)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
