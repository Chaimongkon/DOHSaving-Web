"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPdfCoverDataUrl } from "@/lib/pdfCover";
import css from "./page.module.css";

interface BookProps {
  year: number;
  title: string;
  coverUrl: string | null;
  fileUrl: string;
  className?: string;
}

/** หนังสือ 3 มิติ — ใช้ภาพปกที่อัปโหลด ถ้าไม่มีจะดึงหน้าแรกของ PDF มาเป็นปก */
export default function Book({ year, title, coverUrl, fileUrl, className }: BookProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [pdfCover, setPdfCover] = useState<string | null>(null);

  const needPdfCover = !coverUrl || imgFailed;

  useEffect(() => {
    const el = ref.current;
    if (!needPdfCover || !fileUrl || !el) return;

    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        getPdfCoverDataUrl(fileUrl)
          .then((url) => {
            if (!cancelled) setPdfCover(url);
          })
          .catch(() => { /* คงปกสำรองไว้ */ });
      },
      { rootMargin: "200px" }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [needPdfCover, fileUrl]);

  const src = needPdfCover ? pdfCover : coverUrl;

  return (
    <div ref={ref} className={`${css.book} ${className ?? ""}`}>
      <div className={css.bookBody}>
        <div className={css.bookBack} />
        <div className={css.bookPages} />
        <div className={css.bookFront}>
          {src ? (
            <img
              src={src}
              alt={`ปก${title}`}
              className={css.coverImage}
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className={css.coverFallback}>
              <span className={css.coverFallbackLabel}>รายงานประจำปี</span>
              <span className={css.coverFallbackYear}>{year}</span>
              <span className={css.coverFallbackOrg}>
                สหกรณ์ออมทรัพย์
                <br />
                กรมทางหลวง จำกัด
              </span>
            </div>
          )}
          <span className={css.bookCrease} />
          <span className={css.bookGloss} />
        </div>
      </div>
      <div className={css.bookShadow} />
    </div>
  );
}
