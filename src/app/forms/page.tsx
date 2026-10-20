"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Eye,

  FileText,
  History,
  Home,
  Info,
  MessageCircleQuestion,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  Users3D, Wallet3D, HandCoins3D, HeartGift3D,
  Complaint3D, Certificate3D, Shield3D, Folder3D,
} from "@/components/icons/ThreeDIcons";
import { type MemberKey, memberKeyOf, readSavedMember, saveMember } from "@/lib/memberType";
import css from "./page.module.css";

interface FormItem {
  id: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string | null;
  fileSize: number | null;
}

const EVERYONE = "สมาชิกทุกประเภท";
const MEMBER_ORDER = ["สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ", EVERYONE];
const MEMBER_TONE: Record<string, string> = {
  "สมาชิกสามัญ ก": "memberA",
  "สมาชิกสามัญ ข": "memberB",
  "สมาชิกสมทบ": "memberC",
  [EVERYONE]: "memberAll",
};

/**
 * หมวดแบบฟอร์ม — key ตรงกับ ?group= ที่เมนูและหน้าบริการลิงก์มา
 * ไอคอน 3 มิติและคำอธิบายชุดเดิมที่สมาชิกคุ้นตา
 */
const GROUPS: { key: string; name: string; desc: string; icon: React.ReactNode; tone: string }[] = [
  { key: "member-registration", name: "แบบฟอร์มสมัครสมาชิก", desc: "สมัครสมาชิกสามัญ ก, ข และสมทบ", icon: <Users3D size={56} />, tone: "toneMember" },
  { key: "deposit-withdraw", name: "แบบฟอร์มเงินฝาก-ถอน", desc: "ฝาก ถอน โอน เงินฝากทุกประเภท", icon: <Wallet3D size={56} />, tone: "toneDeposit" },
  { key: "loan", name: "แบบฟอร์มเกี่ยวกับเงินกู้", desc: "กู้ฉุกเฉิน สามัญ พิเศษ", icon: <HandCoins3D size={56} />, tone: "toneLoan" },
  { key: "welfare", name: "แบบฟอร์มขอสวัสดิการ", desc: "สวัสดิการสมาชิกทุกประเภท", icon: <HeartGift3D size={56} />, tone: "toneWelfare" },
  { key: "complaint", name: "แบบฟอร์มหนังสือร้องทุกข์", desc: "ร้องเรียน ร้องทุกข์", icon: <Complaint3D size={56} />, tone: "toneComplaint" },
  { key: "beneficiary", name: "หนังสือแต่งตั้งผู้รับโอนประโยชน์", desc: "แต่งตั้งผู้รับผลประโยชน์", icon: <Certificate3D size={56} />, tone: "toneShare" },
  { key: "insurance", name: "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์", desc: "ประกันภัยกลุ่มสมาชิก", icon: <Shield3D size={56} />, tone: "toneInsurance" },
  { key: "other", name: "แบบฟอร์มอื่นๆ", desc: "แบบฟอร์มทั่วไป", icon: <Folder3D size={56} />, tone: "toneDefault" },
];
/** หมวดที่แอดมินตั้งชื่อเองนอกรายการ — นับรวมใน "อื่นๆ" ไม่ให้หาย */
const groupKeyOf = (item: FormItem) => GROUPS.find((g) => g.name === item.group)?.key ?? "other";

const RECENT_KEY = "doh-forms-recent";
const RECENT_MAX = 4;

const readRecent = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fileExt = (url: string) => url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "pdf";

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

  const [items, setItems] = useState<FormItem[] | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [recentIds, setRecentIds] = useState<number[]>(readRecent);
  // ประเภทสมาชิกที่เคยเลือกไว้ (จำในเครื่อง ใช้ร่วมกับหน้าระเบียบ/ประกาศ)
  const [savedMember, setSavedMember] = useState<MemberKey | null>(readSavedMember);
  // แท็บประเภทสมาชิกที่เลือกไว้ แยกตามหมวด
  const [tabByGroup, setTabByGroup] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data: FormItem[] = [];
      try {
        const res = await fetch("/api/forms");
        if (res.ok) data = await res.json();
      } catch { /* ignore */ }
      if (!cancelled) setItems(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = items === null;
  const query = search.trim().toLowerCase();
  const activeGroup = GROUPS.find((g) => g.key === searchParams.get("group")) ?? null;
  // ไม่ได้เลือกหมวดและไม่ได้ค้นหา → หน้ารวมหมวด (แบบเดิมที่สมาชิกคุ้นเคย)
  const showOverview = !activeGroup && !query;

  const openGroup = (key: string) => {
    setSearch("");
    router.push(`/forms?group=${key}`);
    window.scrollTo({ top: 0 });
  };

  const backToOverview = () => {
    setSearch("");
    router.push("/forms");
  };

  const markRecent = (id: number) => {
    const next = [id, ...recentIds.filter((r) => r !== id)].slice(0, RECENT_MAX);
    setRecentIds(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* โหมดส่วนตัว — ไม่จำก็ยังใช้งานได้ */ }
  };

  const countOf = (key: string) => (items ?? []).filter((i) => groupKeyOf(i) === key).length;

  const matchesQuery = (i: FormItem) =>
    !query || `${i.title} ${i.group} ${i.category}`.toLowerCase().includes(query);

  // แบบฟอร์มในหมวดที่เลือก (หน้ารวม + ค้นหา = ค้นจากทุกหมวด)
  const inScope = useMemo(
    () => (items ?? []).filter((i) => !activeGroup || groupKeyOf(i) === activeGroup.key),
    [items, activeGroup]
  );

  // แท็บประเภทสมาชิกที่มีแบบฟอร์มในหมวดนี้
  // ไม่เลือกแท็บแทนผู้ใช้: ครั้งแรกให้เลือกประเภทสมาชิกเอง แล้วจำไว้ใช้ครั้งถัดไป
  // (ถ้าเปิดมาเป็นแท็บแรกเลย สมาชิกประเภทอื่นที่ไม่สังเกตแท็บจะดาวน์โหลดแบบฟอร์มผิดฉบับ)
  const tabs = activeGroup ? MEMBER_ORDER.filter((c) => inScope.some((i) => i.category === c)) : [];
  const pickedTab = activeGroup ? tabByGroup[activeGroup.key] : undefined;
  const rememberedTab = savedMember ? tabs.find((c) => memberKeyOf(c) === savedMember) : undefined;
  const activeTab =
    pickedTab && tabs.includes(pickedTab) ? pickedTab : rememberedTab ?? (tabs.length === 1 ? tabs[0] : null);
  const fromMemory = activeTab !== null && activeTab === rememberedTab && pickedTab !== activeTab;

  const selectTab = (category: string) => {
    if (!activeGroup) return;
    setTabByGroup((prev) => ({ ...prev, [activeGroup.key]: category }));
    const key = memberKeyOf(category);
    if (key) {
      setSavedMember(key);
      saveMember(key);
    }
  };
  const tabCount = (c: string) => inScope.filter((i) => i.category === c).length;

  // ค้นหาจากทุกหมวดเสมอ — พิมพ์ชื่อแบบฟอร์มแล้วเจอแน่ ไม่ว่ากำลังอยู่หมวดไหน
  const listItems = query
    ? (items ?? []).filter(matchesQuery)
    : inScope.filter((i) => i.category === activeTab);
  // หน้าหมวด (มีแท็บประเภทสมาชิก) แสดงเมื่อไม่ได้ค้นหา
  const groupView = query ? null : activeGroup;
  // อยู่ในหมวดที่มีหลายประเภทสมาชิก แต่ยังไม่ได้เลือกประเภท → ให้เลือกก่อนแสดงรายการ
  const needsMember = !!groupView && !activeTab && tabs.length > 0;

  const recent = useMemo(
    () =>
      recentIds
        .map((id) => (items ?? []).find((i) => i.id === id))
        .filter((i): i is FormItem => !!i?.fileUrl),
    [recentIds, items]
  );

  const downloadName = (item: FormItem) =>
    `${item.title}${item.category !== EVERYONE ? ` (${item.category})` : ""}.${fileExt(item.fileUrl ?? "")}`;

  return (
    <>
      {/* ── Hero + ค้นหา ── */}
      <section className={css.hero}>
        <div className={css.heroGlow} />
        <div className={css.heroInner}>
          <nav className={css.breadcrumb} aria-label="breadcrumb">
            <Link href="/" aria-label="หน้าหลัก">
              <Home size={15} />
            </Link>
            <ChevronRight size={14} />
            {activeGroup ? (
              <>
                <Link href="/forms" className={css.breadcrumbLink}>
                  ดาวน์โหลดแบบฟอร์ม
                </Link>
                <ChevronRight size={14} />
                <span className={css.breadcrumbActive}>{activeGroup.name}</span>
              </>
            ) : (
              <span className={css.breadcrumbActive}>ดาวน์โหลดแบบฟอร์ม</span>
            )}
          </nav>
          <h1 className={css.heroTitle}>ดาวน์โหลดแบบฟอร์ม</h1>
          <p className={css.heroSub}>เลือกหมวดแบบฟอร์มที่ต้องการ หรือพิมพ์ชื่อแบบฟอร์มในช่องค้นหา</p>

          <label className={css.search}>
            <Search size={22} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ค้นหา เช่น กู้ฉุกเฉิน ฝากเงิน สวัสดิการ"
              aria-label="ค้นหาแบบฟอร์ม"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="ล้างคำค้นหา">
                <X size={18} />
              </button>
            )}
          </label>
        </div>
      </section>

      <main className={css.main}>
        {showOverview ? (
          /* ═══════════ หน้ารวม: เลือกหมวด ═══════════ */
          <>
            {recent.length > 0 && (
              <section className={css.recent}>
                <h2 className={css.recentTitle}>
                  <History size={18} /> แบบฟอร์มที่คุณดาวน์โหลดล่าสุด
                </h2>
                <div className={css.recentList}>
                  {recent.map((item) => (
                    <a
                      key={item.id}
                      href={item.fileUrl!}
                      download={downloadName(item)}
                      className={css.recentItem}
                      onClick={() => markRecent(item.id)}
                    >
                      <Download size={17} />
                      <span>
                        {item.title}
                        {item.category !== EVERYONE && <small> · {item.category}</small>}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <h2 className={css.sectionTitle}>เลือกหมวดแบบฟอร์ม</h2>
            <div className={css.catGrid}>
              {GROUPS.map((g) => {
                const count = countOf(g.key);
                return (
                  <button
                    key={g.key}
                    type="button"
                    className={`${css.catCard} ${css[g.tone]}`}
                    onClick={() => openGroup(g.key)}
                  >
                    <span className={css.catIcon}>{g.icon}</span>
                    <span className={css.catText}>
                      <span className={css.catName}>{g.name}</span>
                      <span className={css.catDesc}>{g.desc}</span>
                    </span>
                    <span className={css.catFoot}>
                      <span className={css.catCount}>{loading ? "…" : `${count} รายการ`}</span>
                      <span className={css.catGo}>
                        เปิดดู <ChevronRight size={17} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* ═══════════ หน้าในหมวด (แท็บประเภทสมาชิก แบบเดิม) / ผลการค้นหา ═══════════ */
          <>
            <button type="button" className={css.backBtn} onClick={backToOverview}>
              <ArrowLeft size={19} /> กลับไปหน้ารวมแบบฟอร์ม
            </button>

            <div className={`${css.listHead} ${groupView ? css[groupView.tone] : ""}`}>
              {groupView && <span className={css.listIcon}>{groupView.icon}</span>}
              <div className={css.listHeadText}>
                <h2 className={css.listTitle}>{groupView ? groupView.name : `ผลการค้นหา “${search.trim()}”`}</h2>
                {!loading && (
                  <p className={css.listCount}>
                    {needsMember ? (
                      "เลือกประเภทสมาชิกของคุณด้านล่าง"
                    ) : (
                      <>
                        พบ {listItems.length} รายการ{query ? " · ค้นหาจากทุกหมวด" : ""}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* แท็บประเภทสมาชิก — แบบเดียวกับหน้าเดิม */}
            {groupView && activeTab && tabs.length > 0 && (
              <div className={css.tabBar} role="tablist" aria-label="ประเภทสมาชิก">
                {tabs.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={c === activeTab}
                    className={`${css.tab} ${c === activeTab ? css.tabActive : ""}`}
                    onClick={() => selectTab(c)}
                  >
                    <span className={`${css.tabDot} ${css[MEMBER_TONE[c] ?? "memberAll"]}`} />
                    {c}
                    <span className={css.tabCount}>{tabCount(c)}</span>
                  </button>
                ))}
              </div>
            )}

            {fromMemory && groupView && (
              <p className={css.memoryNote}>
                <Info size={16} /> แสดงตามประเภทสมาชิกที่คุณเลือกไว้ · ถ้าไม่ใช่ประเภทของคุณ เลือกใหม่ได้ที่แท็บด้านบน
              </p>
            )}

            {loading ? (
              <div className={css.skeleton} aria-busy="true" />
            ) : needsMember ? (
              <section className={css.chooser} aria-label="เลือกประเภทสมาชิก">
                <h3 className={css.chooserTitle}>คุณเป็นสมาชิกประเภทใด</h3>
                <p className={css.chooserHint}>
                  แบบฟอร์มหมวดนี้แยกตามประเภทสมาชิก เลือกประเภทของคุณ ระบบจะจำไว้ให้ในครั้งถัดไป
                </p>
                <div className={css.chooserGrid}>
                  {tabs.map((c) => (
                    <button key={c} type="button" className={css.chooserBtn} onClick={() => selectTab(c)}>
                      <span className={`${css.chooserIcon} ${css[MEMBER_TONE[c] ?? "memberAll"]}`}>
                        <Users size={22} />
                      </span>
                      <span className={css.chooserName}>{c}</span>
                      <span className={css.chooserCount}>{tabCount(c)} รายการ</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : listItems.length === 0 ? (
              <div className={css.empty}>
                <FileText size={46} strokeWidth={1.3} />
                <h3>ไม่พบแบบฟอร์มที่ต้องการ</h3>
                <p>{query ? "ลองพิมพ์คำสั้นลง เช่น “กู้” หรือ “ฝาก”" : "หมวดนี้ยังไม่มีแบบฟอร์ม"}</p>
                <button
                  type="button"
                  className={css.resetBtn}
                  onClick={() => (query ? setSearch("") : backToOverview())}
                >
                  {query ? "ล้างคำค้นหา" : "ดูทุกหมวด"}
                </button>
              </div>
            ) : (
              <div className={`${css.grid} ${groupView ? css[groupView.tone] : ""}`}>
                {listItems.map((item) => {
                  const size = formatSize(item.fileSize);
                  return (
                    <article
                      key={item.id}
                      className={`${css.card} ${item.fileUrl ? "" : css.cardDisabled}`}
                    >
                      <div className={css.cardTop}>
                        <span className={css.fileBadge} aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <b>{fileExt(item.fileUrl ?? "pdf").toUpperCase()}</b>
                        </span>
                        <div className={css.cardBody}>
                          <h3 className={css.cardTitle}>{item.title}</h3>
                          <div className={css.cardMeta}>
                            <span className={`${css.memberTag} ${css[MEMBER_TONE[item.category] ?? "memberAll"]}`}>
                              {item.category === EVERYONE ? "ใช้ได้กับสมาชิกทุกประเภท" : `สำหรับ${item.category}`}
                            </span>
                            {!groupView && <span>{item.group}</span>}
                            <span>
                              ไฟล์ {fileExt(item.fileUrl ?? "pdf").toUpperCase()}
                              {size && ` · ${size}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={css.cardActions}>
                        {item.fileUrl ? (
                          <>
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={css.viewBtn}
                              aria-label={`เปิดดู ${item.title}`}
                              onClick={() => markRecent(item.id)}
                            >
                              <Eye size={16} /> เปิดดู
                            </a>
                            <a
                              href={item.fileUrl}
                              download={downloadName(item)}
                              className={css.downloadBtn}
                              aria-label={`ดาวน์โหลด ${item.title}`}
                              onClick={() => markRecent(item.id)}
                            >
                              <Download size={16} /> ดาวน์โหลด
                            </a>
                          </>
                        ) : (
                          <span className={css.noFile}>ยังไม่มีไฟล์</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── ช่วยเหลือ ── */}
        <div className={css.help}>
          <MessageCircleQuestion size={26} />
          <div className={css.helpText}>
            <strong>หาแบบฟอร์มไม่เจอ หรือใช้งานไม่สะดวก?</strong>
            <span>โทรสอบถามเจ้าหน้าที่ได้ ยินดีช่วยเหลือ</span>
          </div>
          <Link href="/contact" className={css.helpBtn}>
            ติดต่อสหกรณ์
          </Link>
        </div>
      </main>
    </>
  );
}
