"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  FileText,
  ChevronRight,
  Home,
  SearchX,
  Download,
} from "lucide-react";
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

  const formGroupKey = data?.formGroup ? FORM_GROUP_KEY_MAP[data.formGroup] : null;
  const hasLinks = links.length > 0;
  const hasSidebar = !!formGroupKey || hasLinks;

  if (loading) {
    return (
      <div className={css.pageWrapper}>
        <div className={css.hero}>
          <div className={css.heroBgPattern}></div>
          <div className={css.blob1}></div>
          <div className={css.blob2}></div>
          <div className={css.blob3}></div>
          <div className={css.heroContent}>
            <div className={css.breadcrumb}>
              <Link href="/"><Home size={14} /></Link>
              <span>/</span>
              <span>บริการ</span>
            </div>
            <h1 className={css.heroTitle}>กำลังโหลด...</h1>
            <p className={css.heroSub}>กรุณารอสักครู่</p>
          </div>
        </div>
        <div className={css.content}>
          <div className={css.loading}>
            <Loader2 className={css.spinner} />
            <br />
            กำลังโหลดข้อมูล...
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className={css.pageWrapper}>
        <div className={css.hero}>
          <div className={css.heroBgPattern}></div>
          <div className={css.blob1}></div>
          <div className={css.blob2}></div>
          <div className={css.blob3}></div>
          <div className={css.heroContent}>
            <div className={css.breadcrumb}>
              <Link href="/"><Home size={14} /></Link>
              <span>/</span>
              <span>บริการ</span>
            </div>
            <h1 className={css.heroTitle}>ไม่พบหน้าที่ต้องการ</h1>
            <p className={css.heroSub}>ไม่สามารถดึงข้อมูลบริการนี้ได้</p>
          </div>
        </div>
        <div className={css.content}>
          <div className={css.notFound}>
            <div className={css.notFoundIcon}><SearchX size={48} /></div>
            <h2 className={css.notFoundTitle}>ไม่พบหน้าบริการนี้</h2>
            <p className={css.notFoundText}>หน้าที่คุณต้องการอาจถูกย้ายหรือยังไม่เปิดให้บริการ</p>
            <Link href="/" className={css.backLink}>
              <Home size={16} /> กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={css.pageWrapper}>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroBgPattern}></div>
        <div className={css.blob1}></div>
        <div className={css.blob2}></div>
        <div className={css.blob3}></div>
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
        <div className={hasSidebar ? css.twoCol : css.singleCol}>
          {/* Infographic */}
          {data.infographicUrl && (
            <div className={css.infographicWrapper}>
              <div className={css.infographicCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.infographicUrl}
                  alt={data.title}
                  className={css.infographicImage}
                />
              </div>
            </div>
          )}

          {/* Sidebar */}
          {hasSidebar && (
            <div className={css.sidebar}>
              {/* Form group card — Premium Dark Glassmorphism */}
              {formGroupKey && (
                <div className={css.formCard}>
                  <div className={css.formCardPattern}></div>
                  <div className={css.formCardInner}>
                    <div className={css.formCardHeader}>
                      <div className={css.formCardBadge}>
                        <Download size={26} className={css.formCardIcon} />
                      </div>
                      <div className={css.formCardTitleWrapper}>
                        <h3 className={css.formCardHeading}>แบบฟอร์มบริการ</h3>
                        <p className={css.formCardDesc}>เอกสารสําหรับ {data.title}</p>
                      </div>
                    </div>
                    <Link href={`/forms?group=${formGroupKey}`} className={css.formCardBtn}>
                      <div className={css.btnIcon}>
                        <FileText size={20} />
                      </div>
                      <span className={css.btnText}>{data.formGroup}</span>
                      <div className={css.btnArrow}>
                        <ChevronRight size={18} />
                      </div>
                    </Link>
                    <Link href="/forms" className={css.formCardAll}>
                      ดูแบบฟอร์มทั้งหมด <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Manual download links */}
              {hasLinks && (
                <div className={css.downloadsSection}>
                  <div className={css.downloadsHeader}>
                    <div className={css.downloadsIconWrapper}>
                      <FileText size={18} className={css.downloadsSectionIcon} />
                    </div>
                    <h2 className={css.downloadsSectionTitle}>เอกสารที่เกี่ยวข้อง</h2>
                  </div>
                  <ul className={css.downloadsList}>
                    {links.map((link, idx) => (
                      <li key={idx} style={{ animationDelay: `${idx * 0.05}s` }} className={css.downloadListItem}>
                        <a
                          href={link.url}
                          target={link.url.startsWith("/") && !link.url.includes(".") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          className={css.downloadItem}
                        >
                          <div className={css.downloadIcon}>
                            <FileText size={16} />
                          </div>
                          <span className={css.downloadLabel}>{link.label}</span>
                          <div className={css.downloadArrow}>
                            <ChevronRight size={16} />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
