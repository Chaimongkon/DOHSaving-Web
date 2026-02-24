"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, ClipboardList, FolderOpen, Calendar } from "lucide-react";
import css from "./page.module.css";

interface DocItem {
  id: number;
  year: number;
  title: string;
  fileUrl: string;
  coverUrl: string | null;
  description: string | null;
}

export default function AnnualMeetingPage() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meeting-documents");
        if (res.ok) setItems(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <div className={css.hero}>
        <div className={css.heroIcon}>
          <ClipboardList size={28} />
        </div>
        <h1 className={css.heroTitle}>เอกสารประกอบการประชุม</h1>
        <p className={css.heroSub}>
          เอกสารประกอบการประชุมใหญ่สามัญประจำปี<br />
          สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
        </p>
      </div>

      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className={css.empty}>
            <FolderOpen size={56} />
            <p>ยังไม่มีเอกสารประกอบการประชุม</p>
          </div>
        ) : (
          <div className={css.timeline}>
            {items.map((doc, idx) => (
              <div key={doc.id} className={css.timelineItem}>
                {/* Timeline connector */}
                <div className={css.timelineLine}>
                  <div className={css.timelineDot}>
                    <Calendar size={14} />
                  </div>
                  {idx < items.length - 1 && <div className={css.timelineBar} />}
                </div>

                {/* Card */}
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.docCard}
                >
                  <div className={css.yearBadge}>พ.ศ. {doc.year}</div>

                  {doc.coverUrl ? (
                    <div className={css.coverWrap}>
                      <img src={doc.coverUrl} alt={doc.title} className={css.coverImg} />
                    </div>
                  ) : (
                    <div className={css.iconWrap}>
                      <FileText size={22} />
                      <span>PDF</span>
                    </div>
                  )}

                  <div className={css.cardInfo}>
                    <h3 className={css.docTitle}>{doc.title}</h3>
                    {doc.description && <p className={css.docDesc}>{doc.description}</p>}
                  </div>

                  <div className={css.downloadBtn}>
                    <Download size={14} />
                    <span>ดาวน์โหลด</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
