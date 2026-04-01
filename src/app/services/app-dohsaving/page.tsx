/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LoadingOutlined, HomeOutlined, PictureOutlined } from "@ant-design/icons";
import css from "./page.module.css";

interface Section {
  id: number;
  groupTitle: string | null;
  groupOrder: number;
  title: string;
  coverUrl: string | null;
  images: string;
  sortOrder: number;
}

interface Group {
  groupTitle: string;
  items: Section[];
}

export default function AppDohsavingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app-guide");
      if (res.ok) setSections(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group sections by groupTitle
  const groups: Group[] = [];
  for (const s of sections) {
    const gt = s.groupTitle || "(ไม่มีกลุ่ม)";
    let group = groups.find((g) => g.groupTitle === gt);
    if (!group) { group = { groupTitle: gt, items: [] }; groups.push(group); }
    group.items.push(s);
  }

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.breadcrumb}>
          <Link href="/"><HomeOutlined /></Link>
          <span>/</span>
          <span>บริการ</span>
          <span>/</span>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>Application DOHSaving</span>
        </div>
        <h1 className={css.heroTitle}>วิธีใช้งาน Application DOHSaving</h1>
        <p className={css.heroSub}>เพิ่มความสะดวกสบายกับบริการออนไลน์ ทุกที่ ทุกเวลา</p>
      </div>

      <div className={css.content}>
        {/* Intro */}
        <div className={css.intro}>
          เพื่อความสะดวกในการทำธุรกรรมของสมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง ทุกท่าน ทางสหกรณ์ฯ ได้จัดทำคู่มือการใช้งานแอปพลิเคชั่น เพื่อง่ายต่อการใช้งาน
          <br />
          <strong>คลิกที่รูปภาพเพื่อดูรายละเอียดวิธีใช้งาน</strong>
        </div>

        {/* Loading */}
        {loading && (
          <div className={css.loading}>
            <LoadingOutlined style={{ fontSize: 24, marginBottom: 8 }} /><br />กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Empty */}
        {!loading && sections.length === 0 && (
          <div className={css.empty}>
            <PictureOutlined style={{ fontSize: 40, marginBottom: 12, display: "block" }} />
            <p>ยังไม่มีหัวข้อ</p>
          </div>
        )}

        {/* Grouped Sections */}
        {groups.map((group, gIdx) => (
          <div key={gIdx} className={css.section}>
            <h2 className={css.sectionTitle}>
              <span className={css.sectionNumber}>{gIdx + 1}.</span> {group.groupTitle}
            </h2>
            <div className={css.albumGrid}>
              {group.items.map((item) => {
                let fallbackCover = "";
                try {
                  const parsed = JSON.parse(item.images || "[]");
                  if (parsed[0]?.imageUrl) fallbackCover = parsed[0].imageUrl;
                } catch { /* */ }
                const cover = item.coverUrl || fallbackCover;

                return (
                  <Link
                    key={item.id}
                    href={`/services/app-dohsaving/${item.id}`}
                    className={css.albumCard}
                  >
                    {cover ? (
                      <img src={cover} alt={item.title} className={css.albumCover} loading="lazy" />
                    ) : (
                      <div className={css.albumCover} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PictureOutlined style={{ fontSize: 40, color: "#d1d5db" }} />
                      </div>
                    )}
                    <div className={css.albumInfo}>
                      <h3 className={css.albumTitle}>{item.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
