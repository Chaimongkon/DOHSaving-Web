"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarOutlined, EyeOutlined, SearchOutlined,
  LeftOutlined, RightOutlined, PushpinOutlined,
} from "@ant-design/icons";
import { categoryMap, type NewsData } from "@/data/mockNews";
import css from "./page.module.css";

const categories = [
  { value: "all", label: "ทั้งหมด" },
  { value: "announcement", label: "ประกาศ" },
  { value: "member-approval", label: "อนุมัติสมาชิก" },
  { value: "general", label: "ทั่วไป" },
];

const PER_PAGE = 12;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function formatViews(count: number) {
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return count.toString();
}

export default function NewsListPage() {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchNews = useCallback(async (p: number, cat: string, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: PER_PAGE.toString() });
      if (cat !== "all") params.set("category", cat);
      if (q.trim()) params.set("search", q.trim());

      const res = await fetch(`/api/news?${params}`);
      const json = await res.json();
      setNews(json.data ?? []);
      setTotalPages(json.totalPages ?? 1);
      setTotal(json.total ?? 0);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(page, filter, search);
  }, [page, filter, search, fetchNews]);

  // Debounced search
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 400);
  };

  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setPage(1);
  };

  return (
    <div className={css.page}>
      <div className={css.inner}>
        <h1 className={css.heading}>ข่าวประชาสัมพันธ์</h1>
        <p className={css.subheading}>ข่าวสารและประกาศล่าสุดจากสหกรณ์ออมทรัพย์กรมทางหลวง</p>

        {/* Filter + Search */}
        <div className={css.toolbar}>
          <div className={css.filterRow}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`${css.filterBtn} ${filter === cat.value ? css.filterActive : ""}`}
                onClick={() => handleFilterChange(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className={css.searchWrap}>
            <SearchOutlined className={css.searchIcon} />
            <input
              type="text"
              className={css.searchInput}
              placeholder="ค้นหาข่าว..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className={css.resultCount}>
            {total > 0 ? `พบข่าว ${total} รายการ` : "ไม่พบข่าวที่ค้นหา"}
          </p>
        )}

        {/* News grid / skeleton / empty */}
        {loading ? (
          <div className={css.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={css.skeleton}>
                <div className={css.skelThumb} />
                <div className={css.skelBody}>
                  <div className={css.skelLine} style={{ width: "80%" }} />
                  <div className={css.skelLine} style={{ width: "60%" }} />
                  <div className={css.skelLine} style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className={css.emptyState}>
            <p className={css.emptyText}>ไม่พบข่าวที่ค้นหา</p>
          </div>
        ) : (
          <div className={css.grid}>
            {news.map((item) => (
              <a href={`/news/${item.id}`} key={item.id} className={css.card}>
                <div className={css.thumb}>
                  {item.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagePath} alt={item.title || "ข่าว"} className={css.img} />
                  ) : (
                    <div className={css.thumbPlaceholder} />
                  )}
                  <span
                    className={css.tag}
                    style={{ background: categoryMap[item.category]?.color || "#6b7280" }}
                  >
                    {categoryMap[item.category]?.label || item.category}
                  </span>
                  {item.isPinned && (
                    <span className={css.pinBadge}><PushpinOutlined /> ปักหมุด</span>
                  )}
                </div>
                <div className={css.body}>
                  <h3 className={css.title}>{item.title || "ไม่มีหัวข้อ"}</h3>
                  {item.details && <p className={css.excerpt}>{item.details}</p>}
                  <div className={css.meta}>
                    <span><CalendarOutlined /> {formatDate(item.createdAt)}</span>
                    <span><EyeOutlined /> {formatViews(item.viewCount)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={css.pagination}>
            <button
              className={css.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <LeftOutlined /> ก่อนหน้า
            </button>
            <div className={css.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`dot-${i}`} className={css.pageDots}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${css.pageNum} ${p === page ? css.pageActive : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>
            <button
              className={css.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป <RightOutlined />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
