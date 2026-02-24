"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Calendar } from "lucide-react";
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

  return (
    <>
      <div className={css.hero}>
        <h1 className={css.heroTitle}>รายงานประจำปี</h1>
        <p className={css.heroSub}>เปิดอ่านรายงานประจำปีในรูปแบบ eBook สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
      </div>

      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className={css.empty}>
            <BookOpen size={64} />
            <p>ยังไม่มีรายงานประจำปี</p>
          </div>
        ) : (
          <div className={css.grid}>
            {items.map((item) => (
              <Link key={item.id} href={`/annual-reports/${item.id}`} className={css.card}>
                <div className={css.bookWrap}>
                  {/* Front Cover */}
                  <div className={css.coverFront}>
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt={item.title} className={css.coverImage} />
                    ) : (
                      <div className={css.coverPlaceholder}>
                        <BookOpen size={48} />
                        <p style={{ fontSize: 11, marginTop: 6 }}>รายงานประจำปี</p>
                        <p style={{ fontSize: 28, fontWeight: 700, marginTop: 2 }}>{item.year}</p>
                      </div>
                    )}
                  </div>
                  {/* Stacked pages behind */}
                  <div className={css.pageEdges} />
                  {/* Spine shadow */}
                  <div className={css.spine} />
                </div>
                <div className={css.info}>
                  <span className={css.year}>
                    <Calendar size={12} /> พ.ศ. {item.year}
                  </span>
                  <h3 className={css.title}>{item.title}</h3>
                  {item.description && <p className={css.description}>{item.description}</p>}
                  <div className={css.readBtn}>
                    <BookOpen size={14} /> เปิดอ่าน eBook
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
