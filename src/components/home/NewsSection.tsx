"use client";

import React, { useState, useEffect } from "react";
import { CalendarOutlined, RightOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { categoryMap, type NewsData } from "@/data/mockNews";
import css from "./NewsSection.module.css";

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
  const [newsList, setNewsList] = useState<NewsData[]>([]);

  useEffect(() => {
    fetch("/api/news?limit=4")
      .then((res) => res.json())
      .then((res) => {
        const items: NewsData[] = res?.data ?? res;
        if (Array.isArray(items) && items.length > 0) {
          setNewsList(items);
        }
      })
      .catch(() => {});
  }, []);

  const featured = newsList[0];
  const rest = newsList.slice(1);

  return (
    <section className={css.section}>
      <div className={css.inner}>
        <div className={css.header}>
          <div>
            <h2 className="section-heading section-heading--left">
              ข่าวประชาสัมพันธ์
            </h2>
            <p className="section-subheading" style={{ textAlign: "left", marginBottom: 0 }}>
              ข่าวสารและประกาศล่าสุดจากสหกรณ์
            </p>
          </div>
          <Link href="/news" className={css.viewAll}>
            ดูข่าวทั้งหมด <RightOutlined />
          </Link>
        </div>

        <div className={css.featuredLayout}>
          {/* Featured (large) card */}
          {featured && (
            <a href={`/news/${featured.id}`} className={`${css.card} ${css.cardFeatured}`}>
              <div className={`${css.thumb} ${css.thumbFeatured}`}>
                {featured.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.imagePath} alt={featured.title || "ข่าว"} className={css.img} />
                ) : (
                  <div className={css.thumbPlaceholder} />
                )}
                <span
                  className={css.tag}
                  style={{ background: categoryMap[featured.category]?.color }}
                >
                  {categoryMap[featured.category]?.label}
                </span>
              </div>
              <div className={css.body}>
                <h3 className={`${css.title} ${css.titleFeatured}`}>{featured.title}</h3>
                {featured.category === "member-approval" && (
                  <span className={css.monthly}>{formatMonth(featured.createdAt)}</span>
                )}
                <p className={`${css.excerpt} ${css.excerptFeatured}`}>{featured.details}</p>
                <div className={css.meta}>
                  <div className={css.metaLeft}>
                    <span className={css.metaItem}>
                      <CalendarOutlined /> โพสต์เมื่อวันที่ {formatDate(featured.createdAt)}
                    </span>
                    <span className={css.metaItem}>
                      <EyeOutlined /> {formatViews(featured.viewCount)} ครั้ง
                    </span>
                  </div>
                  <span className={css.readmore}>คลิกเพื่ออ่านต่อ</span>
                </div>
              </div>
            </a>
          )}

          {/* Side cards (smaller) */}
          <div className={css.sideList}>
            {rest.map((news) => (
              <a href={`/news/${news.id}`} key={news.id} className={`${css.card} ${css.cardSide}`}>
                <div className={`${css.thumb} ${css.thumbSide}`}>
                  {news.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={news.imagePath} alt={news.title || "ข่าว"} className={css.img} />
                  ) : (
                    <div className={css.thumbPlaceholder} />
                  )}
                  <span
                    className={css.tag}
                    style={{ background: categoryMap[news.category]?.color }}
                  >
                    {categoryMap[news.category]?.label}
                  </span>
                </div>
                <div className={css.body}>
                  <h3 className={css.title}>{news.title}</h3>
                  {news.category === "member-approval" && (
                    <span className={`${css.monthly} ${css.monthlySm}`}>{formatMonth(news.createdAt)}</span>
                  )}
                  <div className={`${css.meta} ${css.metaSide}`}>
                    <div className={css.metaLeft}>
                      <span className={css.metaItem}>
                        <CalendarOutlined /> {formatDate(news.createdAt)}
                      </span>
                      <span className={css.metaItem}>
                        <EyeOutlined /> {formatViews(news.viewCount)}
                      </span>
                    </div>
                    <span className={css.readmore}>คลิกเพื่ออ่านต่อ</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
