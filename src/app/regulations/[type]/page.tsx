"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookMarked,
  Briefcase,
  Building2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Home,
  Info,
  type LucideIcon,
  Megaphone,
  PiggyBank,
  ScrollText,
  Search,
  TrendingUp,
  Users,
  Vote,
  X,
} from "lucide-react";
import { Book3D, Scales3D, Bell3D } from "@/components/icons/ThreeDIcons";
import { getPdfCoverDataUrl } from "@/lib/pdfCover";
import { type MemberKey, memberKeyOf, readSavedMember, saveMember } from "@/lib/memberType";
import { useSearchMiss } from "@/lib/trackEvent";
import css from "./page.module.css";

interface RegItem {
  id: number;
  title: string | null;
  typeForm: string | null;
  typeMember: string | null;
  filePath: string | null;
  imagePath: string | null;
  description: string | null;
  sortOrder: number;
  fileSize: number | null;
}

type TypeKey = "statute" | "rules" | "announcements";

/** ความหมายของเอกสารแต่ละประเภท — ไล่จากกติกาหลักไปสู่รายละเอียดการปฏิบัติ */
const TYPES: Record<
  TypeKey,
  { label: string; meaning: string; desc: string; icon: LucideIcon; art: React.ReactNode }
> = {
  statute: {
    label: "ข้อบังคับ",
    meaning: "กติกาหลักของสหกรณ์",
    desc: "กติกาสูงสุดของสหกรณ์ กำหนดวัตถุประสงค์ สิทธิและหน้าที่ของสมาชิก และการบริหารงาน",
    icon: BookMarked,
    art: <Book3D size={150} />,
  },
  rules: {
    label: "ระเบียบ",
    meaning: "วิธีปฏิบัติในแต่ละเรื่อง",
    desc: "วิธีปฏิบัติที่ออกตามข้อบังคับ เช่น การให้เงินกู้ การรับฝากเงิน และสวัสดิการสมาชิก",
    icon: ScrollText,
    art: <Scales3D size={150} />,
  },
  announcements: {
    label: "ประกาศ",
    meaning: "หลักเกณฑ์และเรื่องแจ้งให้ทราบ",
    desc: "หลักเกณฑ์ เงื่อนไข และเรื่องที่สหกรณ์แจ้งให้สมาชิกทราบเป็นคราว ๆ ไป",
    icon: Megaphone,
    art: <Bell3D size={150} />,
  },
};

const TYPE_KEYS = Object.keys(TYPES) as TypeKey[];

/** เรื่องของเอกสาร — เดาจากชื่อ เพื่อให้ไอคอนสื่อถึงเนื้อหา */
const TOPICS: { test: RegExp; label: string; icon: LucideIcon; tone: string }[] = [
  { test: /กู้|สินเชื่อ|หนี้/, label: "เงินกู้", icon: HandCoins, tone: "toneLoan" },
  { test: /ฝาก/, label: "เงินฝาก", icon: PiggyBank, tone: "toneDeposit" },
  { test: /หุ้น/, label: "หุ้น", icon: TrendingUp, tone: "toneShare" },
  { test: /ศึกษา/, label: "การศึกษา", icon: GraduationCap, tone: "toneEducation" },
  { test: /สวัสดิการ|สงเคราะห์|ฌาปนกิจ|ประสบภัย|เกื้อกูล/, label: "สวัสดิการ", icon: HeartHandshake, tone: "toneWelfare" },
  { test: /เลือกตั้ง|สรรหา|กรรมการ/, label: "กรรมการ", icon: Vote, tone: "toneBoard" },
  { test: /เจ้าหน้าที่|พนักงาน/, label: "เจ้าหน้าที่", icon: Briefcase, tone: "toneBoard" },
  { test: /สมาชิก/, label: "สมาชิก", icon: Users, tone: "toneMember" },
];

const GENERAL_GROUP = "ทั่วไป";

/** ลำดับแท็บกลุ่มสมาชิก — ตรงกับตัวเลือกในหน้าแอดมิน (กลุ่มที่ไม่รู้จักต่อท้าย) */
const GROUP_ORDER = [
  "สมาชิกสามัญประเภท ก",
  "สมาชิกสามัญประเภท ข",
  "สมาชิกสมทบ",
  "สมาชิกสามัญประเภท ก ข สมทบ",
  "สหกรณ์ฯ",
];
const groupRank = (name: string) => {
  const i = GROUP_ORDER.indexOf(name);
  return i === -1 ? GROUP_ORDER.length : i;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fileExt = (url: string) => url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "pdf";

/** ปี พ.ศ. ที่ระบุในชื่อเอกสาร (ใช้ปีล่าสุดถ้ามีหลายปี เช่น ฉบับแก้ไขเพิ่มเติม) */
const yearOf = (title: string) => {
  if (!/พ\.\s?ศ/.test(title)) return null;
  const years = [...title.matchAll(/25\d{2}/g)].map((m) => Number(m[0]));
  return years.length ? Math.max(...years) : null;
};

const groupIcon = (name: string) => (/สหกรณ์/.test(name) ? Building2 : Users);

/** หน้าปกเอกสารฉบับเด่น — ภาพที่แอดมินแนบ หรือหน้าแรกของ PDF */
function FeaturedCover({ item }: { item: RegItem }) {
  const [cover, setCover] = useState<{ url: string; src: string } | null>(null);
  const pdfUrl = !item.imagePath && item.filePath && fileExt(item.filePath) === "pdf" ? item.filePath : null;

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    getPdfCoverDataUrl(pdfUrl)
      .then((src) => {
        if (!cancelled) setCover({ url: pdfUrl, src });
      })
      .catch(() => { /* คงไอคอนเอกสารไว้ */ });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const src = item.imagePath || (cover && cover.url === pdfUrl ? cover.src : null);
  return src ? (
    <img src={src} alt="" className={css.featuredCoverImg} />
  ) : (
    <span className={css.featuredCoverFallback}>
      <BookMarked size={40} strokeWidth={1.4} />
    </span>
  );
}

export default function RegulationsPage() {
  const params = useParams();
  const rawType = params?.type as string;
  const type: TypeKey = TYPE_KEYS.includes(rawType as TypeKey) ? (rawType as TypeKey) : "statute";
  const config = TYPES[type];

  // โหลดทุกประเภทครั้งเดียว — สลับแท็บได้ทันที และแสดงจำนวนของแต่ละประเภทได้
  const [all, setAll] = useState<RegItem[] | null>(null);
  const [query, setQuery] = useState("");
  // จำกลุ่มที่เลือกแยกตามประเภท — สลับแท็บแล้วไม่พาตัวกรองของแท็บเก่าไปด้วย
  const [groupByType, setGroupByType] = useState<Partial<Record<TypeKey, string>>>({});
  // ประเภทสมาชิกที่เคยเลือกไว้ (จำในเครื่อง ใช้ร่วมกับหน้าแบบฟอร์ม)
  const [savedMember, setSavedMember] = useState<MemberKey | null>(readSavedMember);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let items: RegItem[] = [];
      try {
        const res = await fetch("/api/regulations");
        if (res.ok) items = await res.json();
      } catch { /* */ }
      if (!cancelled) setAll(items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = all === null;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const item of all ?? []) if (item.typeForm) c[item.typeForm] = (c[item.typeForm] ?? 0) + 1;
    return c;
  }, [all]);

  const items = useMemo(() => (all ?? []).filter((i) => i.typeForm === type), [all, type]);

  const groupNames = useMemo(
    () =>
      [...new Set(items.map((i) => i.typeMember || GENERAL_GROUP))].sort(
        (a, b) => groupRank(a) - groupRank(b)
      ),
    [items]
  );
  // แท็บกลุ่มสมาชิก — ดูทีละกลุ่ม รายการจึงสั้นและไม่ปนกัน
  // ไม่เลือกแท็บแทนผู้ใช้: ครั้งแรกให้เลือกประเภทสมาชิกเอง แล้วจำไว้ใช้ครั้งถัดไป
  // (ถ้าเปิดมาเป็นกลุ่มใดกลุ่มหนึ่งเลย สมาชิกกลุ่มอื่นที่ไม่สังเกตแท็บจะอ่านเอกสารผิดกลุ่ม)
  const pickedGroup = groupByType[type];
  const rememberedGroup = savedMember ? groupNames.find((n) => memberKeyOf(n) === savedMember) : undefined;
  const activeGroup =
    pickedGroup && groupNames.includes(pickedGroup)
      ? pickedGroup
      : rememberedGroup ?? (groupNames.length === 1 ? groupNames[0] : null);
  const fromMemory = activeGroup !== null && activeGroup === rememberedGroup && pickedGroup !== activeGroup;

  const selectGroup = (name: string) => {
    setGroupByType((prev) => ({ ...prev, [type]: name }));
    const key = memberKeyOf(name);
    if (key) {
      setSavedMember(key);
      saveMember(key);
    }
  };

  const groupOf = (item: RegItem) => item.typeMember || GENERAL_GROUP;
  const groupCount = (name: string) => items.filter((i) => groupOf(i) === name).length;

  // ค้นหาจากทุกกลุ่มสมาชิกของประเภทนี้
  const q = query.trim().toLowerCase();
  const listItems = q
    ? items.filter((i) => `${i.title ?? ""} ${i.description ?? ""} ${groupOf(i)}`.toLowerCase().includes(q))
    : items.filter((i) => groupOf(i) === activeGroup);
  useSearchMiss(`regulations:${type}`, query, loading || !q ? null : listItems.length);

  // เอกสารน้อย (เช่น ข้อบังคับมีฉบับเดียว) → แสดงแบบฉบับเด่นพร้อมหน้าปก
  const featuredMode = items.length > 0 && items.length <= 2;
  const TypeIcon = config.icon;

  const actions = (item: RegItem, large = false) =>
    item.filePath ? (
      <div className={`${css.docActions} ${large ? css.docActionsLarge : ""}`}>
        <a
          href={item.filePath}
          target="_blank"
          rel="noopener noreferrer"
          className={css.viewBtn}
          aria-label={`เปิดอ่าน ${item.title ?? ""}`}
        >
          <Eye size={17} /> เปิดอ่าน
        </a>
        <a
          href={item.filePath}
          download={`${item.title ?? config.label}.${fileExt(item.filePath)}`}
          className={css.downloadBtn}
          aria-label={`ดาวน์โหลด ${item.title ?? ""}`}
        >
          <Download size={17} /> ดาวน์โหลด
        </a>
      </div>
    ) : (
      <span className={css.noFile}>ยังไม่มีไฟล์แนบ</span>
    );

  const fileMeta = (item: RegItem) => {
    if (!item.filePath) return null;
    const size = formatSize(item.fileSize);
    return (
      <span className={css.metaFile}>
        {fileExt(item.filePath).toUpperCase()}
        {size && ` · ${size}`}
      </span>
    );
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className={css.hero}>
        <div className={css.heroGlow} />
        <div className={css.heroInner}>
          <div className={css.heroText}>
            <nav className={css.breadcrumb} aria-label="breadcrumb">
              <Link href="/" aria-label="หน้าหลัก">
                <Home size={15} />
              </Link>
              <ChevronRight size={14} />
              <span>ข้อบังคับ ระเบียบ ประกาศ</span>
              <ChevronRight size={14} />
              <span className={css.breadcrumbActive}>{config.label}</span>
            </nav>
            <h1 className={css.heroTitle}>{config.label}</h1>
            <p className={css.heroSub}>{config.desc}</p>
          </div>
          <div className={css.heroArt} aria-hidden="true">
            {config.art}
          </div>
        </div>

        {/* ── แท็บประเภทเอกสาร ── */}
        <div className={css.tabsWrap}>
          <nav className={css.tabs} aria-label="ประเภทเอกสาร">
            {TYPE_KEYS.map((key) => {
              const t = TYPES[key];
              const Icon = t.icon;
              const active = key === type;
              return (
                <Link
                  key={key}
                  href={`/regulations/${key}`}
                  className={`${css.tab} ${active ? css.tabActive : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={css.tabIcon}>
                    <Icon size={22} />
                  </span>
                  <span className={css.tabText}>
                    <span className={css.tabLabel}>
                      {t.label}
                      {!loading && <span className={css.tabCount}>{counts[key] ?? 0}</span>}
                    </span>
                    <span className={css.tabMeaning}>{t.meaning}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <main className={css.main}>
        {loading ? (
          <div className={css.skeleton} aria-busy="true" />
        ) : items.length === 0 ? (
          <div className={css.empty}>
            <TypeIcon size={52} strokeWidth={1.3} />
            <h2>ยังไม่มี{config.label}</h2>
            <p>เมื่อมีการเผยแพร่เอกสาร จะแสดงที่หน้านี้</p>
          </div>
        ) : featuredMode ? (
          <div className={css.featuredList}>
            {items.map((item) => {
              const year = yearOf(item.title ?? "");
              return (
                <article key={item.id} className={css.featured}>
                  <a
                    href={item.filePath ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css.featuredCover}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <FeaturedCover item={item} />
                  </a>
                  <div className={css.featuredBody}>
                    <span className={css.featuredBadge}>
                      <TypeIcon size={15} /> {config.label}ฉบับปัจจุบัน
                    </span>
                    <h2 className={css.featuredTitle}>{item.title}</h2>
                    {item.description && <p className={css.featuredDesc}>{item.description}</p>}
                    <div className={css.docMeta}>
                      {year && <span className={css.metaYear}>พ.ศ. {year}</span>}
                      {item.typeMember && <span className={css.metaGroup}>{item.typeMember}</span>}
                      {fileMeta(item)}
                    </div>
                    {actions(item, true)}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <>
            {/* ── ค้นหา + แท็บกลุ่มสมาชิก ── */}
            <div className={css.toolbar}>
              <label className={css.search}>
                <Search size={19} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`ค้นหา${config.label} เช่น เงินกู้ เงินฝาก สวัสดิการ`}
                  aria-label={`ค้นหา${config.label}`}
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้นหา">
                    <X size={16} />
                  </button>
                )}
              </label>

              {!q && activeGroup && groupNames.length > 1 && (
                <div className={css.memberTabs} role="tablist" aria-label="กลุ่มสมาชิก">
                  {groupNames.map((name) => {
                    const GroupIcon = groupIcon(name);
                    const active = name === activeGroup;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`${css.memberTab} ${active ? css.memberTabActive : ""}`}
                        onClick={() => selectGroup(name)}
                      >
                        <GroupIcon size={17} />
                        {name}
                        <span className={css.memberTabCount}>{groupCount(name)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!q && !activeGroup ? (
              <section className={css.chooser} aria-label="เลือกประเภทสมาชิก">
                <h2 className={css.chooserTitle}>คุณเป็นสมาชิกประเภทใด</h2>
                <p className={css.chooserHint}>
                  เลือกประเภทของคุณเพื่อดู{config.label}ที่เกี่ยวข้อง ระบบจะจำไว้ให้ในครั้งถัดไป
                </p>
                <div className={css.chooserGrid}>
                  {groupNames.map((name) => {
                    const GroupIcon = groupIcon(name);
                    return (
                      <button key={name} type="button" className={css.chooserBtn} onClick={() => selectGroup(name)}>
                        <span className={css.chooserIcon}>
                          <GroupIcon size={22} />
                        </span>
                        <span className={css.chooserName}>{name}</span>
                        <span className={css.chooserCount}>{groupCount(name)} ฉบับ</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <>
                <div className={css.listHead}>
                  <h2 className={css.listTitle}>{q ? `ผลการค้นหา “${query.trim()}”` : activeGroup}</h2>
                  <span className={css.listCount}>
                    {listItems.length} ฉบับ{q ? " · ค้นหาจากทุกกลุ่มสมาชิก" : ""}
                  </span>
                </div>

                {fromMemory && !q && (
                  <p className={css.memoryNote}>
                    <Info size={16} /> แสดงตามประเภทสมาชิกที่คุณเลือกไว้ · ถ้าไม่ใช่ประเภทของคุณ เลือกใหม่ได้ที่แท็บด้านบน
                  </p>
                )}

                {listItems.length === 0 ? (
                  <div className={css.empty}>
                    <Search size={46} strokeWidth={1.4} />
                    <h2>ไม่พบ{config.label}ที่ค้นหา</h2>
                    <p>ลองพิมพ์คำสั้นลง เช่น “กู้” หรือ “ฝาก”</p>
                    <button type="button" className={css.resetBtn} onClick={() => setQuery("")}>
                      ล้างคำค้นหา
                    </button>
                  </div>
                ) : (
                  <ul className={css.cards}>
                    {listItems.map((item) => {
                      const title = item.title ?? "";
                      const topic = TOPICS.find((tp) => tp.test.test(title));
                      const Icon = topic?.icon ?? config.icon;
                      const year = yearOf(title);
                      return (
                        <li key={item.id} className={css.card}>
                          <div className={css.cardTop}>
                            <span className={`${css.docIcon} ${css[topic?.tone ?? "toneDefault"]}`}>
                              <Icon size={22} />
                            </span>
                            <div className={css.cardBody}>
                              <h3 className={css.cardTitle}>{title}</h3>
                              {item.description && <p className={css.docDesc}>{item.description}</p>}
                              <div className={css.cardMeta}>
                                {topic && <span className={css.metaTopic}>{topic.label}</span>}
                                {year && <span className={css.metaYear}>พ.ศ. {year}</span>}
                                {q && <span className={css.metaGroup}>{groupOf(item)}</span>}
                                {fileMeta(item)}
                              </div>
                            </div>
                          </div>
                          <div className={css.cardActions}>
                            {item.filePath ? (
                              <>
                                <a
                                  href={item.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={css.viewBtn}
                                  aria-label={`เปิดอ่าน ${title}`}
                                >
                                  <Eye size={16} /> เปิดอ่าน
                                </a>
                                <a
                                  href={item.filePath}
                                  download={`${title || config.label}.${fileExt(item.filePath)}`}
                                  className={css.downloadBtn}
                                  aria-label={`ดาวน์โหลด ${title}`}
                                >
                                  <Download size={16} /> ดาวน์โหลด
                                </a>
                              </>
                            ) : (
                              <span className={css.noFile}>ยังไม่มีไฟล์แนบ</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </>
        )}

        {!loading && items.length > 0 && (
          <p className={css.footNote}>
            <FileText size={16} /> เอกสารเป็นไฟล์ PDF เปิดอ่านบนหน้าจอหรือดาวน์โหลดเก็บไว้ได้
          </p>
        )}
      </main>
    </>
  );
}
