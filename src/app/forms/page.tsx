"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, FileText, Search, ChevronLeft, Users, Banknote, HandCoins, HeartHandshake, FileWarning, UserCheck, Shield, FolderOpen } from "lucide-react";
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

// Reverse map: Thai name → English key
const GROUP_THAI_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(GROUP_KEY_MAP).map(([k, v]) => [v, k])
);

// Group metadata for category overview cards
const GROUP_META: { key: string; label: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "member-registration", label: "แบบฟอร์มสมัครสมาชิก", desc: "สมัครสมาชิกสามัญ ก, ข และสมทบ", icon: <Users size={28} />, color: "#0369a1", bg: "#f0f9ff" },
  { key: "deposit-withdraw", label: "แบบฟอร์มเงินฝาก-ถอน", desc: "ฝาก ถอน โอน เงินฝากทุกประเภท", icon: <Banknote size={28} />, color: "#16a34a", bg: "#f0fdf4" },
  { key: "loan", label: "แบบฟอร์มเกี่ยวกับเงินกู้", desc: "กู้ฉุกเฉิน สามัญ พิเศษ", icon: <HandCoins size={28} />, color: "#E8652B", bg: "#fff5f0" },
  { key: "welfare", label: "แบบฟอร์มขอสวัสดิการ", desc: "สวัสดิการสมาชิกทุกประเภท", icon: <HeartHandshake size={28} />, color: "#7c3aed", bg: "#f5f3ff" },
  { key: "complaint", label: "แบบฟอร์มหนังสือร้องทุกข์", desc: "ร้องเรียน ร้องทุกข์", icon: <FileWarning size={28} />, color: "#dc2626", bg: "#fef2f2" },
  { key: "beneficiary", label: "หนังสือแต่งตั้งผู้รับโอนประโยชน์", desc: "แต่งตั้งผู้รับผลประโยชน์", icon: <UserCheck size={28} />, color: "#0891b2", bg: "#ecfeff" },
  { key: "insurance", label: "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์", desc: "ประกันภัยกลุ่มสมาชิก", icon: <Shield size={28} />, color: "#be185d", bg: "#fdf2f8" },
  { key: "other", label: "แบบฟอร์มอื่นๆ", desc: "แบบฟอร์มทั่วไป", icon: <FolderOpen size={28} />, color: "#64748b", bg: "#f8fafc" },
];

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
  const router = useRouter();
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
    } else {
      setFilterGroup(null);
      setSearch("");
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

  // Count forms per group (for category overview)
  const countByGroup = (groupThaiName: string) =>
    items.filter((i) => i.group === groupThaiName).length;

  // ─── Category Overview Mode (no group selected) ───
  const showOverview = !filterGroup && !search;

  // ─── Filtered Mode ───
  const filtered = items.filter((i) => {
    if (i.category !== activeTab) return false;
    if (filterGroup && i.group !== filterGroup) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groups = [...new Set(filtered.map((i) => i.group))];

  const availableCategories = CATEGORIES.filter((cat) =>
    items.some((i) => i.category === cat && (!filterGroup || i.group === filterGroup))
  );

  useEffect(() => {
    if (items.length === 0 || showOverview) return;
    const avail = CATEGORIES.filter((cat) =>
      items.some((i) => i.category === cat && (!filterGroup || i.group === filterGroup))
    );
    if (avail.length > 0 && !avail.includes(activeTab)) {
      setActiveTab(avail[0]);
    }
  }, [items, activeTab, filterGroup, showOverview]);

  const countByCategory = (cat: string) =>
    items.filter((i) => i.category === cat && (!filterGroup || i.group === filterGroup)).length;

  const handleGroupClick = (groupKey: string) => {
    router.push(`/forms?group=${groupKey}`);
  };

  const handleBackToOverview = () => {
    router.push("/forms");
  };

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>
          {showOverview ? "ดาวน์โหลดแบบฟอร์ม" : filterGroup || "แบบฟอร์มต่างๆ"}
        </h1>
        <p className={css.heroSub}>
          {showOverview
            ? "เลือกประเภทแบบฟอร์มที่ต้องการดาวน์โหลด"
            : "ดาวน์โหลดแบบฟอร์มสำหรับสมาชิก สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"}
        </p>
      </div>

      <div className={css.content}>
        {showOverview ? (
          /* ════════════════════════════════════════════
             Category Overview — show group cards
             ════════════════════════════════════════════ */
          <>
            {loading ? (
              <div className={css.catGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={css.catSkeleton}>
                    <div className={css.catSkeletonIcon} />
                    <div className={css.catSkeletonLines}>
                      <div className={css.skeletonLine} style={{ width: "70%" }} />
                      <div className={css.skeletonLine} style={{ width: "50%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={css.catGrid}>
                {GROUP_META.map((g, idx) => {
                  const count = countByGroup(g.label);
                  return (
                    <button
                      key={g.key}
                      className={`${css.catCard} ${css.catCardFadeIn}`}
                      style={{
                        "--cat-color": g.color,
                        "--cat-bg": g.bg,
                        animationDelay: `${idx * 60}ms`,
                      } as React.CSSProperties}
                      onClick={() => handleGroupClick(g.key)}
                    >
                      <div className={css.catIconWrap}>
                        {g.icon}
                      </div>
                      <div className={css.catInfo}>
                        <h3 className={css.catLabel}>{g.label}</h3>
                        <p className={css.catDesc}>{g.desc}</p>
                      </div>
                      <div className={css.catMeta}>
                        <span className={css.catCount}>{count} รายการ</span>
                        <span className={css.catArrow}>&#8250;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ════════════════════════════════════════════
             Filtered View — form list by group
             ════════════════════════════════════════════ */
          <>
            {/* Back button */}
            <button className={css.backBtn} onClick={handleBackToOverview}>
              <ChevronLeft size={18} />
              <span>กลับไปหน้ารวมแบบฟอร์ม</span>
            </button>

            {/* Category Tabs */}
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

            {/* Search */}
            <div className={css.searchBar}>
              <Search size={16} className={css.searchIcon} />
              <input
                type="text"
                placeholder="ค้นหาแบบฟอร์ม..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                className={css.searchInput}
              />
              {!loading && (
                <span className={css.resultCount}>พบ {filtered.length} รายการ</span>
              )}
            </div>

            {/* Content */}
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
          </>
        )}
      </div>
    </>
  );
}
