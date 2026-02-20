"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Download, FileText, Search } from "lucide-react";
import css from "./page.module.css";

const CATEGORIES = ["สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ", "สมาชิกทุกประเภท"];

const GROUP_KEY_MAP: Record<string, string> = {
  "member-registration": "แบบฟอร์มสมัครสมาชิก",
  "deposit-withdraw": "แบบฟอร์มเงินฝาก-ถอน",
  "loan": "แบบฟอร์มเกี่ยวกับเงินกู้",
  "welfare": "แบบฟอร์มขอสวัสดิการ",
  "complaint": "แบบฟอร์มหนังสือร้องทุกข์",
  "beneficiary": "หนังสือแต่งตั้งผู้รับโอนประโยชน์",
  "insurance": "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์",
  "other": "แบบฟอร์มอื่นๆ",
};

interface FormItem {
  id: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string | null;
}

export default function FormsPage() {
  return (
    <Suspense fallback={null}>
      <FormsContent />
    </Suspense>
  );
}

function FormsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  // Read query params on mount — map English key to Thai group name
  useEffect(() => {
    const q = searchParams.get("q");
    const groupKey = searchParams.get("group");
    if (q) setSearch(q);
    if (groupKey) {
      const thaiName = GROUP_KEY_MAP[groupKey] || groupKey;
      setFilterGroup(thaiName);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/forms");
        if (res.ok) setItems(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Filter by active tab + search + group from URL
  const filtered = items.filter((i) => {
    if (i.category !== activeTab) return false;
    if (filterGroup && i.group !== filterGroup) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by "group" field
  const groups = [...new Set(filtered.map((i) => i.group))];

  // Only categories that have items (respect filterGroup when active)
  const availableCategories = CATEGORIES.filter((cat) =>
    items.some((i) => i.category === cat && (!filterGroup || i.group === filterGroup))
  );

  // Auto-select first available tab when data or filter changes
  useEffect(() => {
    if (items.length === 0) return;
    const avail = CATEGORIES.filter((cat) =>
      items.some((i) => i.category === cat && (!filterGroup || i.group === filterGroup))
    );
    if (avail.length > 0 && !avail.includes(activeTab)) {
      setActiveTab(avail[0]);
    }
  }, [items, activeTab, filterGroup]);

  // Count per category (respect filterGroup)
  const countByCategory = (cat: string) =>
    items.filter((i) => i.category === cat && (!filterGroup || i.group === filterGroup)).length;

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>{filterGroup || "แบบฟอร์มต่างๆ"}</h1>
        <p className={css.heroSub}>ดาวน์โหลดแบบฟอร์มสำหรับสมาชิก สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
      </div>

      <div className={css.content}>
        {/* ── Category Tabs ── */}
        <div className={css.tabBar}>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`${css.tab} ${activeTab === cat ? css.tabActive : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              <span className={css.tabLabel}>{cat}</span>
              <span className={css.tabCount}>{countByCategory(cat)}</span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className={css.searchBar}>
          <Search size={16} className={css.searchIcon} />
          <input
            type="text"
            placeholder="ค้นหาแบบฟอร์ม..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFilterGroup(null); }}
            className={css.searchInput}
          />
          {filterGroup && (
            <button className={css.clearFilter} onClick={() => { setFilterGroup(null); setSearch(""); }}>
              ✕ ล้างตัวกรอง
            </button>
          )}
          {!loading && (
            <span className={css.resultCount}>พบ {filtered.length} รายการ</span>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className={css.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={css.skeleton}>
                <div className={css.skeletonIcon} />
                <div className={css.skeletonLines}>
                  <div className={css.skeletonLine} style={{ width: "70%" }} />
                  <div className={css.skeletonLine} style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={css.emptyBox}>
            <FileText size={40} strokeWidth={1.2} />
            <p>ไม่พบแบบฟอร์มสำหรับ{activeTab}</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupItems = filtered.filter((i) => i.group === group);
            return (
              <div key={group} className={css.groupSection}>
                <h2 className={css.groupTitle}>{group}</h2>
                <div className={css.grid}>
                  {groupItems.map((item, idx) => (
                    <a
                      key={item.id}
                      href={item.fileUrl || "#"}
                      target={item.fileUrl ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`${css.card} ${css.cardFadeIn} ${item.fileUrl ? "" : css.cardDisabled}`}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      onClick={(e) => { if (!item.fileUrl) e.preventDefault(); }}
                    >
                      <div className={css.cardIcon}>
                        <Image src="/images/logo/pdf.png" alt="PDF" width={44} height={44} />
                      </div>
                      <div className={css.cardInfo}>
                        <p className={css.cardTitle}>{item.title}</p>
                        <p className={css.cardMeta}>{item.category}</p>
                      </div>
                      <div className={css.cardAction}>
                        {item.fileUrl ? (
                          <Download size={16} />
                        ) : (
                          <span className={css.noFile}>ไม่มีไฟล์</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
