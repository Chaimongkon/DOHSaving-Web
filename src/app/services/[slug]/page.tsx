"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, FileText, ChevronRight, Home, SearchX, Download, ZoomIn,
} from "lucide-react";
import { Document3D } from "@/components/icons/ThreeDIcons";
import css from "./page.module.css";

interface DownloadLink { label: string; url: string; }

interface ServicePageData {
  id: number;
  slug: string;
  title: string;
  category: string;
  infographicUrl: string | null;
  downloadLinks: string | null;
  formGroup: string | null;
}

const FORM_GROUP_KEY_MAP: Record<string, string> = {
  "แบบฟอร์มสมัครสมาชิก": "member-registration",
  "แบบฟอร์มเงินฝาก-ถอน": "deposit-withdraw",
  "แบบฟอร์มเกี่ยวกับเงินกู้": "loan",
  "แบบฟอร์มขอสวัสดิการ": "welfare",
  "แบบฟอร์มหนังสือร้องทุกข์": "complaint",
  "หนังสือแต่งตั้งผู้รับโอนประโยชน์": "beneficiary",
  "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์": "insurance",
  "แบบฟอร์มอื่นๆ": "other",
};

export default function ServicePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ServicePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/service-pages/${slug}`);
      if (res.ok) { setData(await res.json()); setNotFound(false); }
      else setNotFound(true);
    } catch { setNotFound(true); }
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  let links: DownloadLink[] = [];
  if (data?.downloadLinks) {
    try { links = JSON.parse(data.downloadLinks); } catch { /* */ }
  }

  const formGroupKey = data?.formGroup ? FORM_GROUP_KEY_MAP[data.formGroup] : null;
  const hasLinks = links.length > 0;
  const hasActions = !!formGroupKey || hasLinks;

  if (loading) {
    return (
      <div className={css.pageWrapper}>
        <div className={css.hero}>
          <div className={css.heroBgPattern} />
          <div className={css.heroContent}>
            <h1 className={css.heroTitle}>กำลังโหลด...</h1>
          </div>
        </div>
        <div className={css.content}>
          <div className={css.loading}><Loader2 className={css.spinner} /><br />กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className={css.pageWrapper}>
        <div className={css.hero}>
          <div className={css.heroBgPattern} />
          <div className={css.heroContent}>
            <h1 className={css.heroTitle}>ไม่พบหน้าที่ต้องการ</h1>
          </div>
        </div>
        <div className={css.content}>
          <div className={css.notFound}>
            <SearchX size={48} className={css.notFoundIcon} />
            <h2 className={css.notFoundTitle}>ไม่พบหน้าบริการนี้</h2>
            <p className={css.notFoundText}>หน้าที่คุณต้องการอาจถูกย้ายหรือยังไม่เปิดให้บริการ</p>
            <Link href="/" className={css.backLink}><Home size={16} /> กลับหน้าหลัก</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={css.pageWrapper}>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroBgPattern} />
        <div className={css.heroContent}>
          <div className={css.breadcrumb}>
            <Link href="/"><Home size={14} /></Link>
            <span>/</span>
            <span>{data.category}</span>
            <span>/</span>
            <span className={css.breadcrumbActive}>{data.title}</span>
          </div>
          <h1 className={css.heroTitle}>{data.title}</h1>
          <p className={css.heroSub}>{data.category}</p>
        </div>
      </div>

      <div className={css.content}>
        {/* Infographic (Now at the top) */}
        {data.infographicUrl && (
          <div className={css.infographicSection}>
            <div className={css.infographicCard} onClick={() => setLightbox(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.infographicUrl} alt={data.title} className={css.infographicImage} />
              <div className={css.zoomHint}>
                <ZoomIn size={18} />
                <span>คลิกเพื่อดูภาพขนาดเต็ม</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards Row */}
        {hasActions && (
          <div className={css.actionSection}>
            <h2 className={css.actionSectionTitle}>
              <Download size={24} /> เอกสารและแบบฟอร์มที่เกี่ยวข้อง
            </h2>
            <div className={css.actionRow}>
              {/* Form download button */}
              {formGroupKey && (
                <Link href={`/forms?group=${formGroupKey}`} className={css.actionCard}>
                  <div className={css.actionIcon}>
                    <Document3D size={32} />
                  </div>
                  <div className={css.actionInfo}>
                    <h3 className={css.actionTitle}>{data.formGroup}</h3>
                    <p className={css.actionDesc}>คลิกเพื่อดูและดาวน์โหลดแบบฟอร์ม แยกตามประเภทสมาชิก</p>
                  </div>
                  <ChevronRight size={20} className={css.actionArrow} />
                </Link>
              )}

              {/* Download links */}
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target={link.url.startsWith("/") && !link.url.includes(".") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={css.actionCard}
                >
                  <div className={css.actionIconDoc}>
                    <Document3D size={28} />
                  </div>
                  <div className={css.actionInfo}>
                    <h3 className={css.actionTitle}>{link.label}</h3>
                    <p className={css.actionDesc}>คลิกเพื่อดาวน์โหลดเอกสาร</p>
                  </div>
                  <ChevronRight size={20} className={css.actionArrow} />
                </a>
              ))}

              {/* All forms link */}
              {formGroupKey && (
                <Link href="/forms" className={css.allFormsChip}>
                  ดูแบบฟอร์มทั้งหมด <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && data.infographicUrl && (
        <div className={css.lightbox} onClick={() => setLightbox(false)}>
          <button className={css.lightboxClose} onClick={() => setLightbox(false)}>✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.infographicUrl} alt={data.title} className={css.lightboxImg} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
