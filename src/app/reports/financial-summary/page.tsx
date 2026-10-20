"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Home,
  Landmark,
  PiggyBank,
  Scale,
  Wallet,
  X,
} from "lucide-react";
import { getPdfCoverDataUrl } from "@/lib/pdfCover";
import css from "./page.module.css";

const MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

interface FinItem {
  id: number;
  year: number;
  month: number;
  title: string | null;
  fileUrl: string | null;
  totalAssets: string | null;
  totalLiabilities: string | null;
  totalEquity: string | null;
  totalMembers: number | null;
}

interface YearData {
  year: number | null;
  items: FinItem[];
}

/** วันสุดท้ายของเดือน (ปี พ.ศ.) — รายการย่อแสดงฐานะ ณ วันสิ้นเดือน */
const lastDayOf = (month: number, yearBE: number) => new Date(yearBE - 543, month, 0).getDate();

const asOfLabel = (item: Pick<FinItem, "month" | "year">) =>
  `ณ วันที่ ${lastDayOf(item.month, item.year)} ${MONTHS_FULL[item.month - 1]} ${item.year}`;

const toNumber = (v: string | null) => {
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const formatMillion = (n: number) =>
  (n / 1_000_000).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatBaht = (n: number) =>
  `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;

const isPdf = (url: string) => url.split(/[?#]/)[0].toLowerCase().endsWith(".pdf");

/** ภาพตัวอย่างหน้าแรกของรายงาน */
function ReportPreview({ fileUrl }: { fileUrl: string }) {
  // เก็บคู่กับ url — เปลี่ยนปีแล้วภาพของไฟล์เก่าจะไม่ค้างแสดง
  const [preview, setPreview] = useState<{ url: string; src: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isPdf(fileUrl)) {
      getPdfCoverDataUrl(fileUrl)
        .then((src) => {
          if (!cancelled) setPreview({ url: fileUrl, src });
        })
        .catch(() => { /* คงไอคอนเอกสารไว้ */ });
    }
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  const src = isPdf(fileUrl) ? (preview?.url === fileUrl ? preview.src : null) : fileUrl;

  return src ? (
    <img src={src} alt="" className={css.previewImg} />
  ) : (
    <div className={css.previewFallback}>
      <FileText size={44} strokeWidth={1.4} />
      <span>รายการย่อ</span>
    </div>
  );
}

/** สมการบัญชี: สินทรัพย์ = หนี้สิน + ทุน — แสดงเป็นตัวเลขและแถบสัดส่วนเมื่อมีข้อมูลยอดรวม */
function BalanceFigures({ item }: { item: FinItem }) {
  const assets = toNumber(item.totalAssets);
  const liabilities = toNumber(item.totalLiabilities);
  const equity = toNumber(item.totalEquity);
  if (assets === null && liabilities === null && equity === null) return null;

  const tiles = [
    { key: "assets", label: "สินทรัพย์รวม", value: assets, dot: css.dotAssets },
    { key: "liabilities", label: "หนี้สินรวม", value: liabilities, dot: css.dotLiabilities },
    { key: "equity", label: "ทุนของสหกรณ์", value: equity, dot: css.dotEquity },
  ].filter((t) => t.value !== null) as { key: string; label: string; value: number; dot: string }[];

  const sum = (liabilities ?? 0) + (equity ?? 0);
  const liabPct = liabilities !== null && equity !== null ? (liabilities / sum) * 100 : null;

  return (
    <div className={css.figures}>
      <div className={css.figureTiles}>
        {tiles.map((t) => (
          <div key={t.key} className={css.figureTile} title={formatBaht(t.value)}>
            <span className={css.figureLabel}>
              <i className={t.dot} /> {t.label}
            </span>
            <span className={css.figureValue}>
              {formatMillion(t.value)} <small>ล้านบาท</small>
            </span>
          </div>
        ))}
      </div>

      {liabPct !== null && (
        <div className={css.split}>
          <div
            className={css.splitBar}
            role="img"
            aria-label={`หนี้สิน ${liabPct.toFixed(1)}% ทุนของสหกรณ์ ${(100 - liabPct).toFixed(1)}%`}
          >
            <span
              className={css.splitLiabilities}
              style={{ width: `${liabPct}%` }}
              title={`หนี้สินรวม ${formatBaht(liabilities!)}`}
            />
            <span className={css.splitEquity} title={`ทุนของสหกรณ์ ${formatBaht(equity!)}`} />
          </div>
          <div className={css.splitLegend}>
            <span>
              <i className={css.dotLiabilities} /> หนี้สิน {liabPct.toFixed(1)}%
            </span>
            <span>
              <i className={css.dotEquity} /> ทุน {(100 - liabPct).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancialSummaryPage() {
  const [years, setYears] = useState<number[]>([]);
  // null = ให้ API เลือกปีล่าสุดที่มีข้อมูล
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<YearData | null>(null);
  const [viewing, setViewing] = useState<FinItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: YearData = { year: selectedYear, items: [] };
      try {
        const res = await fetch(`/api/financial-summary${selectedYear ? `?year=${selectedYear}` : ""}`);
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          if (json.years?.length) setYears(json.years);
          next = { year: json.selectedYear ?? selectedYear, items: json.items || [] };
        }
      } catch { /* fallback empty */ }
      if (!cancelled) setData(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // ปิดหน้าต่างรายงานด้วย Esc + ล็อกการเลื่อนพื้นหลัง
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewing(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewing]);

  const loading = data === null || (selectedYear !== null && data.year !== selectedYear);
  const activeYear = selectedYear ?? data?.year ?? null;
  const items = loading ? [] : data.items;
  const byMonth = new Map(items.map((i) => [i.month, i]));
  const published = items.filter((i) => i.fileUrl);
  const latest = published.length ? published[published.length - 1] : null;

  // จอเล็กแสดง PDF ในหน้าต่างซ้อนไม่ได้ดี — เปิดแท็บใหม่ให้ตัวอ่านของเครื่องจัดการ
  const openReport = (item: FinItem) => {
    if (!item.fileUrl) return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      window.open(item.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      setViewing(item);
    }
  };

  const downloadName = (item: FinItem) =>
    `รายการย่อแสดงสินทรัพย์และหนี้สิน ${MONTHS_FULL[item.month - 1]} ${item.year}`;

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
            <span className={css.breadcrumbActive}>รายการย่อแสดงสินทรัพย์และหนี้สิน</span>
          </nav>
          <h1 className={css.heroTitle}>รายการย่อแสดงสินทรัพย์และหนี้สิน</h1>
          <p className={css.heroSub}>
            ฐานะการเงินของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ณ วันสิ้นเดือน เผยแพร่ให้สมาชิกตรวจสอบได้ทุกเดือน
          </p>

          {/* สมการบัญชี — บอกว่าเอกสารนี้แสดงอะไร */}
          <div className={css.equation} aria-label="สินทรัพย์ เท่ากับ หนี้สิน บวก ทุนของสหกรณ์">
            <span className={css.eqTerm}>
              <Wallet size={18} /> สินทรัพย์
            </span>
            <span className={css.eqOp}>=</span>
            <span className={css.eqTerm}>
              <Landmark size={18} /> หนี้สิน
            </span>
            <span className={css.eqOp}>+</span>
            <span className={css.eqTerm}>
              <PiggyBank size={18} /> ทุนของสหกรณ์
            </span>
          </div>
        </div>
      </section>

      <main className={css.main}>
        {/* ── เลือกปี ── */}
        <div className={css.toolbar}>
          <div className={css.years} role="group" aria-label="เลือกปี พ.ศ.">
            <span className={css.yearsLabel}>ปี พ.ศ.</span>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                className={`${css.yearChip} ${y === activeYear ? css.yearChipActive : ""}`}
                aria-pressed={y === activeYear}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
          {!loading && activeYear && (
            <span className={css.progress}>
              เผยแพร่แล้ว <strong>{published.length}</strong> จาก 12 เดือน
            </span>
          )}
        </div>

        {loading ? (
          <>
            <div className={`${css.skeleton} ${css.skeletonFeatured}`} />
            <div className={css.monthGrid}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={`${css.skeleton} ${css.skeletonMonth}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* ── ฉบับล่าสุดของปีที่เลือก ── */}
            {latest ? (
              <section className={css.featured}>
                <div className={css.featuredBody}>
                  <span className={css.featuredBadge}>ฉบับล่าสุดของปี {latest.year}</span>
                  <h2 className={css.featuredTitle}>
                    ประจำเดือน{MONTHS_FULL[latest.month - 1]} {latest.year}
                  </h2>
                  <p className={css.featuredAsOf}>
                    <Scale size={17} /> แสดงฐานะการเงิน {asOfLabel(latest)}
                  </p>

                  <BalanceFigures item={latest} />

                  <div className={css.featuredActions}>
                    <button type="button" className={css.primaryBtn} onClick={() => openReport(latest)}>
                      <Eye size={19} /> เปิดดูรายงาน
                    </button>
                    <a href={latest.fileUrl!} download={downloadName(latest)} className={css.ghostBtn}>
                      <Download size={18} /> ดาวน์โหลด
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  className={css.preview}
                  onClick={() => openReport(latest)}
                  aria-label={`เปิดดูรายงานเดือน${MONTHS_FULL[latest.month - 1]} ${latest.year}`}
                >
                  <ReportPreview fileUrl={latest.fileUrl!} />
                </button>
              </section>
            ) : (
              <div className={css.empty}>
                <FileText size={44} strokeWidth={1.3} />
                <h2>ยังไม่มีรายงานของปี พ.ศ. {activeYear}</h2>
                <p>เมื่อมีการเผยแพร่รายการย่อประจำเดือน จะแสดงที่หน้านี้</p>
              </div>
            )}

            {/* ── รายเดือน 12 เดือน ── */}
            {activeYear && (
              <section>
                <h2 className={css.sectionTitle}>รายเดือน ปี {activeYear}</h2>
                <div className={css.monthGrid}>
                  {MONTHS_FULL.map((name, idx) => {
                    const month = idx + 1;
                    const item = byMonth.get(month);
                    // ใบปฏิทิน = วันสิ้นเดือนที่รายการย่อแสดงฐานะ
                    const calendar = (
                      <span className={css.cal} aria-hidden="true">
                        <span className={css.calMonth}>{MONTHS_SHORT[idx]}</span>
                        <span className={css.calDay}>{lastDayOf(month, activeYear)}</span>
                      </span>
                    );

                    if (!item?.fileUrl) {
                      return (
                        <div key={month} className={`${css.month} ${css.monthEmpty}`}>
                          <span className={css.monthTop}>
                            {calendar}
                            <span className={css.monthText}>
                              <span className={css.monthName}>{name}</span>
                              <span className={css.monthStatus}>สิ้นเดือน{name}</span>
                            </span>
                          </span>
                          <span className={css.monthFoot}>
                            <span className={css.monthPending}>
                              <Clock size={15} /> {item ? "ยังไม่มีไฟล์แนบ" : "รอเผยแพร่"}
                            </span>
                          </span>
                        </div>
                      );
                    }

                    const assets = toNumber(item.totalAssets);
                    const isLatest = item.id === latest?.id;
                    return (
                      <button
                        key={month}
                        type="button"
                        className={`${css.month} ${isLatest ? css.monthLatest : ""}`}
                        onClick={() => openReport(item)}
                      >
                        {isLatest && <span className={css.monthRibbon}>ล่าสุด</span>}
                        <Scale className={css.monthWatermark} aria-hidden="true" />
                        <span className={css.monthTop}>
                          {calendar}
                          <span className={css.monthText}>
                            <span className={css.monthName}>{name}</span>
                            <span className={css.monthStatus}>
                              {assets !== null
                                ? `สินทรัพย์ ${formatMillion(assets)} ล้านบาท`
                                : `ฐานะการเงิน ณ สิ้นเดือน`}
                            </span>
                          </span>
                        </span>
                        <span className={css.monthFoot}>
                          <span className={css.monthPublished}>
                            <CheckCircle2 size={15} /> เผยแพร่แล้ว
                          </span>
                          <span className={css.monthAction}>
                            ดูรายงาน
                            <span className={css.monthArrow}>
                              <ArrowRight size={16} />
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── อธิบายองค์ประกอบของรายการย่อ ── */}
        <section className={css.explain}>
          <h2 className={css.sectionTitle}>รายการย่อนี้บอกอะไร</h2>
          <p className={css.explainLead}>
            สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด จัดทำรายการย่อแสดงสินทรัพย์และหนี้สินเป็นรายเดือน
            เพื่อรายงานฐานะทางการเงินของสหกรณ์ต่อสมาชิก โดยแสดงยอดรวมสินทรัพย์ หนี้สิน และทุนของสหกรณ์
            ณ สิ้นเดือนนั้นๆ ตามพระราชบัญญัติสหกรณ์ พ.ศ. 2542
          </p>
          <div className={css.explainGrid}>
            <div className={`${css.explainCard} ${css.explainAssets}`}>
              <span className={css.explainIcon}>
                <Wallet size={22} />
              </span>
              <h3>สินทรัพย์</h3>
              <p>สิ่งที่สหกรณ์มีอยู่ เช่น เงินสด เงินฝาก เงินลงทุน และเงินให้กู้แก่สมาชิก</p>
            </div>
            <span className={css.explainOp} aria-hidden="true">=</span>
            <div className={`${css.explainCard} ${css.explainLiabilities}`}>
              <span className={css.explainIcon}>
                <Landmark size={22} />
              </span>
              <h3>หนี้สิน</h3>
              <p>ภาระที่สหกรณ์ต้องจ่ายคืน เช่น เงินรับฝากจากสมาชิก และเงินกู้ยืม</p>
            </div>
            <span className={css.explainOp} aria-hidden="true">+</span>
            <div className={`${css.explainCard} ${css.explainEquity}`}>
              <span className={css.explainIcon}>
                <PiggyBank size={22} />
              </span>
              <h3>ทุนของสหกรณ์</h3>
              <p>ส่วนที่เป็นของสมาชิก เช่น ทุนเรือนหุ้น ทุนสำรอง และกำไรสุทธิ</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── หน้าต่างดูรายงาน ── */}
      {viewing?.fileUrl && (
        <div className={css.modalOverlay} onClick={() => setViewing(null)}>
          <div
            className={css.modalContent}
            role="dialog"
            aria-modal="true"
            aria-label={`รายการย่อเดือน${MONTHS_FULL[viewing.month - 1]} ${viewing.year}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                <FileText size={19} /> {MONTHS_FULL[viewing.month - 1]} {viewing.year}
                <small>{asOfLabel(viewing)}</small>
              </h3>
              <div className={css.modalActions}>
                <a href={viewing.fileUrl} download={downloadName(viewing)} className={css.modalDownload}>
                  <Download size={16} /> ดาวน์โหลด
                </a>
                <a
                  href={viewing.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.modalOpen}
                >
                  <ExternalLink size={16} /> เปิดแท็บใหม่
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setViewing(null)}
                  className={css.modalClose}
                  aria-label="ปิด"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {isPdf(viewing.fileUrl) ? (
              <iframe src={viewing.fileUrl} className={css.pdfFrame} title="รายการย่อแสดงสินทรัพย์และหนี้สิน" />
            ) : (
              <div className={css.imageFrame}>
                <img src={viewing.fileUrl} alt={asOfLabel(viewing)} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
