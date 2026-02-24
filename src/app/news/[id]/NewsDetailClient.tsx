"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarOutlined, EyeOutlined, ArrowLeftOutlined, FilePdfOutlined,
  ShareAltOutlined, FacebookOutlined, LinkOutlined, CheckOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { categoryMap, type NewsData } from "@/data/mockNews";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import css from "./page.module.css";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function formatViews(count: number) {
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return count.toString();
}

export default function NewsDetailClient() {
  const params = useParams();
  const [news, setNews] = useState<NewsData | null>(null);
  const [related, setRelated] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/news/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setNews(data);
        // Fetch related news
        fetch(`/api/news?related=${params.id}`)
          .then((r) => r.json())
          .then((items) => {
            if (Array.isArray(items)) setRelated(items);
          })
          .catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const handleShareFB = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  }, [shareUrl]);

  const handleShareLine = useCallback(() => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  }, [shareUrl]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={css.page}>
        <div className={css.inner}>
          <div className={css.skelBreadcrumb} />
          <div className={css.skelHeaderCard}>
            <div className={css.skelTag} />
            <div className={css.skelTitleLine} />
            <div className={css.skelTitleLine} style={{ width: "60%" }} />
            <div className={css.skelMetaRow}>
              <div className={css.skelMetaItem} />
              <div className={css.skelMetaItem} />
            </div>
          </div>
          <div className={css.skelContent}>
            <div className={css.skelContentLine} />
            <div className={css.skelContentLine} style={{ width: "90%" }} />
            <div className={css.skelContentLine} style={{ width: "75%" }} />
            <div className={css.skelContentLine} style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={css.page}>
        <div className={css.inner}>
          <div className={css.errorWrap}>
            <h2 className={css.errorTitle}>ไม่พบข่าวที่ต้องการ</h2>
            <p className={css.errorText}>ข่าวนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
            <Link href="/news" className={css.backBtn}>
              <ArrowLeftOutlined /> กลับหน้าข่าวทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const catInfo = categoryMap[news.category];
  const isHtml = news.details?.includes("<") ?? false;

  return (
    <div className={css.page}>
      <div className={css.inner}>
        {/* Breadcrumb */}
        <nav className={css.breadcrumb}>
          <Link href="/" className={css.breadcrumbLink}>หน้าแรก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <Link href="/news" className={css.breadcrumbLink}>ข่าวประชาสัมพันธ์</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>{news.title || "รายละเอียดข่าว"}</span>
        </nav>

        {/* Header card */}
        <div className={css.headerCard}>
          <div className={css.headerTop}>
            {catInfo && (
              <span className={css.tag} style={{ background: catInfo.color }}>
                {catInfo.label}
              </span>
            )}
            <h1 className={css.title}>{news.title}</h1>
          </div>
          <div className={css.headerBottom}>
            <div className={css.meta}>
              <span><CalendarOutlined /> {formatDate(news.createdAt)}</span>
              <span><EyeOutlined /> {formatViews(news.viewCount)} ครั้ง</span>
            </div>
            <div className={css.headerActions}>
              {news.pdfPath && (
                <a
                  href={news.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.pdfBtn}
                >
                  <FilePdfOutlined /> ดาวน์โหลด PDF
                </a>
              )}
              {/* Share buttons */}
              <div className={css.shareGroup}>
                <span className={css.shareLabel}><ShareAltOutlined /> แชร์</span>
                <button className={`${css.shareBtn} ${css.shareFb}`} onClick={handleShareFB} title="แชร์ Facebook">
                  <FacebookOutlined />
                </button>
                <button className={`${css.shareBtn} ${css.shareLine}`} onClick={handleShareLine} title="แชร์ Line">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 5.83 2 10.5c0 4.18 3.58 7.68 8.44 8.36.33.07.77.22.89.5.1.26.07.66.03.92l-.14.87c-.04.26-.2 1.02.89.56.55-.24 2.97-1.75 4.05-2.99C18.6 16.84 22 13.96 22 10.5 22 5.83 17.52 2 12 2z"/></svg>
                </button>
                <button
                  className={`${css.shareBtn} ${css.shareLink} ${copied ? css.shareCopied : ""}`}
                  onClick={handleCopyLink}
                  title="คัดลอกลิงก์"
                >
                  {copied ? <CheckOutlined /> : <LinkOutlined />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* เนื้อหาหลัก */}
        {news.pdfPath ? (
          <>
            <div className={css.pdfViewer}>
              <iframe
                src={news.pdfPath}
                title={news.title || "เอกสาร PDF"}
                className={css.pdfIframe}
              />
            </div>
            {news.details && (
              <div className={css.detailCard}>
                <h3 className={css.detailHeading}>รายละเอียด</h3>
                {isHtml ? (
                  <div className={css.content} dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.details) }} />
                ) : (
                  <div className={css.content}>
                    {news.details.split("\n").map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <article className={css.article}>
            {news.imagePath && (
              <div className={css.imageWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={news.imagePath} alt={news.title || "ข่าว"} className={css.image} />
              </div>
            )}
            {news.details && (
              isHtml ? (
                <div className={css.content} dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.details) }} />
              ) : (
                <div className={css.content}>
                  {news.details.split("\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )
            )}
          </article>
        )}

        {/* Related news */}
        {related.length > 0 && (
          <div className={css.relatedSection}>
            <h3 className={css.relatedHeading}>ข่าวที่เกี่ยวข้อง</h3>
            <div className={css.relatedGrid}>
              {related.map((item) => (
                <a href={`/news/${item.id}`} key={item.id} className={css.relatedCard}>
                  <div className={css.relatedThumb}>
                    {item.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imagePath} alt={item.title || "ข่าว"} className={css.relatedImg} />
                    ) : (
                      <div className={css.relatedPlaceholder} />
                    )}
                  </div>
                  <div className={css.relatedBody}>
                    <h4 className={css.relatedTitle}>{item.title || "ไม่มีหัวข้อ"}</h4>
                    <span className={css.relatedDate}>
                      <CalendarOutlined /> {formatDate(item.createdAt)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className={css.backWrap}>
          <Link href="/news" className={css.backLink}>
            <ArrowLeftOutlined /> กลับหน้าข่าวทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}
