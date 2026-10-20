"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Download, Home, Library } from "lucide-react";
import Book from "./Book";
import css from "./page.module.css";

interface ReportItem {
  id: number;
  year: number;
  title: string;
  coverUrl: string | null;
  fileUrl: string;
  description: string | null;
}

export default function AnnualReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/annual-reports");
        if (res.ok) setItems(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const latest = items[0];
  const older = items.slice(1);
  const oldestYear = items.length > 0 ? items[items.length - 1].year : null;

  return (
    <>
      {/* ── Hero + ฉบับล่าสุด ── */}
      <section className={css.hero}>
        <div className={css.heroGlow} />
        <div className={css.heroInner}>
          <div className={css.heroText}>
            <nav className={css.breadcrumb} aria-label="breadcrumb">
              <Link href="/" aria-label="หน้าหลัก">
                <Home size={15} />
              </Link>
              <ChevronRight size={14} />
              <span className={css.breadcrumbActive}>รายงานประจำปี</span>
            </nav>

            <h1 className={css.heroTitle}>รายงานประจำปี</h1>
            <p className={css.heroSub}>
              ผลการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด เปิดอ่านได้ทันทีแบบ eBook
              พลิกหน้าได้เหมือนหนังสือจริง
            </p>

            {latest && (
              <div className={css.latest}>
                <span className={css.latestBadge}>ฉบับล่าสุด · พ.ศ. {latest.year}</span>
                <h2 className={css.latestTitle}>{latest.title}</h2>
                {latest.description && <p className={css.latestDesc}>{latest.description}</p>}
                <div className={css.latestActions}>
                  <Link href={`/annual-reports/${latest.id}`} className={css.primaryBtn}>
                    <BookOpen size={19} /> เปิดอ่าน eBook
                  </Link>
                  <a
                    href={latest.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css.ghostBtn}
                  >
                    <Download size={18} /> ดาวน์โหลด PDF
                  </a>
                </div>
              </div>
            )}

            {items.length > 1 && (
              <div className={css.heroChips}>
                <span className={css.heroChip}>
                  <Library size={15} /> ทั้งหมด {items.length} ฉบับ
                </span>
                <span className={css.heroChip}>
                  พ.ศ. {oldestYear} – {latest.year}
                </span>
              </div>
            )}
          </div>

          {latest && (
            <Link
              href={`/annual-reports/${latest.id}`}
              className={css.heroBook}
              aria-label={`เปิดอ่าน ${latest.title}`}
            >
              <Book
                year={latest.year}
                title={latest.title}
                coverUrl={latest.coverUrl}
                fileUrl={latest.fileUrl}
              />
            </Link>
          )}
        </div>
      </section>

      {/* ── ชั้นหนังสือ ── */}
      <main className={css.main}>
        {loading ? (
          <div className={css.grid} aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={css.skeletonCard}>
                <div className={css.skeletonBook} />
                <div className={css.skeletonLine} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={css.empty}>
            <BookOpen size={56} />
            <h2>ยังไม่มีรายงานประจำปี</h2>
            <p>เมื่อมีการเผยแพร่รายงาน จะแสดงที่หน้านี้</p>
          </div>
        ) : older.length > 0 ? (
          <>
            <div className={css.sectionHead}>
              <h2 className={css.sectionTitle}>
                <Library size={22} /> รายงานย้อนหลัง
              </h2>
              <span className={css.sectionCount}>{older.length} ฉบับ</span>
            </div>

            <div className={css.grid}>
              {older.map((item) => (
                <Link key={item.id} href={`/annual-reports/${item.id}`} className={css.card}>
                  <div className={css.cardBook}>
                    <Book
                      year={item.year}
                      title={item.title}
                      coverUrl={item.coverUrl}
                      fileUrl={item.fileUrl}
                    />
                  </div>
                  <div className={css.cardInfo}>
                    <span className={css.cardYear}>พ.ศ. {item.year}</span>
                    <h3 className={css.cardTitle}>{item.title}</h3>
                    {item.description && <p className={css.cardDesc}>{item.description}</p>}
                    <span className={css.cardRead}>
                      เปิดอ่าน <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
