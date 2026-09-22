"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FilePdfOutlined, NotificationOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { type DocMeta, EMPTY_DOC_META, hasDocMeta, normalizeDocMeta, safeDocUrl } from "@/lib/docMeta";
import AboutPageShell, { AboutSectionHead, AboutLoading, AboutEmpty } from "./AboutPageShell";
import { pickGovernanceIcon } from "./governanceIcons";
import css from "./GovernancePageLayout.module.css";

interface GovernanceItem {
  id: string;
  text: string;
  /** หัวข้อสั้น (ไม่บังคับ) — แอดมินกรอกเพื่อให้กวาดตาอ่านได้เร็ว */
  title?: string;
}

export interface GovernancePageLayoutProps {
  /** เส้นทาง API สาธารณะที่คืน { items, meta } */
  apiPath: string;
  breadcrumbLabel: string;
  /** ข้อความภาษาอังกฤษตัวเล็กเหนือหัวเรื่อง เช่น "CODE OF CONDUCT" */
  eyebrow: string;
  title: string;
  /** ย่อหน้านำใน hero — อธิบายว่าหน้านี้คืออะไร ทำไมสมาชิกต้องอ่าน */
  lead: string;
  /** ป้ายนับจำนวนข้อใน hero เช่น (n) => `จรรยาบรรณ ${n} ประการ` */
  countLabel: (count: number) => string;
  countIcon: React.ReactNode;
  /** หัวข้อเหนือรายการข้อ */
  sectionTitle: (count: number) => string;
  /** ภาพ hero ใน public/ — ถ้าไม่มีไฟล์จะ fallback ไปใช้ emblem */
  heroImage: string;
  heroImageAlt: string;
  /** ตราสัญลักษณ์ SVG สำรอง ใช้เมื่อยังไม่มีไฟล์ภาพ */
  emblem: React.ReactNode;
  /** "single" = ข้อความยาว คอลัมน์เดียว | "grid" = ข้อความสั้น 2 คอลัมน์ */
  listLayout: "single" | "grid";
  emptyText: string;
  emptyIcon: React.ReactNode;
  /** ข้อความในกล่องช่องทางร้องเรียนท้ายหน้า */
  ctaText: string;
}

export default function GovernancePageLayout({
  apiPath,
  breadcrumbLabel,
  eyebrow,
  title,
  lead,
  countLabel,
  countIcon,
  sectionTitle,
  heroImage,
  heroImageAlt,
  emblem,
  listLayout,
  emptyText,
  emptyIcon,
  ctaText,
}: GovernancePageLayoutProps) {
  const [items, setItems] = useState<GovernanceItem[]>([]);
  const [meta, setMeta] = useState<DocMeta>(EMPTY_DOC_META);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setMeta(normalizeDocMeta(data.meta));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiPath]);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.cardVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    cardsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const docUrl = safeDocUrl(meta.documentUrl);

  return (
    <AboutPageShell
      breadcrumbLabel={breadcrumbLabel}
      eyebrow={eyebrow}
      title={title}
      lead={lead}
      badge={items.length > 0 ? <>{countIcon}{countLabel(items.length)}</> : undefined}
      heroImage={heroImage}
      heroImageAlt={heroImageAlt}
      emblem={emblem}
    >
      {loading ? (
        <AboutLoading />
      ) : items.length > 0 ? (
        <>
          {/* ที่มาของเอกสาร — ช่วยให้สมาชิกและผู้ตรวจสอบกิจการอ้างอิงได้ */}
          {hasDocMeta(meta) && (
            <div className={css.docMeta}>
              {meta.announcedAt && (
                <span className={css.docMetaItem}>
                  <span className={css.docMetaLabel}>ประกาศใช้</span>
                  <span className={css.docMetaValue}>{meta.announcedAt}</span>
                </span>
              )}
              {meta.edition && (
                <span className={css.docMetaItem}>
                  <span className={css.docMetaLabel}>ฉบับ</span>
                  <span className={css.docMetaValue}>{meta.edition}</span>
                </span>
              )}
              {meta.reference && (
                <span className={css.docMetaItem}>
                  <span className={css.docMetaLabel}>อ้างอิง</span>
                  <span className={css.docMetaValue}>{meta.reference}</span>
                </span>
              )}
              {docUrl && (
                <a className={css.docMetaLink} href={docUrl} target="_blank" rel="noopener noreferrer">
                  <FilePdfOutlined /> เอกสารต้นฉบับ
                </a>
              )}
            </div>
          )}

          <AboutSectionHead title={sectionTitle(items.length)} />

          {/* ใช้ <ol> เพราะข้อพวกนี้เป็นรายการมีลำดับจริง
              ผู้ใช้โปรแกรมอ่านหน้าจอจะได้ยินว่าอยู่ข้อที่เท่าไรจากทั้งหมด */}
          <ol
            role="list"
            className={`${css.list} ${listLayout === "grid" ? css.listGrid : css.listSingle}`}
          >
            {items.map((item, i) => {
              const Icon = pickGovernanceIcon(`${item.title ?? ""} ${item.text}`);
              const itemTitle = item.title?.trim();
              return (
                <li
                  key={item.id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={css.card}
                  style={{ transitionDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  {/* เลขข้อตัวใหญ่แบบเส้นทอง — ตกแต่ง ลำดับจริงสื่อผ่าน <ol> แล้ว */}
                  <span className={css.cardNum} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className={css.cardInner}>
                    <span className={css.cardIcon} aria-hidden="true">
                      <Icon size={24} strokeWidth={1.8} />
                    </span>
                    <div className={css.cardBody}>
                      {itemTitle && <h3 className={css.cardTitle}>{itemTitle}</h3>}
                      {/* ข้อความใน DB มี \n เป็นการตัดบรรทัดของเอกสารต้นฉบับ
                          ปล่อยให้ HTML ยุบเป็นช่องว่าง เพื่อให้ไหลตามความกว้างการ์ดเอง */}
                      <p className={css.cardText}>{item.text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* ช่องทางร้องเรียน — หน้าจรรยาบรรณ/นโยบายที่ไม่บอกว่า
              "ถ้าไม่ได้รับการปฏิบัติตามนี้ ทำอย่างไร" ถือว่าเล่าเรื่องไม่จบ */}
          <div className={css.cta}>
            <div className={css.ctaIcon} aria-hidden="true">
              <NotificationOutlined />
            </div>
            <div className={css.ctaBody}>
              <h2 className={css.ctaTitle}>ไม่ได้รับการปฏิบัติตามนี้?</h2>
              <p className={css.ctaText}>{ctaText}</p>
            </div>
            <Link href="/complaints" className={css.ctaBtn}>
              แจ้งเรื่องร้องเรียน <ArrowRightOutlined />
            </Link>
          </div>
        </>
      ) : (
        <AboutEmpty icon={emptyIcon} text={emptyText} />
      )}
    </AboutPageShell>
  );
}
