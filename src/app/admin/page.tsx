"use client";

import React, { useState, useEffect } from "react";
import {
  EyeOutlined,
  CalendarOutlined,
  RiseOutlined,
  GlobalOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface VisitorStats {
  total: number;
  today: number;
  thisMonth: number;
  thisYear: number;
  dailyChart: { date: string; count: number }[];
  topPages: { pageUrl: string; count: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/visitor-stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={css.loading}>กำลังโหลดข้อมูล...</div>;
  }

  const statCards = [
    { label: "เข้าชมวันนี้", value: data?.today ?? 0, icon: <EyeOutlined />, color: "#2d6a4f" },
    { label: "เดือนนี้", value: data?.thisMonth ?? 0, icon: <CalendarOutlined />, color: "#1a3a5c" },
    { label: "ปีนี้", value: data?.thisYear ?? 0, icon: <RiseOutlined />, color: "#7c3aed" },
    { label: "ทั้งหมด", value: data?.total ?? 0, icon: <GlobalOutlined />, color: "#E8652B" },
  ];

  const chart = data?.dailyChart ?? [];
  const maxCount = Math.max(...chart.map((d) => d.count), 1);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div>
      <h1 className={css.title}>แดชบอร์ด</h1>

      {/* Stat cards */}
      <div className={css.statsGrid}>
        {statCards.map((s) => (
          <div key={s.label} className={css.statCard}>
            <div
              className={css.statIcon}
              style={{ background: `${s.color}15`, color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <div className={css.statValue}>{s.value.toLocaleString()}</div>
              <div className={css.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top pages */}
      <div className={css.chartSection}>
        {/* Bar chart */}
        <div className={css.chartCard}>
          <h3 className={css.chartTitle}>
            <BarChartOutlined /> ผู้เข้าชม 7 วันล่าสุด
          </h3>
          <div className={css.barChart}>
            {chart.map((d) => (
              <div key={d.date} className={css.barGroup}>
                <span className={css.barValue}>{d.count}</span>
                <div
                  className={css.bar}
                  style={{ height: `${(d.count / maxCount) * 140}px` }}
                />
                <span className={css.barLabel}>{formatDay(d.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div className={css.chartCard}>
          <h3 className={css.chartTitle}>
            <FileTextOutlined /> หน้ายอดนิยมเดือนนี้
          </h3>
          {(data?.topPages ?? []).length > 0 ? (
            <ul className={css.pageList}>
              {data!.topPages.map((p, i) => (
                <li key={i} className={css.pageItem}>
                  <span className={css.pageUrl}>{p.pageUrl || "/"}</span>
                  <span className={css.pageCount}>{p.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
              ยังไม่มีข้อมูล
            </p>
          )}
        </div>
      </div>

      <div className={css.footerText}>
        <p>ระบบจัดการเว็บไซต์ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
        <p>เลือกเมนูด้านซ้ายเพื่อจัดการเนื้อหา</p>
      </div>
    </div>
  );
}
