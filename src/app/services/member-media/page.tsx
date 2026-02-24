"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, Search, PlayCircle, Image as ImageIcon, FileText } from "lucide-react";
import css from "./page.module.css";

interface MediaItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  coverUrl: string | null;
  filePath: string | null;
  fileType: string;
  createdAt: string;
}

const CATEGORIES = ["ทั้งหมด", "สมาชิกทุกประเภท", "สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ"];

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  video: "VIDEO",
  image: "IMAGE",
  link: "LINK",
};

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText size={40} strokeWidth={1.2} />,
  video: <PlayCircle size={40} strokeWidth={1.2} />,
  image: <ImageIcon size={40} strokeWidth={1.2} />,
  link: <ExternalLink size={40} strokeWidth={1.2} />,
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function MemberMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/member-media");
        if (res.ok) setItems(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((i) => {
    if (activeTab !== "ทั้งหมด" && i.category !== activeTab) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countByCategory = (cat: string) =>
    cat === "ทั้งหมด" ? items.length : items.filter((i) => i.category === cat).length;

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>สื่อสำหรับสมาชิก</h1>
        <p className={css.heroSub}>
          เอกสารและคู่มือสำหรับสมาชิก สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
        </p>
      </div>

      <div className={css.content}>
        {/* ── Category Tabs ── */}
        <div className={css.tabBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${css.tab} ${activeTab === cat ? css.tabActive : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
              <span className={css.tabCount}>{countByCategory(cat)}</span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className={css.searchBar}>
          <Search size={16} className={css.searchIcon} />
          <input
            type="text"
            className={css.searchInput}
            placeholder="ค้นหาสื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className={css.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={css.skeletonCard}>
                <div className={css.skeletonCover} />
                <div className={css.skeletonBody}>
                  <div className={css.skeletonLine} style={{ width: "40%" }} />
                  <div className={css.skeletonLine} style={{ width: "80%" }} />
                  <div className={css.skeletonLine} style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={css.empty}>
            <div className={css.emptyIcon}>📚</div>
            <p className={css.emptyText}>
              {search ? "ไม่พบผลการค้นหา" : "ยังไม่มีสื่อในหมวดนี้"}
            </p>
          </div>
        ) : (
          <div className={css.grid}>
            {filtered.map((item) => {
              const badgeClass = css[`badge${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}`] || css.badgePdf;
              const isLink = item.fileType === "link";

              return (
                <div key={item.id} className={css.card}>
                  {/* Cover */}
                  <div className={css.cardCover}>
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className={css.cardCoverImg}
                      />
                    ) : (
                      <div className={css.cardCoverPlaceholder}>
                        <span className={css.cardCoverIcon}>
                          {FILE_TYPE_ICONS[item.fileType] || <FileText size={40} strokeWidth={1.2} />}
                        </span>
                        <span className={css.cardCoverLabel}>
                          {FILE_TYPE_LABELS[item.fileType] || "FILE"}
                        </span>
                      </div>
                    )}
                    <span className={`${css.cardBadge} ${badgeClass}`}>
                      {FILE_TYPE_LABELS[item.fileType] || item.fileType.toUpperCase()}
                    </span>
                  </div>

                  {/* Body */}
                  <div className={css.cardBody}>
                    <div className={css.cardCategory}>
                      <span className={css.cardCategoryDot} />
                      {item.category}
                    </div>
                    <h3 className={css.cardTitle}>{item.title}</h3>
                    {item.description && (
                      <p className={css.cardDesc}>{item.description}</p>
                    )}
                    {!item.description && <div className={css.cardDesc} />}

                    <div className={css.cardFooter}>
                      <span className={css.cardDate}>
                        📅 {formatDate(item.createdAt)}
                      </span>
                      {item.filePath && (
                        <a
                          href={item.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={css.cardBtn}
                        >
                          {isLink ? (
                            <><ExternalLink size={14} /> เปิดลิงก์</>
                          ) : (
                            <><Download size={14} /> ดาวน์โหลด</>
                          )}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
