"use client";

import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { useParams, useRouter } from "next/navigation";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import css from "./page.module.css";

/* ─────────── PDF Render Queue (one at a time, with retry) ─────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfDoc: any = null;
let pdfDocUrl = "";
const pageImageCache = new Map<string, string>();

type RenderCallback = (pageNum: number, dataUrl: string) => void;

class PageRenderQueue {
  private queue: number[] = [];
  private processing = false;
  private url = "";
  private callback: RenderCallback = () => {};

  configure(url: string, cb: RenderCallback) {
    this.url = url;
    this.callback = cb;
  }

  enqueue(pages: number[]) {
    for (const p of pages) {
      const key = `${this.url}:${p}`;
      if (pageImageCache.has(key)) {
        this.callback(p, pageImageCache.get(key)!);
        continue;
      }
      if (!this.queue.includes(p)) {
        this.queue.push(p);
      }
    }
    this.process();
  }

  // Move these pages to front of queue
  prioritize(pages: number[]) {
    const remaining = this.queue.filter(p => !pages.includes(p));
    const priority = pages.filter(p => !pageImageCache.has(`${this.url}:${p}`));
    this.queue = [...priority, ...remaining];
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const pageNum = this.queue.shift()!;
      const key = `${this.url}:${pageNum}`;
      if (pageImageCache.has(key)) {
        this.callback(pageNum, pageImageCache.get(key)!);
        continue;
      }

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const dataUrl = await this.renderPage(pageNum);
          pageImageCache.set(key, dataUrl);
          this.callback(pageNum, dataUrl);
          break;
        } catch (err) {
          console.warn(`Render page ${pageNum} attempt ${attempt + 1} failed:`, err);
          if (attempt === 0) await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    this.processing = false;
  }

  private async renderPage(pageNum: number): Promise<string> {
    if (!pdfDoc || pdfDocUrl !== this.url) {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      pdfDoc = await pdfjsLib.getDocument(this.url).promise;
      pdfDocUrl = this.url;
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = (page as any).render({ canvasContext: ctx, viewport });
    if (task.promise) {
      await task.promise;
    } else {
      await task;
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  }
}

const renderQueue = new PageRenderQueue();

/* ─────────── FlipBook Page (forwardRef required) ─────────── */
const FlipPage = forwardRef<HTMLDivElement, { src: string | null; pageNum: number; width: number; height: number }>(
  function FlipPage({ src, pageNum, width, height }, ref) {
    return (
      <div ref={ref} className={css.page} style={{ width, height }}>
        {src ? (
          <img src={src} alt={`หน้า ${pageNum}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div className={css.pageLoading}>
            <div className={css.spinner} />
            <span>หน้า {pageNum}</span>
          </div>
        )}
      </div>
    );
  }
);

/* ─────────── Main Viewer ─────────── */
export default function FlipbookViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [report, setReport] = useState<{ title: string; fileUrl: string; year: number } | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch report info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/annual-reports");
        if (res.ok) {
          const items = await res.json();
          const found = items.find((i: { id: number }) => i.id === Number(id));
          if (found) setReport(found);
        }
      } catch { /* ignore */ }
    })();
  }, [id]);

  // Configure render queue callback
  useEffect(() => {
    if (!report?.fileUrl) return;
    renderQueue.configure(report.fileUrl, (pageNum, dataUrl) => {
      setPageImages(prev => ({ ...prev, [pageNum]: dataUrl }));
    });
  }, [report?.fileUrl]);

  // Load PDF and get page count, then pre-render first pages
  useEffect(() => {
    if (!report?.fileUrl) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingProgress(10);
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        setLoadingProgress(30);
        const doc = await pdfjsLib.getDocument(report.fileUrl).promise;
        pdfDoc = doc;
        pdfDocUrl = report.fileUrl;
        if (cancelled) return;
        setTotalPages(doc.numPages);
        setLoadingProgress(100);
        // Enqueue first batch of pages
        const firstBatch = Array.from({ length: Math.min(8, doc.numPages) }, (_, i) => i + 1);
        renderQueue.enqueue(firstBatch);
        setTimeout(() => { if (!cancelled) setLoading(false); }, 200);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [report?.fileUrl]);

  // When page changes, prioritize nearby pages
  useEffect(() => {
    if (!report?.fileUrl || totalPages === 0) return;
    const RANGE = 4;
    const start = Math.max(1, currentPage + 1 - RANGE);
    const end = Math.min(totalPages, currentPage + 1 + RANGE + 2);
    const nearby = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    renderQueue.prioritize(nearby);
    renderQueue.enqueue(nearby);
  }, [currentPage, totalPages, report?.fileUrl]);

  // Calculate book size (portrait single-page on mobile)
  const calculateSize = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const mobile = vw < 768;
    setIsMobile(mobile);

    if (mobile) {
      const availW = vw - 24;
      const availH = vh - 130;
      const pageW = availW;
      const pageH = Math.min(availH, pageW * 1.414);
      setBookSize({ width: Math.round(pageW), height: Math.round(pageH) });
    } else {
      const availH = vh - 140;
      const availW = vw - 80;
      const pageW = Math.min(availW / 2, 500);
      const pageH = Math.min(availH, pageW * 1.414);
      setBookSize({ width: Math.round(pageW), height: Math.round(pageH) });
    }
  }, []);

  useEffect(() => {
    calculateSize();
    window.addEventListener("resize", calculateSize);
    return () => window.removeEventListener("resize", calculateSize);
  }, [calculateSize]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Navigation
  const flipPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const flipNext = () => flipBookRef.current?.pageFlip()?.flipNext();
  const onFlip = (e: { data: number }) => setCurrentPage(e.data);

  // Loading
  if (!report || loading) {
    return (
      <div className={css.loadingState}>
        <div className={css.spinner} />
        <p style={{ fontSize: 14 }}>{!report ? "กำลังโหลดข้อมูล..." : "กำลังเตรียม eBook..."}</p>
        {loadingProgress > 0 && (
          <div className={css.progressBar}>
            <div className={css.progressFill} style={{ width: `${loadingProgress}%` }} />
          </div>
        )}
        {totalPages > 0 && <p style={{ fontSize: 12, opacity: 0.6 }}>{totalPages} หน้า</p>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={css.viewer}>
      {/* ── Top Bar ── */}
      <div className={css.topBar}>
        <button className={css.backBtn} onClick={() => router.push("/annual-reports")}>
          <ArrowLeft size={16} /> กลับ
        </button>
        <span className={css.topTitle}>{report.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className={css.pageInfo}>{totalPages} หน้า</span>
          <button className={css.fullscreenBtn} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? "ย่อ" : "เต็มจอ"}
          </button>
        </div>
      </div>

      {/* ── Flipbook ── */}
      <div className={css.flipArea}>
        <HTMLFlipBook
          ref={flipBookRef}
          width={bookSize.width}
          height={bookSize.height}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={900}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          className="flipbook"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={600}
          usePortrait={isMobile}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showPageCorners={true}
          disableFlipByClick={false}
          useMouseEvents={true}
          swipeDistance={30}
          clickEventForward={true}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <FlipPage
              key={i + 1}
              pageNum={i + 1}
              src={pageImages[i + 1] || null}
              width={bookSize.width}
              height={bookSize.height}
            />
          ))}
        </HTMLFlipBook>
      </div>

      {/* ── Navigation Controls ── */}
      <div className={css.navControls}>
        <button className={css.navBtn} onClick={flipPrev} disabled={currentPage === 0}>
          <ChevronLeft size={16} /> ก่อนหน้า
        </button>

        <input
          type="range"
          min={0}
          max={totalPages - 1}
          value={currentPage}
          onChange={(e) => {
            const page = Number(e.target.value);
            flipBookRef.current?.pageFlip()?.flip(page);
          }}
          className={css.pageSlider}
        />

        <span className={css.pageNumber}>
          {currentPage + 1} / {totalPages}
        </span>

        <button className={css.navBtn} onClick={flipNext} disabled={currentPage >= totalPages - 1}>
          ถัดไป <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
