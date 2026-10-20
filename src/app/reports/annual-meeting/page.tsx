"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Download, Eye, FileText, FolderOpen, Home, Search, X } from "lucide-react";
import { getPdfCoverDataUrl } from "@/lib/pdfCover";
import css from "./page.module.css";

interface DocItem {
  id: number;
  year: number;
  title: string;
  fileUrl: string;
  coverUrl: string | null;
  category: string;
  description: string | null;
  fileSize: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  agenda: "ระเบียบวาระ",
  financial: "งบการเงิน",
  plan: "แผนงาน",
  report: "รายงาน",
};

function formatSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const fileExt = (url: string) => url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "pdf";

/** ภาพหน้าปกเอกสาร — ใช้ภาพปกที่อัปโหลด (ย่อขนาดให้อัตโนมัติ) ถ้าไม่มีใช้หน้าแรกของ PDF */
function DocThumb({ doc }: { doc: DocItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [pdfCover, setPdfCover] = useState<string | null>(null);

  const isPdf = fileExt(doc.fileUrl) === "pdf";
  const needPdfCover = isPdf && (!doc.coverUrl || imgFailed);

  useEffect(() => {
    const el = ref.current;
    if (!needPdfCover || !el) return;

    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        getPdfCoverDataUrl(doc.fileUrl)
          .then((url) => {
            if (!cancelled) setPdfCover(url);
          })
          .catch(() => { /* คงไอคอนเอกสารไว้ */ });
      },
      { rootMargin: "200px" }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [needPdfCover, doc.fileUrl]);

  return (
    <div ref={ref} className={css.thumb}>
      {doc.coverUrl && !imgFailed ? (
        <Image
          src={doc.coverUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 84px, 112px"
          className={css.thumbImg}
          onError={() => setImgFailed(true)}
        />
      ) : pdfCover ? (
        <img src={pdfCover} alt="" className={css.thumbImg} />
      ) : (
        <div className={css.thumbFallback}>
          <FileText size={30} />
        </div>
      )}
      <span className={css.thumbType}>{fileExt(doc.fileUrl).toUpperCase()}</span>
    </div>
  );
}

export default function AnnualMeetingPage() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meeting-documents");
        if (res.ok) setItems(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const years = useMemo(() => [...new Set(items.map((d) => d.year))], [items]);
  const latestYear = years[0];

  // จัดกลุ่มตามปี (ข้อมูลเรียงปีล่าสุดก่อนมาจาก API แล้ว)
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (d) =>
        (year === null || d.year === year) &&
        (!q ||
          d.title.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q) ||
          String(d.year).includes(q))
    );
    const byYear = new Map<number, DocItem[]>();
    for (const d of filtered) byYear.set(d.year, [...(byYear.get(d.year) ?? []), d]);
    return [...byYear.entries()];
  }, [items, year, query]);

  const showFilters = items.length > 1;

  return (
    <>
      {/* ── Hero ── */}
      <section className={css.hero}>
        <div className={css.heroGlow} />
        <div className={css.heroInner}>
          <nav className={css.breadcrumb} aria-label="breadcrumb">
            <Link href="/" aria-label="หน้าหลัก">
              <Home size={15} />
            </Link>
            <ChevronRight size={14} />
            <span className={css.breadcrumbActive}>เอกสารประกอบการประชุมใหญ่</span>
          </nav>
          <h1 className={css.heroTitle}>เอกสารประกอบการประชุมใหญ่</h1>
          <p className={css.heroSub}>
            เอกสารประกอบการประชุมใหญ่สามัญประจำปี สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
            เปิดอ่านบนหน้าจอหรือดาวน์โหลดเก็บไว้ได้
          </p>
          {items.length > 0 && (
            <div className={css.heroChips}>
              <span className={css.heroChip}>
                <FileText size={15} /> ทั้งหมด {items.length} ฉบับ
              </span>
              <span className={css.heroChip}>
                {years.length > 1
                  ? `พ.ศ. ${years[years.length - 1]} – ${latestYear}`
                  : `พ.ศ. ${latestYear}`}
              </span>
            </div>
          )}
        </div>
      </section>

      <main className={css.main}>
        {/* ── ค้นหา + เลือกปี ── */}
        {showFilters && (
          <div className={css.toolbar}>
            <div className={css.years} role="group" aria-label="เลือกปี">
              <button
                type="button"
                className={`${css.yearChip} ${year === null ? css.yearChipActive : ""}`}
                aria-pressed={year === null}
                onClick={() => setYear(null)}
              >
                ทุกปี
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`${css.yearChip} ${year === y ? css.yearChipActive : ""}`}
                  aria-pressed={year === y}
                  onClick={() => setYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>

            <label className={css.search}>
              <Search size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อเอกสาร"
                aria-label="ค้นหาชื่อเอกสาร"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้นหา">
                  <X size={16} />
                </button>
              )}
            </label>
          </div>
        )}

        {loading ? (
          <div className={css.list} aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={css.skeleton} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={css.empty}>
            <FolderOpen size={56} />
            <h2>ยังไม่มีเอกสารประกอบการประชุม</h2>
            <p>เมื่อมีการเผยแพร่เอกสาร จะแสดงที่หน้านี้</p>
          </div>
        ) : groups.length === 0 ? (
          <div className={css.empty}>
            <Search size={48} />
            <h2>ไม่พบเอกสารที่ค้นหา</h2>
            <p>ลองใช้คำค้นอื่น หรือเลือกดูทุกปี</p>
            <button
              type="button"
              className={css.resetBtn}
              onClick={() => {
                setQuery("");
                setYear(null);
              }}
            >
              ดูเอกสารทั้งหมด
            </button>
          </div>
        ) : (
          groups.map(([groupYear, docs]) => (
            <section key={groupYear} className={css.group}>
              <div className={css.groupHead}>
                <h2 className={css.groupTitle}>ประจำปี {groupYear}</h2>
                {groupYear === latestYear && <span className={css.latestBadge}>ล่าสุด</span>}
                <span className={css.groupLine} />
                <span className={css.groupCount}>{docs.length} ฉบับ</span>
              </div>

              <ul className={css.list}>
                {docs.map((doc) => {
                  const size = formatSize(doc.fileSize);
                  const ext = fileExt(doc.fileUrl);
                  const category = CATEGORY_LABELS[doc.category];
                  return (
                    <li key={doc.id} className={css.doc}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={css.thumbLink}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <DocThumb doc={doc} />
                      </a>

                      <div className={css.docBody}>
                        <h3 className={css.docTitle}>{doc.title}</h3>
                        {doc.description && <p className={css.docDesc}>{doc.description}</p>}
                        <div className={css.docMeta}>
                          {category && <span className={css.docCategory}>{category}</span>}
                          <span>
                            ไฟล์ {ext.toUpperCase()}
                            {size && ` · ${size}`}
                          </span>
                        </div>

                        <div className={css.docActions}>
                          <a
                            href={doc.fileUrl}
                            download={`${doc.title}.${ext}`}
                            className={css.downloadBtn}
                          >
                            <Download size={18} /> ดาวน์โหลด
                          </a>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css.viewBtn}
                          >
                            <Eye size={18} /> เปิดอ่าน
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}
