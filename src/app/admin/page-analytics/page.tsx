/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Select, Spin, Empty } from "antd";
import {
  BarChart3,
  Eye,
  Users,
  LayoutTemplate,
  Activity,
  Medal,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import css from "./page.module.css";

const { Option } = Select;

interface PageData {
  rank: number;
  pageUrl: string;
  pageName: string;
  views: number;
}

interface Statistics {
  totalViews: number;
  totalUniqueUsers: number;
  totalPages: number;
}

export default function PageAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [stats, setStats] = useState<Statistics>({
    totalViews: 0,
    totalUniqueUsers: 0,
    totalPages: 0,
  });
  const [period, setPeriod] = useState<string>("month");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/page-analytics?period=${p}`);
      const json = await res.json();
      if (json.success) {
        setPages(json.data.pages);
        setStats(json.data.statistics);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const maxViews = pages.length > 0 ? pages[0].views : 1;
  const topChartData = pages.slice(0, 20);

  const totalListPages = Math.ceil(pages.length / pageSize);
  const paginatedPages = pages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Elegant, muted tech colors for the bars
  const colors = [
    "#3b82f6", "#60a5fa", "#10b981", "#34d399", "#f59e0b",
    "#fbbf24", "#8b5cf6", "#a78bfa", "#ec4899", "#f472b6"
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={css.chartTooltip}>
          <p className={css.tooltipLabel}>{label}</p>
          <div className={css.tooltipValueWrap}>
            <Eye className={css.tooltipIcon} size={14} />
            <span className={css.tooltipValue}>
              {payload[0].value.toLocaleString()}
              <span className={css.tooltipUnit}> ครั้ง</span>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={css.container}>
      {/* Premium Compact Header */}
      <div className={css.headerSection}>
        <div className={css.headerTitleWrap}>
          <div className={css.iconBox}>
            <BarChart3 className={css.titleIcon} size={22} strokeWidth={2.5} />
          </div>
          <div className={css.titleStack}>
            <h1 className={css.pageTitle}>Page Analytics</h1>
            <p className={css.pageSubtitle}>วิเคราะห์การเข้าชมเว็บไซต์</p>
          </div>
        </div>

        <div className={css.periodSelectorWrap}>
          <div className={css.selectorLabel}>
            <Calendar size={14} className={css.calendarIcon} />
            <span>ช่วงเวลา:</span>
          </div>
          <Select
            value={period}
            onChange={setPeriod}
            className={css.periodSelect}
            classNames={{ popup: { root: css.selectPopup } }}
            size="middle"
            variant="borderless"
          >
            <Option value="month">เดือนนี้</Option>
            <Option value="7d">7 วันล่าสุด</Option>
            <Option value="30d">30 วันล่าสุด</Option>
            <Option value="90d">90 วันล่าสุด</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className={css.loadingWrap}>
          <Spin />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className={css.statsGrid}>
            <div className={`${css.statCard} ${css.statViews}`}>
              <div className={css.statIconWrap}>
                <Eye size={20} className={css.statIcon} strokeWidth={2.5} />
              </div>
              <div className={css.statInfo}>
                <span className={css.statLabel}>ยอดเข้าชมทั้งหมด</span>
                <span className={css.statValue}>{stats.totalViews.toLocaleString()}</span>
              </div>
              <Activity className={css.bgWatermark} size={80} strokeWidth={1} />
            </div>

            <div className={`${css.statCard} ${css.statUsers}`}>
              <div className={css.statIconWrap}>
                <Users size={20} className={css.statIcon} strokeWidth={2.5} />
              </div>
              <div className={css.statInfo}>
                <span className={css.statLabel}>ผู้ใช้งาน (IP ไม่ซ้ำ)</span>
                <span className={css.statValue}>{stats.totalUniqueUsers.toLocaleString()}</span>
              </div>
              <Users className={css.bgWatermark} size={80} strokeWidth={1} />
            </div>

            <div className={`${css.statCard} ${css.statPages}`}>
              <div className={css.statIconWrap}>
                <LayoutTemplate size={20} className={css.statIcon} strokeWidth={2.5} />
              </div>
              <div className={css.statInfo}>
                <span className={css.statLabel}>หน้าทั้งหมดที่ถูกเข้าชม</span>
                <span className={css.statValue}>{stats.totalPages.toLocaleString()}</span>
              </div>
              <LayoutTemplate className={css.bgWatermark} size={80} strokeWidth={1} />
            </div>
          </div>

          <div className={css.contentStack}>
            {/* Chart Section */}
            <div className={css.chartCard}>
              <div className={css.cardHeader}>
                <div className={css.cardTitleWrap}>
                  <div className={css.cardIconBox}><BarChart3 size={14} strokeWidth={2.5} /></div>
                  <h2 className={css.cardTitle}>Top 20 หน้าที่เข้าชมสูงสุด</h2>
                </div>
              </div>
              {pages.length === 0 ? (
                <Empty description="ไม่มีข้อมูลในช่วงเวลานี้" className={css.emptyData} />
              ) : (
                <div className={css.chartWrap}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={topChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                      barSize={24}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="pageName"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9', radius: 4 }} />
                      <Bar
                        dataKey="views"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                      >
                        {topChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* List Section */}
            <div className={css.listCard}>
              <div className={css.cardHeader}>
                <div className={css.cardTitleWrap}>
                  <div className={css.cardIconBox}><LayoutTemplate size={14} strokeWidth={2.5} /></div>
                  <h2 className={css.cardTitle}>ตารางยอดเข้าชมทั้งหมด</h2>
                </div>
                <div className={css.headerBadge}>
                  <span className={css.badgeDot}></span>
                  {pages.length} หน้า
                </div>
              </div>

              <div className={css.listContainer}>
                {pages.length === 0 ? (
                  <Empty description="ไม่มีข้อมูลในช่วงเวลานี้" className={css.emptyData} />
                ) : (
                  <div className={css.list}>
                    {paginatedPages.map((page) => (
                      <div key={page.pageUrl} className={css.listItem}>
                        <div
                          className={css.rankBadge}
                          data-rank={page.rank <= 3 ? page.rank : 'default'}
                        >
                          {page.rank <= 3 ? <Medal size={16} strokeWidth={2.5} /> : `#${page.rank}`}
                        </div>

                        <div className={css.pageInfo}>
                          <span className={css.pageName} title={page.pageName}>{page.pageName}</span>
                          <span className={css.pageUrl}>{page.pageUrl}</span>

                          <div className={css.barWrap}>
                            <div
                              className={css.bar}
                              style={{ width: `${Math.max((page.views / maxViews) * 100, 1)}%` }}
                              data-rank={page.rank <= 3 ? page.rank : 'default'}
                            />
                          </div>
                        </div>

                        <div className={css.viewsCount}>
                          <span className={css.viewsNumber} data-rank={page.rank <= 3 ? page.rank : 'default'}>
                            {page.views.toLocaleString()}
                          </span>
                          <span className={css.viewsLabel}>ครั้ง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalListPages > 1 && (
                <div className={css.pagination}>
                  <button
                    className={css.pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalListPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`${css.pageBtn} ${p === currentPage ? css.pageBtnActive : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={css.pageBtn}
                    disabled={currentPage === totalListPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
