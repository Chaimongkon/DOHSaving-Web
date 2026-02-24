"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LoadingOutlined, FilePdfOutlined, RightOutlined, HomeOutlined, FileSearchOutlined } from "@ant-design/icons";
import css from "./page.module.css";

interface DownloadLink {
  label: string;
  url: string;
}

interface ServicePageData {
  id: number;
  slug: string;
  title: string;
  category: string;
  infographicUrl: string | null;
  downloadLinks: string | null;
}

export default function ServicePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ServicePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/service-pages/${slug}`);
      if (res.ok) {
        setData(await res.json());
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  let links: DownloadLink[] = [];
  if (data?.downloadLinks) {
    try { links = JSON.parse(data.downloadLinks); } catch { /* */ }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <div className={css.hero}>
          <div className={css.breadcrumb}>
            <Link href="/"><HomeOutlined /></Link>
            <span>/</span>
            <span>บริการ</span>
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
            <span>บริการ</span>
          </div>
          <h1 className={css.heroTitle}>ไม่พบหน้าที่ต้องการ</h1>
        </div>
        <div className={css.content}>
          <div className={css.notFound}>
            <div className={css.notFoundIcon}><FileSearchOutlined /></div>
            <h2 className={css.notFoundTitle}>ไม่พบหน้าบริการนี้</h2>
            <p className={css.notFoundText}>หน้าที่คุณต้องการอาจถูกย้ายหรือยังไม่เปิดให้บริการ</p>
            <Link href="/" className={css.backLink}>
              <HomeOutlined /> กลับหน้าหลัก
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
          <span>{data.category}</span>
          <span>/</span>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>{data.title}</span>
        </div>
        <h1 className={css.heroTitle}>{data.title}</h1>
        <p className={css.heroSub}>{data.category}</p>
      </div>

      <div className={css.content}>
        {/* Infographic */}
        {data.infographicUrl && (
          <div className={css.infographicCard}>
            <img
              src={data.infographicUrl}
              alt={data.title}
              className={css.infographicImage}
            />
          </div>
        )}

        {/* Download Links */}
        {links.length > 0 && (
          <div className={css.downloadsSection}>
            <h2 className={css.downloadsTitle}>ดาวน์โหลดเอกสาร</h2>
            <ul className={css.downloadsList}>
              {links.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    target={link.url.startsWith("/") && !link.url.includes(".") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className={css.downloadItem}
                  >
                    <span className={css.downloadIcon}>
                      <FilePdfOutlined />
                    </span>
                    <span className={css.downloadLabel}>{link.label}</span>
                    <span className={css.downloadArrow}>
                      <RightOutlined />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
