"use client";

import React, { useState, useEffect } from "react";
import { CameraOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import css from "./PhotoGallerySection.module.css";

interface Album {
  id: number;
  title: string;
  coverUrl: string | null;
  _count: { photos: number };
}

export default function PhotoGallerySection() {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/activity-albums");
        if (res.ok) {
          const data: Album[] = await res.json();
          setAlbums(data.slice(0, 6));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  if (albums.length === 0) return null;

  return (
    <section className={css.section}>
      <div className={css.inner}>
        <div className={css.header}>
          <h2 className="section-heading section-heading--left">
            ภาพกิจกรรมสหกรณ์
          </h2>
          <Link href="/activities" className={css.viewAll}>
            ดูทั้งหมด <RightOutlined />
          </Link>
        </div>

        <div className={css.grid}>
          {albums.map((album) => (
            <Link href={`/activities?album=${album.id}`} key={album.id} className={css.card}>
              <div className={css.imgWrap}>
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverUrl} alt={album.title} className={css.img} />
                ) : (
                  <div className={css.placeholder} />
                )}
                <div className={css.overlay}>
                  <CameraOutlined className={css.icon} />
                  <span>{album._count.photos} ภาพ</span>
                </div>
              </div>
              <span className={css.title}>{album.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
