/* eslint-disable @next/next/no-img-element -- ปกเป็น data URL ที่สร้างจาก PDF ในเบราว์เซอร์ ใช้ next/image ไม่ได้ */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { getPdfCoverDataUrl } from "@/lib/pdfCover";

/**
 * ภาพปกเล็กจากหน้าแรกของ PDF — สร้างเมื่อเลื่อนมาเห็นเท่านั้น (รายการยาวไม่ต้องโหลด PDF ทุกไฟล์พร้อมกัน)
 * มีรูปปกที่อัปโหลดไว้ (image) ใช้รูปนั้นแทน
 */
export default function PdfThumb({ pdf, image, className, iconSize = 20 }: { pdf?: string | null; image?: string | null; className?: string; iconSize?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState<{ url: string; src: string } | null>(null);
  const pdfUrl = !image && pdf?.toLowerCase().endsWith(".pdf") ? pdf : null;

  useEffect(() => {
    if (!pdfUrl || !ref.current) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        getPdfCoverDataUrl(pdfUrl)
          .then((src) => !cancelled && setRendered({ url: pdfUrl, src }))
          .catch(() => {});
      },
      { rootMargin: "300px" }
    );
    io.observe(ref.current);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [pdfUrl]);

  const src = image || (rendered && rendered.url === pdfUrl ? rendered.src : null);
  return (
    <div ref={ref} className={className} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <FileText size={iconSize} />}
    </div>
  );
}
