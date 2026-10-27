"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSearchMiss } from "@/lib/trackEvent";
import {
  Search,
  Plus,
  X,
  Pin,
  Lock,
  Eye,
  ShieldCheck,
  Hourglass,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  SearchX,
  UserRound,
  BellRing,
} from "lucide-react";
import { Avatar, QnaHero, timeAgo } from "./qnaShared";
import { loadMyQuestions, pruneMyQuestions, removeMyQuestion, type MyQuestion } from "./myQuestions";
import css from "./qna.module.css";

interface Answer {
  authorName: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Question {
  id: number;
  authorName: string;
  title: string;
  excerpt: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  replyCount: number;
  hasStaffReply: boolean;
  answer: Answer | null;
}

interface Stats {
  total: number;
  answered: number;
  unanswered: number;
}

interface MineStatus {
  id: number;
  title: string;
  isClosed: boolean;
  replyCount: number;
  hasStaffReply: boolean;
}

type FilterType = "all" | "answered" | "unanswered";
type SortType = "latest" | "popular";

const PAGE_SIZE = 15;
const QUICK_TOPICS = ["เงินกู้", "เงินฝาก", "ปันผล", "ดอกเบี้ย", "สมัครสมาชิก", "แอปพลิเคชัน"];

const HELP_LINKS = [
  { href: "/interest-rates", label: "อัตราดอกเบี้ย" },
  { href: "/forms", label: "ดาวน์โหลดแบบฟอร์ม" },
  { href: "/contact", label: "ติดต่อสหกรณ์" },
  { href: "/complaints", label: "แจ้งร้องเรียน" },
];

export default function QnaPage() {
  return (
    <Suspense fallback={null}>
      <QnaBoard />
    </Suspense>
  );
}

function QnaBoard() {
  const params = useSearchParams();

  // สถานะอยู่ใน URL (?q=&filter=&sort=&page=) → กดย้อนกลับจากกระทู้แล้วกลับมาที่เดิม
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<FilterType>((params.get("filter") as FilterType) || "all");
  const [sort, setSort] = useState<SortType>((params.get("sort") as SortType) || "latest");
  const [page, setPage] = useState(Math.max(1, Number(params.get("page")) || 1));

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [approximate, setApproximate] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // ค้นหาทันทีขณะพิมพ์ (หน่วง 350ms)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== search) {
        setSearch(searchInput.trim());
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), filter, sort });
    if (search) qs.set("search", search);

    const urlQs = new URLSearchParams();
    if (search) urlQs.set("q", search);
    if (filter !== "all") urlQs.set("filter", filter);
    if (sort !== "latest") urlQs.set("sort", sort);
    if (page > 1) urlQs.set("page", String(page));
    const s = urlQs.toString();
    window.history.replaceState(null, "", s ? `/qna?${s}` : "/qna");

    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/qna?${qs}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
        setApproximate(!!data.approximate);
        setTotalPages(Math.max(1, data.totalPages || 1));
        if (data.stats) setStats(data.stats);
        setLoading(false);
      } catch {
        if (ctrl.signal.aborted) return;
        setQuestions([]);
        setFailed(true);
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [page, search, filter, sort, reloadKey]);

  // ค้นหาไม่เจอ (นับเฉพาะตอนดูทุกกระทู้ — ตัวกรองอื่นทำให้ไม่เจอได้แม้มีกระทู้เรื่องนั้น)
  useSearchMiss("qna", search, loading || failed || filter !== "all" ? null : total);

  const applySearch = (value: string) => {
    setSearchInput(value);
    setSearch(value.trim());
    setPage(1);
  };

  const changeFilter = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const changeSort = (s: SortType) => {
    setSort(s);
    setPage(1);
  };

  const goPage = (p: number) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filterTabs: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "ทั้งหมด", count: stats?.total },
    { key: "unanswered", label: "รอคำตอบ", count: stats?.unanswered },
    { key: "answered", label: "ตอบแล้ว", count: stats?.answered },
  ];

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <>
      <QnaHero compact narrow eyebrow="ถาม-ตอบ Q&A" title="มีข้อสงสัย?" accent="ถามได้เลย">
        <div className={css.heroActionsRow}>
          <form
            className={css.heroSearch}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch(searchInput);
            }}
          >
            <Search size={20} className={css.heroSearchIcon} aria-hidden="true" />
            <input
              className={css.heroSearchInput}
              placeholder="ค้นหาคำถาม เช่น กู้สามัญ"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="ค้นหาคำถาม"
            />
            {searchInput && (
              <button type="button" className={css.heroSearchClear} onClick={() => applySearch("")} aria-label="ล้างคำค้นหา">
                <X size={16} />
              </button>
            )}
          </form>
          <Link href="/qna/new" className={`${css.primaryBtn} ${css.heroAskBtn}`}>
            <Plus size={18} /> ตั้งคำถามใหม่
          </Link>
        </div>

        <div className={css.topicRow}>
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${css.topicChip} ${search === t ? css.topicChipActive : ""}`}
              onClick={() => applySearch(search === t ? "" : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </QnaHero>

      <div className={css.main} ref={listRef}>
        <div className={css.board}>
          <MyQuestionsPanel />

          {/* แท็บกรอง */}
          <div className={css.tabs} role="tablist" aria-label="กรองกระทู้">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={filter === t.key}
                className={`${css.tabBtn} ${filter === t.key ? css.tabActive : ""}`}
                onClick={() => changeFilter(t.key)}
              >
                {t.label}
                {t.count !== undefined && <span className={css.tabCount}>{t.count.toLocaleString("th-TH")}</span>}
              </button>
            ))}
          </div>

          {/* บรรทัดสรุป + เรียงลำดับ */}
          <div className={css.listHead}>
            <span>
              {loading ? (
                "กำลังโหลด..."
              ) : search ? (
                <>
                  {approximate ? (
                    <>ไม่พบคำถามที่ตรงกับ “{search}” พอดี · แสดง <strong>{total.toLocaleString("th-TH")}</strong> คำถามที่ใกล้เคียง</>
                  ) : (
                    <>พบ <strong>{total.toLocaleString("th-TH")}</strong> คำถามเกี่ยวกับ “{search}”</>
                  )}{" "}
                  <button className={css.textBtn} onClick={() => applySearch("")}>ล้าง</button>
                </>
              ) : (
                <><strong>{total.toLocaleString("th-TH")}</strong> คำถาม</>
              )}
            </span>
            <span className={css.sortGroup} role="group" aria-label="เรียงลำดับ">
              <button
                className={`${css.sortBtn} ${sort === "latest" ? css.sortActive : ""}`}
                onClick={() => changeSort("latest")}
                aria-pressed={sort === "latest"}
              >
                ล่าสุด
              </button>
              <button
                className={`${css.sortBtn} ${sort === "popular" ? css.sortActive : ""}`}
                onClick={() => changeSort("popular")}
                aria-pressed={sort === "popular"}
              >
                ยอดนิยม
              </button>
            </span>
          </div>

          {/* รายการ */}
          {loading ? (
            <div className={css.rows} aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={css.skeletonRow} />
              ))}
            </div>
          ) : failed ? (
            <div className={css.empty}>
              <SearchX size={40} strokeWidth={1.5} />
              <h3>โหลดข้อมูลไม่สำเร็จ</h3>
              <p>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต แล้วลองใหม่อีกครั้ง</p>
              <button className={css.ghostBtn} onClick={() => setReloadKey((k) => k + 1)}>ลองใหม่</button>
            </div>
          ) : questions.length === 0 ? (
            <div className={css.empty}>
              <MessagesSquare size={40} strokeWidth={1.5} />
              <h3>
                {search
                  ? "ยังไม่มีใครถามเรื่องนี้"
                  : filter === "unanswered"
                    ? "ทุกคำถามได้รับคำตอบแล้ว"
                    : "ยังไม่มีคำถาม"}
              </h3>
              <p>{search ? "ลองใช้คำอื่น หรือตั้งเป็นคำถามใหม่ได้เลย" : "เป็นคนแรกที่ตั้งคำถาม"}</p>
              <Link href={search ? `/qna/new?title=${encodeURIComponent(search)}` : "/qna/new"} className={css.primaryBtn}>
                <Plus size={16} /> ตั้งคำถามใหม่
              </Link>
            </div>
          ) : (
            <ul className={css.rows}>
              {questions.map((q) => (
                <li key={q.id}>
                  <QACard q={q} />
                </li>
              ))}
            </ul>
          )}

          {/* เลขหน้า */}
          {!loading && totalPages > 1 && (
            <nav className={css.pagination} aria-label="เลขหน้า">
              <button className={css.pageBtn} onClick={() => goPage(page - 1)} disabled={page <= 1} aria-label="หน้าก่อนหน้า">
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && pageNumbers[i - 1] !== p - 1 && <span className={css.pageGap}>…</span>}
                  <button
                    className={`${css.pageBtn} ${p === page ? css.pageActive : ""}`}
                    onClick={() => goPage(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
              <button className={css.pageBtn} onClick={() => goPage(page + 1)} disabled={page >= totalPages} aria-label="หน้าถัดไป">
                <ChevronRight size={16} />
              </button>
            </nav>
          )}

          {/* ลิงก์ช่วยเหลือ — ย้ายมาไว้ท้ายรายการแทน sidebar */}
          <div className={css.helpRow}>
            <span>ไม่พบคำตอบ? ดูเพิ่มเติมที่</span>
            {HELP_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={css.helpChip}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* ปุ่มลอยบนมือถือ */}
      <Link href="/qna/new" className={css.fab} aria-label="ตั้งคำถามใหม่">
        <Plus size={20} /> ถามเลย
      </Link>
    </>
  );
}

/**
 * การ์ด "ถาม → ตอบ": ผู้ถาม · Q หัวข้อคำถาม · A คำตอบ (เจ้าหน้าที่ก่อน) · สถิติ
 * ป้าย Q/A ทำให้เห็นทันทีว่าเป็นกระดานถาม-ตอบ ไม่ใช่รายการงาน
 */
function QACard({ q }: { q: Question }) {
  const a = q.answer;
  const moreReplies = q.replyCount - (a ? 1 : 0);

  return (
    <Link href={`/qna/${q.id}`} className={`${css.qa} ${q.isPinned ? css.qaPinned : ""}`}>
      <div className={css.qaAsker}>
        <Avatar name={q.authorName} size={28} />
        <span className={css.qaAskerName}>{q.authorName}</span>
        <span className={css.qaDot} aria-hidden="true">·</span>
        <span>ถามเมื่อ {timeAgo(q.createdAt)}</span>
        {q.isPinned && <span className={`${css.tag} ${css.tagPin}`}><Pin size={12} /> ปักหมุด</span>}
        {q.isClosed && <span className={`${css.tag} ${css.tagClosed}`}><Lock size={12} /> ปิดแล้ว</span>}
      </div>

      <div className={css.qaLine}>
        <span className={`${css.qaMark} ${css.qaMarkQ}`} aria-label="คำถาม">Q</span>
        <h3 className={css.qaQuestion}>{q.title}</h3>
      </div>

      <div className={css.qaLine}>
        {a ? (
          <>
            <span className={`${css.qaMark} ${a.isAdmin ? css.qaMarkStaff : css.qaMarkMember}`} aria-label="คำตอบ">A</span>
            <div className={`${css.qaAnswer} ${a.isAdmin ? css.qaAnswerStaff : ""}`}>
              <span className={css.qaAnswerBy}>
                {a.isAdmin ? (
                  <><ShieldCheck size={15} /> เจ้าหน้าที่สหกรณ์</>
                ) : (
                  <>{a.authorName}</>
                )}
                <span className={css.qaAnswerTime}>· {timeAgo(a.createdAt)}</span>
              </span>
              <p className={css.qaAnswerBody}>{a.body}</p>
            </div>
          </>
        ) : (
          <>
            <span className={`${css.qaMark} ${css.qaMarkEmpty}`} aria-label="คำตอบ">A</span>
            <p className={css.qaWaiting}>
              <Hourglass size={15} /> ยังไม่มีคำตอบ — เจ้าหน้าที่จะเข้ามาตอบโดยเร็ว
              <span className={css.qaHelp}>ช่วยตอบ ›</span>
            </p>
          </>
        )}
      </div>

      <div className={css.qaFoot}>
        <span><MessageCircle size={15} /> {q.replyCount} คำตอบ</span>
        <span><Eye size={15} /> อ่าน {q.views.toLocaleString("th-TH")} ครั้ง</span>
        <span className={css.qaMore}>
          {moreReplies > 0 ? `ดูอีก ${moreReplies} คำตอบ` : "อ่านกระทู้"} <ChevronRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════ คำถามของฉัน ═══════════════════ */
const MINE_PREVIEW = 3;

function MyQuestionsPanel() {
  const [mine, setMine] = useState<MyQuestion[]>([]);
  const [status, setStatus] = useState<Record<number, MineStatus>>({});
  const [expanded, setExpanded] = useState(false);

  // localStorage อ่านได้หลัง hydrate เท่านั้น
  useEffect(() => {
    const list = loadMyQuestions();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(list);
    if (list.length === 0) return;
    const ctrl = new AbortController();
    fetch(`/api/qna?ids=${list.map((q) => q.id).join(",")}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const map: Record<number, MineStatus> = {};
        for (const q of data.questions as MineStatus[]) map[q.id] = q;
        setStatus(map);
        // กระทู้ที่ถูกลบ/ซ่อนแล้ว → เอาออกจากรายการ
        setMine(pruneMyQuestions(new Set(Object.keys(map).map(Number))));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  if (mine.length === 0) return null;

  const newCount = (q: MyQuestion) => Math.max(0, (status[q.id]?.replyCount ?? 0) - q.seenReplies);
  // มีคำตอบใหม่ขึ้นก่อน
  const sorted = [...mine].sort((a, b) => newCount(b) - newCount(a));
  const totalNew = mine.filter((q) => newCount(q) > 0).length;
  const shown = expanded ? sorted : sorted.slice(0, MINE_PREVIEW);

  return (
    <section className={css.mine} aria-labelledby="mine-title">
      <header className={css.mineHead}>
        <h2 id="mine-title" className={css.mineTitle}>
          <UserRound size={18} /> คำถามของฉัน
        </h2>
        {totalNew > 0 && (
          <span className={css.mineNewAll}>
            <BellRing size={14} /> มีคำตอบใหม่ {totalNew} เรื่อง
          </span>
        )}
      </header>

      <ul className={css.mineList}>
        {shown.map((q) => {
          const st = status[q.id];
          const fresh = newCount(q);
          return (
            <li key={q.id} className={css.mineItem}>
              <Link href={`/qna/${q.id}`} className={css.mineLink}>
                <span className={css.mineText}>
                  <span className={css.mineQ}>{st?.title ?? q.title}</span>
                  <span className={css.mineMeta}>
                    ถามเมื่อ {timeAgo(q.createdAt)}
                    {st && (
                      <>
                        {" · "}
                        {st.hasStaffReply ? (
                          <span className={css.mineStaff}>เจ้าหน้าที่ตอบแล้ว</span>
                        ) : st.replyCount > 0 ? (
                          `${st.replyCount} คำตอบ`
                        ) : (
                          "รอคำตอบ"
                        )}
                      </>
                    )}
                  </span>
                </span>
                {fresh > 0 && <span className={css.mineBadge}>ใหม่ {fresh}</span>}
                <ChevronRight size={18} className={css.rowArrow} aria-hidden="true" />
              </Link>
              <button
                className={css.mineRemove}
                onClick={() => setMine(removeMyQuestion(q.id))}
                aria-label={`เอา "${q.title}" ออกจากคำถามของฉัน`}
                title="เอาออกจากรายการ (กระทู้ไม่ถูกลบ)"
              >
                <X size={15} />
              </button>
            </li>
          );
        })}
      </ul>

      {mine.length > MINE_PREVIEW && (
        <button className={css.mineMore} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "แสดงน้อยลง" : `ดูทั้งหมด (${mine.length})`}
        </button>
      )}
      <p className={css.mineFoot}>จำไว้เฉพาะในเบราว์เซอร์นี้ · ผู้อื่นไม่เห็นรายการนี้</p>
    </section>
  );
}
