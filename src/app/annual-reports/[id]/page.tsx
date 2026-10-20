"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
  forwardRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Maximize2, Minimize2 } from "lucide-react";
import { PageStore } from "./pageStore";
import css from "./page.module.css";

/* ─────────── FlipBook Page (forwardRef required) ─────────── */
const FlipPage = forwardRef<HTMLDivElement, { store: PageStore; pageNum: number }>(
  function FlipPage({ store, pageNum }, ref) {
    const subscribe = useCallback(
      (listener: () => void) => store.subscribe(pageNum, listener),
      [store, pageNum]
    );
    const src = useSyncExternalStore(subscribe, () => store.get(pageNum), () => null);

    return (
      <div ref={ref} className={css.page}>
        {src ? (
          <img src={src} alt={`หน้า ${pageNum}`} className={css.pageImage} draggable={false} />
        ) : (
          <div className={css.pageLoading}>
            <div className={css.spinner} />
            <span>กำลังโหลดหน้า {pageNum}</span>
          </div>
        )}
      </div>
    );
  }
);

const FLIPBOOK_STYLE: React.CSSProperties = {};
const BASE_PAGE_WIDTH = 500;
const MIN_PAGE_WIDTH = 300;
const SINGLE_PAGE_MAX = MIN_PAGE_WIDTH * 2;

/* ─────────── Main Viewer ─────────── */
export default function FlipbookViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [store] = useState(() => new PageStore());
  const [report, setReport] = useState<{ title: string; fileUrl: string; year: number } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [aspect, setAspect] = useState(1.414); // สูง ÷ กว้าง ของหน้ากระดาษ
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [loadError, setLoadError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          if (found) {
            setReport(found);
            return;
          }
        }
      } catch { /* ignore */ }
      setNotFound(true);
    })();
  }, [id]);

  // เปิดไฟล์ PDF — store จะเรนเดอร์หน้าต่าง ๆ ต่อเนื่องอยู่เบื้องหลังเอง
  useEffect(() => {
    if (!report?.fileUrl) return;
    let cancelled = false;
    store
      .open(report.fileUrl)
      .then((info) => {
        if (cancelled || !info) return;
        setAspect(info.aspect);
        setTotalPages(info.numPages);
      })
      .catch((err) => {
        console.error("Failed to load PDF:", err);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      store.close();
    };
  }, [report?.fileUrl, store]);

  // วัดพื้นที่วางหนังสือจริง (หักแถบเมนูของเว็บ/แถบควบคุมแล้ว) เพื่อให้เห็นทั้งเล่มโดยไม่ต้องเลื่อนจอ
  const flipAreaRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const viewer = containerRef.current;
      if (viewer) {
        const top = document.fullscreenElement
          ? 0
          : viewer.getBoundingClientRect().top + window.scrollY;
        viewer.style.setProperty("--viewer-top", `${Math.round(top)}px`);
      }
      const w = el.clientWidth;
      const h = el.clientHeight;
      setArea((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ขนาดหนังสือตามสัดส่วนหน้ากระดาษจริง (จอแคบ = หน้าเดี่ยว)
  const bookWidth = useMemo(() => {
    if (area.w === 0 || area.h === 0) return 0;
    const pad = area.w < 768 ? 8 : 40;
    const availW = area.w - pad;
    const availH = area.h - pad;
    const single = Math.min(availW, availH / aspect, SINGLE_PAGE_MAX);
    if (area.w < 768) return Math.floor(single);
    const pageW = Math.min(availW / 2, availH / aspect);
    // ตัวพลิกหน้าจะสลับเป็นหน้าเดี่ยวเองเมื่อกว้างไม่เกิน MIN_PAGE_WIDTH × 2
    return Math.floor(pageW > MIN_PAGE_WIDTH ? pageW * 2 : single);
  }, [area, aspect]);

  useEffect(() => {
    if (bookWidth > 0) flipBookRef.current?.pageFlip()?.update();
  }, [bookWidth]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Navigation
  const flipPrev = useCallback(() => flipBookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => flipBookRef.current?.pageFlip()?.flipNext(), []);

  const onFlip = useCallback(
    (e: { data: number }) => {
      setCurrentPage(e.data);
      store.setCenter(e.data);
    },
    [store]
  );

  const onChangeState = useCallback(
    (e: { data: string }) => store.setBusy(e.data === "flipping"),
    [store]
  );

  // เลื่อนแถบ = กระโดดไปหน้านั้นทันที (ไม่ต้องรอแอนิเมชันพลิกทีละหน้า)
  const jumpTo = (page: number) => {
    setCurrentPage(page);
    store.setCenter(page);
    flipBookRef.current?.pageFlip()?.turnToPage(page);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") flipPrev();
      else if (e.key === "ArrowRight") flipNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext]);

  // รายการหน้าต้องคงที่ — ถ้าเปลี่ยนทุกครั้งที่ render ตัวพลิกหน้าจะถูกรีเซ็ตกลางแอนิเมชัน
  const pages = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, i) => (
        <FlipPage key={i + 1} store={store} pageNum={i + 1} />
      )),
    [totalPages, store]
  );

  if (notFound || loadError) {
    return (
      <div className={css.loadingState}>
        <p style={{ fontSize: 16, color: "#f9fafb" }}>
          {notFound ? "ไม่พบรายงานฉบับนี้" : "เปิดไฟล์ eBook ไม่สำเร็จ"}
        </p>
        {loadError && report && (
          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className={css.navBtn}>
            <Download size={16} /> เปิดไฟล์ PDF แทน
          </a>
        )}
        <button className={css.navBtn} onClick={() => router.push("/annual-reports")}>
          <ArrowLeft size={16} /> กลับหน้ารายงานประจำปี
        </button>
      </div>
    );
  }

  if (!report || totalPages === 0) {
    return (
      <div className={css.loadingState}>
        <div className={css.spinner} />
        <p style={{ fontSize: 14 }}>{!report ? "กำลังโหลดข้อมูล..." : "กำลังเตรียม eBook..."}</p>
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
          <a
            className={css.fullscreenBtn}
            href={report.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ดาวน์โหลด PDF"
          >
            <Download size={14} /> PDF
          </a>
          <button className={css.fullscreenBtn} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? "ย่อ" : "เต็มจอ"}
          </button>
        </div>
      </div>

      {/* ── Flipbook ── */}
      <div ref={flipAreaRef} className={css.flipArea}>
        {bookWidth > 0 && (
        <div style={{ width: bookWidth }}>
        <HTMLFlipBook
          ref={flipBookRef}
          width={BASE_PAGE_WIDTH}
          height={Math.round(BASE_PAGE_WIDTH * aspect)}
          size="stretch"
          minWidth={MIN_PAGE_WIDTH}
          maxWidth={2000}
          minHeight={100}
          maxHeight={3000}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          onChangeState={onChangeState}
          className="flipbook"
          style={FLIPBOOK_STYLE}
          startPage={0}
          drawShadow={true}
          flippingTime={600}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showPageCorners={true}
          disableFlipByClick={false}
          useMouseEvents={true}
          swipeDistance={30}
          clickEventForward={true}
        >
          {pages}
        </HTMLFlipBook>
        </div>
        )}
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
          onChange={(e) => jumpTo(Number(e.target.value))}
          className={css.pageSlider}
          aria-label="เลื่อนไปยังหน้า"
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
