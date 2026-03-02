"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Home,
  FileText,
  Download,
  BookOpen,
  Scale,
  BellRing,
} from "lucide-react";
import { Book3D, Scales3D, Bell3D } from "@/components/icons/ThreeDIcons";
import css from "./page.module.css";

interface RegItem {
  id: number;
  title: string;
  typeForm: string;
  typeMember: string | null;
  filePath: string | null;
  imagePath: string | null;
  description: string | null;
  sortOrder: number;
}

interface Group {
  typeMember: string;
  items: RegItem[];
}

const TYPE_CONFIG: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
  statute: {
    label: "ข้อบังคับ",
    desc: "ข้อบังคับของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    icon: <Book3D size={64} />,
  },
  rules: {
    label: "ระเบียบ",
    desc: "ระเบียบว่าด้วยการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    icon: <Scales3D size={64} />,
  },
  announcements: {
    label: "ประกาศ",
    desc: "ประกาศของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    icon: <Bell3D size={64} />,
  },
};

const TAB_TYPES = [
  { key: "statute", label: "ข้อบังคับ", icon: <BookOpen size={16} strokeWidth={2} /> },
  { key: "rules", label: "ระเบียบ", icon: <Scale size={16} strokeWidth={2} /> },
  { key: "announcements", label: "ประกาศ", icon: <BellRing size={16} strokeWidth={2} /> },
];

export default function RegulationsPage() {
  const params = useParams();
  const type = (params?.type as string) || "statute";
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.statute;

  const [items, setItems] = useState<RegItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/regulations?type=${type}`);
      if (res.ok) setItems(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  // Group by typeMember
  const groups: Group[] = [];
  for (const item of items) {
    const tm = item.typeMember || "(ทั่วไป)";
    let group = groups.find((g) => g.typeMember === tm);
    if (!group) { group = { typeMember: tm, items: [] }; groups.push(group); }
    group.items.push(item);
  }

  return (
    <>
      <div className={css.hero}>
        <div className={css.heroBackground}>
          <div className={css.blob1}></div>
          <div className={css.blob2}></div>
          <div className={css.blob3}></div>
        </div>
        <div className={css.heroContent}>
          <div className={css.breadcrumb}>
            <Link href="/" className={css.breadcrumbLink}>
              <Home size={14} className={css.breadcrumbIcon} />
              หน้าแรก
            </Link>
            <span className={css.breadcrumbSeparator}>/</span>
            <span className={css.breadcrumbCurrent}>{config.label}</span>
          </div>

          <div className={css.heroIconWrapper}>
            {config.icon}
          </div>

          <h1 className={css.heroTitle}>{config.label}</h1>
          <p className={css.heroSub}>{config.desc}</p>

          <div className={css.tabs}>
            {TAB_TYPES.map((t) => (
              <Link
                key={t.key}
                href={`/regulations/${t.key}`}
                className={`${css.tab} ${t.key === type ? css.tabActive : css.tabInactive}`}
              >
                {t.icon}
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={css.content}>
        <div className={css.statsBarWrapper}>
          <div className={css.statsBar}>
            <div className={css.statsLeft}>
              <div className={css.statsIconContainer}>
                {config.icon}
              </div>
              <div className={css.statsText}>
                <h2 className={css.statsTitle}>{config.label}ทั้งหมด</h2>
                <p className={css.statsCount}>พบ {items.length} รายการ</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className={css.loadingState}>
            <Loader2 className={css.spinner} size={40} />
            <p className={css.loadingText}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className={css.emptyState}>
            <div className={css.emptyIconWrapper}>
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 className={css.emptyTitle}>ไม่พบข้อมูล</h3>
            <p className={css.emptyDesc}>ยังไม่มีข้อมูล{config.label}ในขณะนี้</p>
          </div>
        )}

        {!loading && groups.map((group, gIdx) => (
          <div key={gIdx} className={css.categoryGroup}>
            <div className={css.categoryHeader}>
              <h3 className={css.categoryTitle}>{group.typeMember}</h3>
              <div className={css.categoryLine}></div>
            </div>

            <div className={css.docGrid}>
              {group.items.map((item) => {
                const inner = (
                  <>
                    <div className={css.docCardHeader}>
                      {item.imagePath ? (
                        <div className={css.docImageWrapper}>
                          <img src={item.imagePath} alt={item.title} className={css.docImage} />
                        </div>
                      ) : (
                        <div className={css.docIconSquare}>
                          <FileText size={24} />
                        </div>
                      )}
                    </div>

                    <div className={css.docInfo}>
                      <h4 className={css.docTitle} title={item.title}>{item.title}</h4>
                      {item.description && (
                        <p className={css.docDesc} title={item.description}>{item.description}</p>
                      )}
                    </div>

                    <div className={css.docFooter}>
                      {item.filePath ? (
                        <span className={css.downloadBtn}>
                          <Download size={14} />
                          <span>ดาวน์โหลด</span>
                        </span>
                      ) : (
                        <span className={css.viewBadge}>
                          <FileText size={14} />
                          <span>รายละเอียด</span>
                        </span>
                      )}
                    </div>
                  </>
                );

                if (item.filePath) {
                  return (
                    <a
                      key={item.id}
                      href={item.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.docCard}
                    >
                      {inner}
                    </a>
                  );
                }

                return (
                  <div key={item.id} className={`${css.docCard} ${css.docCardNoLink}`}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
