"use client";

import React from "react";
import { CameraOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockPhotoAlbums } from "@/data/mockPhotos";
import css from "./PhotoGallerySection.module.css";

const albums = mockPhotoAlbums.filter((a) => a.isActive).slice(0, 6);

export default function PhotoGallerySection() {
  return (
    <section className={css.section}>
      <div className={css.inner}>
        <div className={css.header}>
          <h2 className="section-heading" style={{ textAlign: "left" }}>
            ภาพกิจกรรมสหกรณ์
          </h2>
          <Link href="/gallery" className={css.viewAll}>
            ดูทั้งหมด <RightOutlined />
          </Link>
        </div>

        <div className={css.grid}>
          {albums.map((album) => (
            <Link href={`/gallery/${album.id}`} key={album.id} className={css.card}>
              <div className={css.imgWrap}>
                {album.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverImage} alt={album.title} className={css.img} />
                ) : (
                  <div className={css.placeholder} />
                )}
                <div className={css.overlay}>
                  <CameraOutlined className={css.icon} />
                  <span>{album.photoCount} ภาพ</span>
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
