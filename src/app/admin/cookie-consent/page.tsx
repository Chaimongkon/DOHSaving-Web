"use client";

import React, { useState, useEffect } from "react";
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface CookieStats {
  total: number;
  accepted: number;
  rejected: number;
  acceptRate: number;
}

interface CookieRecord {
  id: number;
  userId: string;
  consentStatus: boolean;
  cookieCategories: {
    necessary?: boolean;
    analytics?: boolean;
    marketing?: boolean;
    preferences?: boolean;
  } | null;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export default function CookieConsentPage() {
  const [stats, setStats] = useState<CookieStats | null>(null);
  const [records, setRecords] = useState<CookieRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cookie-consent")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecords(data.recent || []);
      })
      .catch((err) => console.error("Failed to fetch:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return <div className={css.loading}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className={css.header}>
        <h1 className={css.title}>Cookie Consent — สถิติความยินยอม</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className={css.stats}>
          <div className={css.statCard}>
            <p className={css.statLabel}>ทั้งหมด</p>
            <p className={`${css.statValue} ${css.statTotal}`}>{stats.total}</p>
          </div>
          <div className={css.statCard}>
            <p className={css.statLabel}>ยอมรับ</p>
            <p className={`${css.statValue} ${css.statAccepted}`}>{stats.accepted}</p>
          </div>
          <div className={css.statCard}>
            <p className={css.statLabel}>ปฏิเสธ</p>
            <p className={`${css.statValue} ${css.statRejected}`}>{stats.rejected}</p>
          </div>
          <div className={css.statCard}>
            <p className={css.statLabel}>อัตราการยอมรับ</p>
            <p className={`${css.statValue} ${css.statRate}`}>
              {stats.acceptRate}<span className={css.statSuffix}>%</span>
            </p>
          </div>
        </div>
      )}

      {/* Recent records table */}
      <div className={css.tableWrap}>
        <div className={css.tableHeader}>
          <h3 className={css.tableTitle}>รายการล่าสุด (20 รายการ)</h3>
        </div>

        {records.length === 0 ? (
          <div className={css.emptyState}>
            <div className={css.emptyIcon}><SafetyCertificateOutlined /></div>
            <p>ยังไม่มีข้อมูล cookie consent</p>
          </div>
        ) : (
          <table className={css.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitor</th>
                <th>สถานะ</th>
                <th>ประเภทที่อนุญาต</th>
                <th>IP</th>
                <th>วันที่</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td><span className={css.userId}>{r.userId}</span></td>
                  <td>
                    {r.consentStatus ? (
                      <span className={`${css.badge} ${css.badgeAccepted}`}>
                        <CheckCircleOutlined /> ยอมรับ
                      </span>
                    ) : (
                      <span className={`${css.badge} ${css.badgeRejected}`}>
                        <CloseCircleOutlined /> ปฏิเสธ
                      </span>
                    )}
                  </td>
                  <td>
                    {r.cookieCategories ? (
                      <>
                        {r.cookieCategories.analytics && (
                          <span className={`${css.categoryTag} ${css.categoryOn}`}>วิเคราะห์</span>
                        )}
                        {r.cookieCategories.marketing && (
                          <span className={`${css.categoryTag} ${css.categoryOn}`}>การตลาด</span>
                        )}
                        {r.cookieCategories.preferences && (
                          <span className={`${css.categoryTag} ${css.categoryOn}`}>ตั้งค่า</span>
                        )}
                        {!r.cookieCategories.analytics &&
                          !r.cookieCategories.marketing &&
                          !r.cookieCategories.preferences && (
                            <span className={`${css.categoryTag} ${css.categoryOff}`}>จำเป็นเท่านั้น</span>
                          )}
                      </>
                    ) : (
                      <span className={`${css.categoryTag} ${css.categoryOff}`}>—</span>
                    )}
                  </td>
                  <td><span className={css.ip}>{r.ipAddress}</span></td>
                  <td>{formatDate(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
