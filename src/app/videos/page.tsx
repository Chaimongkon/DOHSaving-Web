"use client";

import React, { useState, useEffect } from "react";
import { PlayCircleOutlined, YoutubeOutlined, CloseOutlined } from "@ant-design/icons";
import { FolderOpen } from "lucide-react";
import css from "./page.module.css";

interface Video {
  id: number;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  description: string | null;
  createdAt: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Video | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/videos");
        if (res.ok) setVideos(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  // Keyboard: Esc to close
  useEffect(() => {
    if (!modal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  return (
    <>
      <div className={css.hero}>
        <div className={css.heroInner}>
          <div className={css.heroIcon}>
            <YoutubeOutlined />
          </div>
          <h1 className={css.heroTitle}>วิดีโอสหกรณ์</h1>
          <p className={css.heroSub}>รวมวิดีโอกิจกรรมและข่าวสารของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
        </div>
      </div>

      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>กำลังโหลด...</div>
        ) : videos.length === 0 ? (
          <div className={css.empty}>
            <FolderOpen size={56} />
            <p>ยังไม่มีวิดีโอ</p>
          </div>
        ) : (
          <div className={css.grid}>
            {videos.map((video, idx) => (
              <div
                key={video.id}
                className={`${css.card} ${idx === 0 && videos.length > 1 ? css.cardFeatured : ""}`}
              >
                <div className={css.thumbWrap} onClick={() => setModal(video)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                    }}
                  />
                  <div className={css.thumbOverlay}>
                    <div className={css.playBtn}>
                      <PlayCircleOutlined />
                    </div>
                  </div>
                </div>
                <div className={css.info}>
                  <h3 className={css.title}>{video.title}</h3>
                  {video.description && <p className={css.desc}>{video.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Full-screen Modal Player ── */}
      {modal && (
        <div className={css.modal} onClick={() => setModal(null)}>
          <button className={css.modalClose} onClick={(e) => { e.stopPropagation(); setModal(null); }}>
            <CloseOutlined />
          </button>
          <div className={css.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalPlayer}>
              <iframe
                src={`https://www.youtube.com/embed/${modal.youtubeId}?autoplay=1&rel=0`}
                title={modal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h3 className={css.modalTitle}>{modal.title}</h3>
            {modal.description && <p className={css.modalDesc}>{modal.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
