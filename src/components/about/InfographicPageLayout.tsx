"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PictureOutlined } from "@ant-design/icons";
import { ZoomIn, X } from "lucide-react";
import AboutPageShell, { AboutSectionHead, AboutLoading, AboutEmpty } from "./AboutPageShell";
import { OrgEmblem } from "./GovernanceEmblems";
import { ABOUT_NAV_GROUPS } from "./aboutNav";
import css from "./InfographicPageLayout.module.css";

interface InfographicPageLayoutProps {
  pageKey: string;
  breadcrumbLabel: string;
  pageTitle: string;
  eyebrow?: string;
  lead?: string;
  /** แสดงการ์ดลิงก์ไปหน้าผู้บริหารและฝ่ายต่าง ๆ ใต้แผนผัง */
  showTeamLinks?: boolean;
}

/** หน้าที่เนื้อหาหลักเป็นภาพ infographic ที่อัปโหลดจาก Admin (เช่น โครงสร้างองค์กร) */
export default function InfographicPageLayout({
  pageKey,
  breadcrumbLabel,
  pageTitle,
  eyebrow = "INFOGRAPHIC",
  lead = "",
  showTeamLinks = false,
}: InfographicPageLayoutProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // ภาพที่โหลดไม่ขึ้น (ไฟล์ใน /uploads หาย) — ซ่อนไปแทนที่จะโชว์กรอบว่าง
  const [failed, setFailed] = useState<string[]>([]);
  const visible = images.filter((img) => !failed.includes(img));

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pages/${pageKey}/images`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setImages(data.images || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pageKey]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Esc ปิด + ล็อกการเลื่อนหน้าระหว่างเปิดภาพเต็มจอ
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, closeLightbox]);

  const teamLinks = ABOUT_NAV_GROUPS[1].links.filter((l) => l.href !== `/about/${pageKey}`);

  return (
    <AboutPageShell
      breadcrumbLabel={breadcrumbLabel}
      eyebrow={eyebrow}
      title={pageTitle}
      lead={lead}
      heroImage={`/images/about/${pageKey}-hero.png`}
      heroImageAlt={`ภาพประกอบ${pageTitle} สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด`}
      emblem={<OrgEmblem />}
    >
      {loading ? (
        <AboutLoading />
      ) : visible.length > 0 ? (
        <div className={css.gallery}>
          {visible.map((img, idx) => (
            <button
              key={img}
              type="button"
              className={css.frame}
              onClick={() => setLightboxIndex(idx)}
              aria-label={`ขยายภาพ${pageTitle}${visible.length > 1 ? ` ภาพที่ ${idx + 1}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${pageTitle}${visible.length > 1 ? ` ภาพที่ ${idx + 1}` : ""}`}
                className={css.image}
                onError={() => setFailed((prev) => (prev.includes(img) ? prev : [...prev, img]))}
              />
              <span className={css.zoomHint} aria-hidden="true">
                <ZoomIn size={16} strokeWidth={2.2} />
                คลิกเพื่อดูขนาดเต็ม
              </span>
            </button>
          ))}
        </div>
      ) : (
        <AboutEmpty
          icon={<PictureOutlined />}
          text={
            images.length > 0
              ? "โหลดภาพไม่สำเร็จ — กรุณาอัปโหลดภาพใหม่ผ่านระบบ Admin"
              : "ยังไม่มีรูป Infographic — กรุณาเพิ่มผ่านระบบ Admin"
          }
        />
      )}

      {showTeamLinks && (
        <section className={css.section} aria-labelledby="team-links-heading">
          <AboutSectionHead title="ทำความรู้จักผู้บริหารและฝ่ายต่าง ๆ" id="team-links-heading" />
          <ul role="list" className={css.links}>
            {teamLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={css.link}>
                  <span className={css.linkIcon} aria-hidden="true">
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className={css.linkLabel}>{label}</span>
                  <span className={css.linkArrow} aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* portal ไปที่ body ให้ position:fixed อิงกับจอเสมอ ไม่ว่าบรรพบุรุษจะมี transform/filter */}
      {lightboxIndex !== null && visible[lightboxIndex] &&
        createPortal(
          <div className={css.lightbox} onClick={closeLightbox} role="dialog" aria-modal="true" aria-label={pageTitle}>
            <button type="button" className={css.lightboxClose} onClick={closeLightbox} aria-label="ปิด">
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visible[lightboxIndex]}
              alt={pageTitle}
              className={css.lightboxImg}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </AboutPageShell>
  );
}
