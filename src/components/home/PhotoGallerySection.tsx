"use client";

import React from "react";
import { CameraOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockPhotoAlbums } from "@/data/mockPhotos";

const albums = mockPhotoAlbums.filter((a) => a.isActive).slice(0, 6);

export default function PhotoGallerySection() {
  return (
    <section className="gallery-section">
      <div className="gallery-inner">
        <div className="gallery-header">
          <h2 className="section-heading" style={{ textAlign: "left" }}>
            ภาพกิจกรรมสหกรณ์
          </h2>
          <Link href="/gallery" className="gallery-view-all">
            ดูทั้งหมด <RightOutlined />
          </Link>
        </div>

        <div className="gallery-grid">
          {albums.map((album) => (
            <Link href={`/gallery/${album.id}`} key={album.id} className="gallery-card">
              <div className="gallery-card-img-wrap">
                {album.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverImage} alt={album.title} className="gallery-card-img" />
                ) : (
                  <div className="gallery-card-placeholder" />
                )}
                <div className="gallery-card-overlay">
                  <CameraOutlined className="gallery-card-icon" />
                  <span>{album.photoCount} ภาพ</span>
                </div>
              </div>
              <span className="gallery-card-title">{album.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
