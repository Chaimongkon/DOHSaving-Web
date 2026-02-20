"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Calendar,
  FileText,
  Eye,
  Info,
  Download,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import css from "./page.module.css";

const MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const LAST_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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

const currentBE = new Date().getFullYear() + 543;

export default function FinancialSummaryPage() {
  const [items, setItems] = useState<FinItem[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; label: string } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const skipNextLoad = useRef(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial-summary?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.years?.length) setYears(data.years);
      }
    } catch { /* fallback empty */ }
    setLoading(false);
  }, []);

  // Initial load: let API pick the latest year with data
  useEffect(() => {
    if (initialized) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/financial-summary`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setYears(data.years?.length ? data.years : [currentBE]);
          skipNextLoad.current = true;
          setSelectedYear(data.selectedYear || currentBE);
        } else {
          setYears([currentBE]);
          setSelectedYear(currentBE);
        }
      } catch {
        setYears([currentBE]);
        setSelectedYear(currentBE);
      }
      setLoading(false);
      setInitialized(true);
    })();
  }, [initialized]);

  // Reload when user changes year
  useEffect(() => {
    if (!initialized || selectedYear === null) return;
    if (skipNextLoad.current) { skipNextLoad.current = false; return; }
    load(selectedYear);
  }, [selectedYear, load, initialized]);

  // Close year dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Only months that have data, sorted
  const availableItems = [...items].sort((a, b) => a.month - b.month);

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>รายการย่อแสดงสินทรัพย์และหนี้สิน</h1>
        <p className={css.heroSub}>
          งบการเงินรายเดือน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
        </p>
      </div>

      <div className={css.content}>
        {/* ── Year Selector ── */}
        <div className={css.yearBar}>
          <div className={css.yearLeft}>
            <Calendar size={18} />
            <span className={css.yearLabel}>ประจำปี พ.ศ.</span>
          </div>
          <div className={css.yearSelector} ref={yearRef}>
            <button className={css.yearBtn} onClick={() => setYearOpen(!yearOpen)}>
              {selectedYear || currentBE}
              <ChevronDown size={16} className={yearOpen ? css.chevronUp : ""} />
            </button>
            {yearOpen && (
              <div className={css.yearDropdown}>
                {years.map((y) => (
                  <button
                    key={y}
                    className={`${css.yearOption} ${y === selectedYear ? css.yearOptionActive : ""}`}
                    onClick={() => { setSelectedYear(y); setYearOpen(false); }}
                  >
                    พ.ศ. {y}
                    {y === selectedYear && <span className={css.yearCheck}>&#10003;</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Item Count ── */}
        {!loading && availableItems.length > 0 && (
          <p className={css.itemCount}>มีทั้งหมด <strong>{availableItems.length}</strong> รายการ</p>
        )}

        {/* ── Month Grid ── */}
        {loading ? (
          <div className={css.monthGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={css.skeletonCard}>
                <div className={css.skeletonInner}>
                  <div className={css.skeletonIcon} />
                  <div className={css.skeletonLines}>
                    <div className={css.skeletonLine} style={{ width: '60%' }} />
                    <div className={css.skeletonLine} style={{ width: '90%' }} />
                    <div className={css.skeletonLine} style={{ width: '50%' }} />
                  </div>
                </div>
                <div className={css.skeletonBtn} />
              </div>
            ))}
          </div>
        ) : availableItems.length === 0 ? (
          <div className={css.emptyBox}>
            <FileText size={40} strokeWidth={1.2} />
            <p>ยังไม่มีข้อมูลสำหรับปี พ.ศ. {selectedYear}</p>
          </div>
        ) : (
          <div className={css.monthGrid}>
            {availableItems.map((item, idx) => {
              const hasFile = !!item.fileUrl;
              const monthName = MONTHS_FULL[item.month - 1];
              const lastDay = LAST_DAYS[item.month - 1] || 31;

              return (
                <div
                  key={item.id}
                  className={`${css.card} ${css.cardFadeIn} ${hasFile ? css.cardClickable : ""}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={hasFile ? () => setViewingPdf({ url: item.fileUrl!, label: `${monthName} ${item.year}` }) : undefined}
                >
                  <div className={css.cardInner}>
                    <div className={css.cardIcon}>
                      <Image src="/images/logo/pdf.png" alt="PDF" width={52} height={52} />
                    </div>
                    <div className={css.cardInfo}>
                      <div className={css.cardMonthRow}>
                        <span className={css.monthTag}>{monthName} {item.year}</span>
                      </div>
                      <p className={css.cardTitle}>
                        รายการย่อแสดงสินทรัพย์และหนี้สิน
                      </p>
                      <p className={css.cardDate}>
                        ณ วันที่ {lastDay} {monthName} {item.year}
                      </p>
                    </div>
                  </div>
                  {hasFile ? (
                    <button className={css.cardBtn}>
                      <Eye size={14} /> ดูรายงาน
                    </button>
                  ) : (
                    <div className={css.cardNoFile}>
                      ยังไม่มีไฟล์แนบ
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Info Banner ── */}
        <div className={css.infoBanner}>
          <div className={css.infoBannerIcon}>
            <Info size={24} />
          </div>
          <div className={css.infoBannerText}>
            <h3 className={css.infoBannerTitle}>เกี่ยวกับรายการย่อแสดงสินทรัพย์และหนี้สิน</h3>
            <p className={css.infoBannerSub}>
              สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด จัดทำรายการย่อแสดงสินทรัพย์และหนี้สินเป็นรายเดือน
              เพื่อรายงานฐานะทางการเงินของสหกรณ์ต่อสมาชิก โดยแสดงยอดรวมสินทรัพย์ หนี้สิน
              และทุนของสหกรณ์ ณ สิ้นเดือนนั้นๆ ตามพระราชบัญญัติสหกรณ์ พ.ศ. 2542
            </p>
          </div>
        </div>
      </div>

      {/* ── PDF Viewer Modal (outside content, above navbar) ── */}
      {viewingPdf && (
        <div className={css.modalOverlay} onClick={() => setViewingPdf(null)}>
          <div className={css.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                <FileText size={18} /> {viewingPdf.label}
              </h3>
              <div className={css.modalActions}>
                <a
                  href={viewingPdf.url}
                  download
                  className={css.modalBtn}
                  style={{ background: "#16a34a", color: "#fff" }}
                >
                  <Download size={14} /> ดาวน์โหลด
                </a>
                <a
                  href={viewingPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.modalBtn}
                  style={{ background: "#0369a1", color: "#fff" }}
                >
                  <ExternalLink size={14} /> เปิดแท็บใหม่
                </a>
                <button onClick={() => setViewingPdf(null)} className={css.modalClose}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe
              src={viewingPdf.url}
              className={css.pdfFrame}
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </>
  );
}
