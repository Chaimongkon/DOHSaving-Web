"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Spin, Space } from "antd";
import {
  Eye,
  CalendarDays,
  TrendingUp,
  Globe2,
  BarChart3,
  FileText,
} from "lucide-react";
import css from "./page.module.css";

const { Title, Text } = Typography;

interface VisitorStats {
  total: number;
  today: number;
  thisMonth: number;
  thisYear: number;
  dailyChart: { date: string; count: number }[];
  topPages: { pageUrl: string; count: number }[];
  translations: Record<string, string>;
}

const getPageName = (url: string, translations: Record<string, string>) => {
  // Clean URL string first
  const cleanUrl = url.split("?")[0].split("#")[0];

  // Try exact match
  if (translations[cleanUrl]) return translations[cleanUrl];

  // Fallback to startsWith pattern
  for (const [key, value] of Object.entries(translations).sort((a, b) => b[0].length - a[0].length)) {
    if (key !== "/" && cleanUrl.startsWith(key)) {
      const remainingPath = cleanUrl.replace(key, '');
      return remainingPath ? `${value} - ${remainingPath}` : value;
    }
  }

  return cleanUrl || "หน้าหลัก (Home)";
};

export default function AdminDashboard() {
  const [data, setData] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/visitor-stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={css.loadingContainer}>
        <Spin size="large" description="กำลังโหลดข้อมูลแดชบอร์ด..." />
      </div>
    );
  }

  const statCards = [
    { label: "เข้าชมวันนี้", value: data?.today ?? 0, icon: <Eye size={30} strokeWidth={1.5} />, color: "#166534", bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" },
    { label: "เดือนนี้", value: data?.thisMonth ?? 0, icon: <CalendarDays size={30} strokeWidth={1.5} />, color: "#1e40af", bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" },
    { label: "ปีนี้", value: data?.thisYear ?? 0, icon: <TrendingUp size={30} strokeWidth={1.5} />, color: "#6b21a8", bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)" },
    { label: "ทั้งหมด", value: data?.total ?? 0, icon: <Globe2 size={30} strokeWidth={1.5} />, color: "#9a3412", bg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)" },
  ];

  const chart = data?.dailyChart ?? [];
  const maxCount = Math.max(...chart.map((d) => d.count), 1);
  const isChartEmpty = chart.every(d => d.count === 0);

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className={css.dashboardContainer}>
      <Title level={2} className={css.pageTitle}>แดชบอร์ดผู้ดูแลระบบ</Title>

      {/* Stat cards */}
      <Row gutter={[24, 24]} className={css.statsRow}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.label}>
            <Card variant="borderless" className={css.statCard} styles={{ body: { padding: "20px" } }}>
              <div className={css.statContent}>
                <div
                  className={css.statIconWrapper}
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.icon}
                </div>
                <div className={css.statText}>
                  <div className={css.statValue}>{s.value.toLocaleString()}</div>
                  <div className={css.statLabel}>{s.label}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart + Top pages */}
      <Row gutter={[24, 24]} className={css.chartsRow}>
        {/* Bar chart */}
        <Col xs={24} lg={16}>
          <Card variant="borderless" className={css.chartCard} styles={{ body: { padding: "24px" } }}>
            <Space align="center" style={{ marginBottom: 24 }}>
              <div className={css.sectionIcon}><BarChart3 size={20} /></div>
              <Title level={4} style={{ margin: 0 }}>ผู้เข้าชม 7 วันล่าสุด</Title>
            </Space>

            {isChartEmpty ? (
              <div className={css.emptyChart}>
                <BarChart3 size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                <Text type="secondary" className={css.emptyText}>ยังไม่มียอดผู้เข้าชมในช่วง 7 วันที่ผ่านมา</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>กราฟจะแสดงข้อมูลเมื่อมีผู้เข้าชมเว็บไซต์</Text>
              </div>
            ) : (
              <div className={css.barChart}>
                {chart.map((d) => (
                  <div key={d.date} className={css.barGroup}>
                    <span className={css.barValue}>{d.count > 0 ? d.count : ''}</span>
                    <div
                      className={`${css.bar} ${d.count === 0 ? css.barEmpty : ''}`}
                      style={{ height: d.count === 0 ? '4px' : `${Math.max((d.count / maxCount) * 200, 10)}px` }}
                    >
                      <div className={css.barGlow} />
                    </div>
                    <span className={css.barLabel}>{formatDay(d.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Top pages */}
        <Col xs={24} lg={8}>
          <Card variant="borderless" className={css.chartCard} styles={{ body: { padding: "24px", height: "100%" } }}>
            <Space align="center" style={{ marginBottom: 24 }}>
              <div className={css.sectionIcon} style={{ background: "#eff6ff", color: "#3b82f6" }}><FileText size={20} /></div>
              <Title level={4} style={{ margin: 0 }}>หน้ายอดนิยมเดือนนี้</Title>
            </Space>

            {(data?.topPages ?? []).length > 0 ? (
              <ul className={css.pageList}>
                {data!.topPages.map((p, i) => (
                  <li key={i} className={css.pageItem}>
                    <div className={css.pageInfo}>
                      <div className={css.pageRank}>{i + 1}</div>
                      <span className={css.pageName} title={p.pageUrl}>
                        {getPageName(p.pageUrl, data?.translations || {})}
                      </span>
                    </div>
                    <span className={css.pageCount}>
                      {p.count.toLocaleString()}
                      <span className={css.pageCountLabel}> ครั้ง</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={css.emptyPages}>
                <FileText size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                <Text type="secondary">ยังไม่มีข้อมูลการเข้าชมหน้าเว็บในเดือนนี้</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <div className={css.footerCard}>
        <Text type="secondary" strong>ระบบจัดการเว็บไซต์ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 13 }}>เลือกเมนูด้านซ้ายเพื่อจัดการเนื้อหาของเว็บไซต์</Text>
      </div>
    </div>
  );
}
