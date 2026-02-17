"use client";

import React from "react";
import { CalendarOutlined, RightOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockNews, categoryMap } from "@/data/mockNews";

// Show latest 4 news
const latestNews = mockNews
  .filter((n) => n.isActive)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 4);

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543; // พ.ศ.
  return `${day}/${month}/${year}`;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return "ประจำเดือน" + d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

function formatViews(count: number) {
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return count.toString();
}

export default function NewsSection() {
  const featured = latestNews[0];
  const rest = latestNews.slice(1);

  return (
    <section className="news-section">
      <div className="news-section-inner">
        <div className="news-section-header">
          <div>
            <h2 className="section-heading" style={{ textAlign: "left" }}>
              ข่าวประชาสัมพันธ์
            </h2>
            <p className="section-subheading" style={{ textAlign: "left", marginBottom: 0 }}>
              ข่าวสารและประกาศล่าสุดจากสหกรณ์
            </p>
          </div>
          <Link href="/news" className="news-view-all">
            ดูข่าวทั้งหมด <RightOutlined />
          </Link>
        </div>

        <div className="news-featured-layout">
          {/* Featured (large) card */}
          {featured && (
            <Link href={`/news/${featured.id}`} className="news-card news-card--featured">
              <div className="news-card-thumb news-card-thumb--featured">
                {featured.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.imagePath} alt={featured.title} className="news-card-img" />
                ) : (
                  <div className="news-card-thumb-placeholder" />
                )}
                <span
                  className="news-card-tag"
                  style={{ background: categoryMap[featured.category]?.color }}
                >
                  {categoryMap[featured.category]?.label}
                </span>
              </div>
              <div className="news-card-body">
                <h3 className="news-card-title news-card-title--featured">{featured.title}</h3>
                {featured.category === "member-approval" && (
                  <span className="news-card-monthly">{formatMonth(featured.createdAt)}</span>
                )}
                <p className="news-card-excerpt news-card-excerpt--featured">{featured.details}</p>
                <div className="news-card-meta">
                  <div className="news-card-meta-left">
                    <span className="news-card-meta-item">
                      <CalendarOutlined /> โพสต์เมื่อวันที่ {formatDate(featured.createdAt)}
                    </span>
                    <span className="news-card-meta-item">
                      <EyeOutlined /> {formatViews(featured.viewCount)} ครั้ง
                    </span>
                  </div>
                  <span className="news-card-readmore">คลิกเพื่ออ่านต่อ</span>
                </div>
              </div>
            </Link>
          )}

          {/* Side cards (smaller) */}
          <div className="news-side-list">
            {rest.map((news) => (
              <Link href={`/news/${news.id}`} key={news.id} className="news-card news-card--side">
                <div className="news-card-thumb news-card-thumb--side">
                  {news.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={news.imagePath} alt={news.title} className="news-card-img" />
                  ) : (
                    <div className="news-card-thumb-placeholder" />
                  )}
                  <span
                    className="news-card-tag"
                    style={{ background: categoryMap[news.category]?.color }}
                  >
                    {categoryMap[news.category]?.label}
                  </span>
                </div>
                <div className="news-card-body">
                  <h3 className="news-card-title">{news.title}</h3>
                  {news.category === "member-approval" && (
                    <span className="news-card-monthly news-card-monthly--sm">{formatMonth(news.createdAt)}</span>
                  )}
                  <div className="news-card-meta news-card-meta--side">
                    <div className="news-card-meta-left">
                      <span className="news-card-meta-item">
                        <CalendarOutlined /> {formatDate(news.createdAt)}
                      </span>
                      <span className="news-card-meta-item">
                        <EyeOutlined /> {formatViews(news.viewCount)}
                      </span>
                    </div>
                    <span className="news-card-readmore">คลิกเพื่ออ่านต่อ</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
