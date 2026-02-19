"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SearchOutlined,
  PlusOutlined,
  MessageOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PushpinOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface LatestReply {
  authorName: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Question {
  id: number;
  authorName: string;
  title: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  replyCount: number;
  latestReply: LatestReply | null;
}

interface Stats {
  total: number;
  answered: number;
  unanswered: number;
}

type FilterType = "all" | "answered" | "unanswered";
type SortType = "latest" | "popular";

export default function QnaPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [stats, setStats] = useState<Stats>({ total: 0, answered: 0, unanswered: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        filter,
        sort,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/qna?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilter = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortType);
    setPage(1);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const truncate = (s: string, len: number) =>
    s.length > len ? s.slice(0, len) + "..." : s;

  return (
    <>
      {/* Hero with Stats */}
      <div className={css.hero}>
        <div className={css.heroInner}>
          <h1 className={css.heroTitle}>กระดานถาม-ตอบ (Q&A)</h1>
          <p className={css.heroSub}>แบ่งปันความรู้ ถามตอบ และแลกเปลี่ยนประสบการณ์ร่วมกัน</p>

          {/* UX5: Hero Stats */}
          <div className={css.heroStats}>
            <div className={css.heroStat}>
              <span className={css.heroStatNum}>{stats.total}</span>
              <span className={css.heroStatLabel}>กระทู้ทั้งหมด</span>
            </div>
            <div className={css.heroStat}>
              <span className={css.heroStatNum}>{stats.answered}</span>
              <span className={css.heroStatLabel}>ตอบแล้ว</span>
            </div>
            <div className={css.heroStat}>
              <span className={css.heroStatNum}>{stats.unanswered}</span>
              <span className={css.heroStatLabel}>รอคำตอบ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <form className={css.toolbar} onSubmit={handleSearch}>
        <div className={css.searchBox}>
          <SearchOutlined className={css.searchIcon} />
          <input
            className={css.searchInput}
            placeholder="ค้นหาคำถาม..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Link href="/qna/new" className={css.createBtn}>
          <PlusOutlined /> ตั้งกระทู้คำถาม
        </Link>
      </form>

      {/* Content */}
      <div className={css.content}>
        {/* UX1: Filter Tabs + UX2: Sort */}
        <div className={css.filterBar}>
          <div className={css.filterTabs}>
            <button
              type="button"
              className={`${css.filterTab} ${filter === "all" ? css.filterTabActive : ""}`}
              onClick={() => handleFilter("all")}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              className={`${css.filterTab} ${filter === "unanswered" ? css.filterTabActive : ""}`}
              onClick={() => handleFilter("unanswered")}
            >
              <QuestionCircleOutlined /> รอคำตอบ
            </button>
            <button
              type="button"
              className={`${css.filterTab} ${filter === "answered" ? css.filterTabActive : ""}`}
              onClick={() => handleFilter("answered")}
            >
              <CheckCircleOutlined /> ตอบแล้ว
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={css.statsText}>
              <strong>{total}</strong> กระทู้ · หน้า {page}/{totalPages}
            </span>
            <select className={css.sortSelect} value={sort} onChange={handleSort}>
              <option value="latest">ล่าสุด</option>
              <option value="popular">ยอดนิยม</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={css.loading}>
            <div className={css.spinner} />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className={css.empty}>
            <QuestionCircleOutlined className={css.emptyIcon} />
            <p>
              {search
                ? "ไม่พบกระทู้ที่ค้นหา"
                : filter === "unanswered"
                  ? "ไม่มีกระทู้ที่รอคำตอบ"
                  : filter === "answered"
                    ? "ยังไม่มีกระทู้ที่ตอบแล้ว"
                    : "ยังไม่มีกระทู้คำถาม"}
            </p>
          </div>
        ) : (
          <>
            <div className={css.questionList}>
              {questions.map((q) => (
                <Link key={q.id} href={`/qna/${q.id}`} className={`${css.questionItem} ${q.isPinned ? css.questionPinned : ""}`}>
                  <div className={`${css.replyChip} ${q.replyCount > 0 ? css.replyChipHasReply : css.replyChipNoReply}`}>
                    <span className={css.replyCount}>{q.replyCount}</span>
                    <span className={css.replyLabel}>คำตอบ</span>
                  </div>

                  <div className={css.questionMain}>
                    <h3 className={css.questionTitle}>
                      {q.isPinned && <span className={css.pinBadge}><PushpinOutlined /> ปักหมุด</span>}
                      {q.isClosed && <span className={css.closedBadge}><LockOutlined /> ปิดแล้ว</span>}
                      {q.title}
                    </h3>
                    <div className={css.questionMeta}>
                      <span className={css.questionMetaItem}><UserOutlined /> {q.authorName}</span>
                      <span className={css.questionMetaItem}><ClockCircleOutlined /> {formatDate(q.createdAt)}</span>
                      <span className={css.questionMetaItem}><EyeOutlined /> {q.views} เข้าชม</span>
                    </div>

                    {/* UX3: Latest reply preview */}
                    {q.latestReply && (
                      <div className={`${css.latestReply} ${q.latestReply.isAdmin ? css.latestReplyAdmin : ""}`}>
                        <span className={css.latestReplyAuthor}>
                          {q.latestReply.isAdmin ? <><SafetyCertificateOutlined /> เจ้าหน้าที่:</> : <><MessageOutlined /> {q.latestReply.authorName}:</>}
                        </span>
                        <span className={css.latestReplyBody}>{truncate(q.latestReply.body, 80)}</span>
                      </div>
                    )}
                  </div>

                  <div className={css.viewsChip}>
                    <span className={css.viewsCount}>{q.views}</span>
                    <span className={css.viewsLabel}>เข้าชม</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={css.pagination}>
                <button
                  className={`${css.pageBtn} ${page <= 1 ? css.pageBtnDisabled : ""}`}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: "#d1d5db" }}>...</span>}
                      <button
                        className={`${css.pageBtn} ${p === page ? css.pageBtnActive : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  className={`${css.pageBtn} ${page >= totalPages ? css.pageBtnDisabled : ""}`}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
