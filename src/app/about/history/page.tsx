"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileTextOutlined } from "@ant-design/icons";
import css from "./page.module.css";

export default function HistoryPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages/history")
      .then((res) => res.json())
      .then((data) => setContent(data.content || ""))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>ประวัติสหกรณ์</h1>
        <div className={css.breadcrumb}>
          <Link href="/" className={css.breadcrumbLink}>หน้าหลัก</Link>
          <span className={css.breadcrumbSep}>/</span>
          <span className={css.breadcrumbCurrent}>ประวัติสหกรณ์</span>
        </div>
      </div>

      {/* Content */}
      <div className={css.container}>
        {loading ? (
          <div className={css.loading}>กำลังโหลด...</div>
        ) : content ? (
          <div
            className={css.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className={css.empty}>
            <div className={css.emptyIcon}><FileTextOutlined /></div>
            <p className={css.emptyText}>ยังไม่มีเนื้อหา — กรุณาเพิ่มเนื้อหาผ่านระบบ Admin</p>
          </div>
        )}
      </div>
    </>
  );
}
