"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Printer,
  Navigation,
  Building2,
  ArrowRight,
  ArrowUpRight,
  Landmark,
  MessageSquareWarning,
  MessageCircle,
  HandCoins,
  Wallet,
  HeartHandshake,
  ChartPie,
  Briefcase,
  Calculator,
  Headphones,
} from "lucide-react";
import css from "./page.module.css";

import {
  MAP_EMBED,
  MAP_LINK,
  DEFAULT_CONTACT_INFO as defaultInfo,
  clean,
  formatTime,
  mergeFaxes,
  otherPhonesOf,
  parseTime,
  splitList,
  telHref,
  useContactData,
} from "@/lib/contactInfo";
/* ══════════════════════════════════════════════════════════
   สีประจำฝ่าย — ใช้กับแผ่นไอคอน ปุ่มเบอร์มือถือ และย้อมหัวการ์ดแบบจาง
   ไม่ถมสีทึบเต็มแถบ เพราะจะกลบเนื้อหาและดูไม่เข้ากับความหนาแน่นของเว็บ
   ══════════════════════════════════════════════════════════ */
const DEPT_THEMES = [
  { from: "#F0803F", to: "#D4541A", rgb: "232, 101, 43" },  // ส้มสหกรณ์
  { from: "#17A97F", to: "#0B7A59", rgb: "17, 145, 108" },  // เขียวมรกต
  { from: "#C08A2E", to: "#8A5F16", rgb: "176, 129, 42" },  // ทอง
  { from: "#4A90DC", to: "#1F5C9E", rgb: "43, 108, 176" },  // น้ำเงิน
  { from: "#9B7BD4", to: "#5B3F96", rgb: "115, 84, 175" },  // ม่วง
  { from: "#DD6A84", to: "#98304C", rgb: "180, 66, 93" },   // ชมพูอมแดง
];

/* ══════════════════════════════════════════════════════════
   ทางลัด "เรื่องนี้ติดต่อฝ่ายไหน"
   ปัญหาจริงของสมาชิกไม่ใช่หาเบอร์ไม่เจอ แต่คือไม่รู้ว่าเรื่องของตัวเองอยู่กับฝ่ายไหน

   ⚠️ รายการนี้ตั้งจากชื่อฝ่ายตรง ๆ เท่านั้น ยังไม่ได้ยืนยันกับเจ้าหน้าที่
   ถ้าสหกรณ์มีตารางแบ่งงานจริง ให้แก้ label ในนี้ได้เลย เพิ่ม/ลดกี่รายการก็ได้
   `match` คือคำที่ใช้หาฝ่ายจากชื่อ — ถ้าหาไม่เจอ ทางลัดนั้นจะถูกซ่อนเองอัตโนมัติ
   ══════════════════════════════════════════════════════════ */
const CONTACT_TOPICS = [
  { label: "กู้เงิน · สัญญาเงินกู้", match: "สินเชื่อ" },
  { label: "ฝาก – ถอนเงิน", match: "การเงิน" },
  { label: "หุ้น · ติดตามหนี้สิน", match: "ทะเบียน" },
  { label: "สวัสดิการสมาชิก", match: "สมาชิก" },
  { label: "ใบเสร็จ · งานบัญชี", match: "บัญชี" },
  { label: "เรื่องทั่วไป · ธุรการ", match: "บริหาร" },
];

/** เลือกไอคอนจากคำในชื่อฝ่าย — ชื่อฝ่ายแก้ในหน้า admin ได้ จึงจับจากคำสำคัญแทนการไล่ตามลำดับ */
function deptIcon(name: string) {
  const n = name.replace(/\s/g, "");
  if (n.includes("สินเชื่อ")) return HandCoins;
  if (n.includes("การเงิน") || n.includes("ลงทุน")) return Wallet;
  if (n.includes("สมาชิก") || n.includes("สวัสดิการ") || n.includes("ประชาสัมพันธ์")) return HeartHandshake;
  if (n.includes("หุ้น") || n.includes("เงินฝาก") || n.includes("ทะเบียน")) return ChartPie;
  if (n.includes("บัญชี")) return Calculator;
  if (n.includes("บริหาร") || n.includes("ทั่วไป")) return Briefcase;
  return Building2;
}

/* ══════════════════════════════════════════════════════════
   สถานะเปิด–ปิดตามเวลาจริง
   อิงเขตเวลาไทยเสมอ สมาชิกที่เปิดจากต่างประเทศจะได้เห็นเวลาตรงกัน
   ══════════════════════════════════════════════════════════ */

type OfficeStatus = { tone: "open" | "soon" | "closed"; label: string; detail: string };

/* เวลาทำการที่ logic ใช้จริง — ตั้งค่าเริ่มต้นไว้ แล้วให้ข้อมูลจาก API เขียนทับเมื่อโหลดเสร็จ
   เก็บไว้นอก React เพราะ statusSnapshot ด้านล่างเป็นฟังก์ชันระดับโมดูล รับพารามิเตอร์ไม่ได้ */
let officeHours = { open: 8 * 60 + 30, close: 16 * 60 + 30, financeClose: 15 * 60 + 30 };

function readBangkokNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // hour12:false ให้ค่า "24" ตอนเที่ยงคืนในบางเอนจิน จึงต้องหารเอาเศษ
  const hour = Number(get("hour")) % 24;
  return { day: days.indexOf(get("weekday")), minutes: hour * 60 + Number(get("minute")) };
}

function computeStatus(day: number, minutes: number): OfficeStatus {
  const { open, close, financeClose } = officeHours;
  const isWorkday = day >= 1 && day <= 5;

  if (isWorkday && minutes >= open && minutes < close) {
    return minutes >= financeClose
      ? { tone: "soon", label: "เปิดทำการอยู่", detail: "ฝ่ายการเงินปิดรับรายการแล้ว" }
      : { tone: "open", label: "เปิดทำการอยู่", detail: `ปิดทำการเวลา ${formatTime(close)} น.` };
  }

  if (isWorkday && minutes < open) {
    return { tone: "soon", label: "ยังไม่เปิดทำการ", detail: `เปิดวันนี้เวลา ${formatTime(open)} น.` };
  }

  /* ปิดแล้ว — บอกให้ชัดว่าเปิดอีกครั้งเมื่อไหร่ ศุกร์เย็นต้องข้ามไปวันจันทร์ */
  const nextOpen = day === 5 || day === 6 || day === 0 ? "วันจันทร์" : "พรุ่งนี้";
  return {
    tone: "closed",
    label: day === 0 || day === 6 ? "วันหยุดทำการ" : "ปิดทำการแล้ว",
    detail: `เปิดอีกครั้ง ${nextOpen} ${formatTime(open)} น.`,
  };
}

/* เวลาเป็นค่าที่อยู่นอก React จึงอ่านผ่าน useSyncExternalStore
   ฝั่ง server คืน null เสมอ — เรนเดอร์ครั้งแรกสองฝั่งจึงตรงกัน ไม่เกิด hydration mismatch
   snapshot ต้องคืนอ็อบเจ็กต์เดิมถ้านาทียังไม่เปลี่ยน ไม่อย่างนั้น React จะวนเรนเดอร์ไม่สิ้นสุด */
let statusCache: OfficeStatus | null = null;
let statusCacheKey = "";

function statusSnapshot(): OfficeStatus {
  const { day, minutes } = readBangkokNow();
  const key = `${day}:${minutes}`;
  if (key !== statusCacheKey || !statusCache) {
    statusCacheKey = key;
    statusCache = computeStatus(day, minutes);
  }
  return statusCache;
}

const statusServerSnapshot = (): OfficeStatus | null => null;

const statusListeners = new Set<() => void>();

function subscribeStatus(onChange: () => void) {
  statusListeners.add(onChange);
  const timer = window.setInterval(onChange, 30_000);
  return () => {
    statusListeners.delete(onChange);
    window.clearInterval(timer);
  };
}

/** รับเวลาทำการจากฐานข้อมูลมาใช้ แล้วสั่งให้ป้ายสถานะคำนวณใหม่ทันที */
function applyOfficeHours(next: typeof officeHours) {
  if (
    next.open === officeHours.open &&
    next.close === officeHours.close &&
    next.financeClose === officeHours.financeClose
  ) return;
  officeHours = next;
  statusCacheKey = ""; // บังคับให้ snapshot คำนวณใหม่แทนที่จะคืนค่าที่แคชไว้
  statusListeners.forEach((notify) => notify());
}

/** หัวข้อ section: แผ่นไอคอนสี + ชื่อ + คำอธิบาย */
function SectionHead({
  icon: Icon,
  tone,
  eyebrow,
  title,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tone: string;
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
}) {
  return (
    <header className={`${css.sectionHead} ${css[tone]}`}>
      <span className={css.sectionIcon} aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <div className={css.sectionText}>
        <p className={css.sectionEyebrow}>{eyebrow}</p>
        <h2 className={css.sectionTitle}>{title}</h2>
        {sub && <p className={css.sectionSub}>{sub}</p>}
      </div>
    </header>
  );
}

/** รับเวลาทำการจากฐานข้อมูลเข้า store ทันทีที่โหลดเสร็จ */
function handleInfoLoaded(info: Record<string, string>) {
  applyOfficeHours({
    open: parseTime(info.openTime, officeHours.open),
    close: parseTime(info.closeTime, officeHours.close),
    financeClose: parseTime(info.financeCloseTime, officeHours.financeClose),
  });
}

export default function ContactPage() {
  const { info, departments, lineContacts } = useContactData(handleInfoLoaded);
  const status = useSyncExternalStore(subscribeStatus, statusSnapshot, statusServerSnapshot);

  const mainPhone = clean(info.mainPhone) || defaultInfo.mainPhone;
  const email = clean(info.email) || defaultInfo.email;
  const lineOfficial = clean(info.lineOfficial) || defaultInfo.lineOfficial;
  const lineHref = `https://line.me/R/ti/p/${encodeURIComponent(lineOfficial)}`;
  const address = clean(info.address) || defaultInfo.address;
  const addressLine = address.replace(/\n/g, " ");

  /* ข้อความเวลาทำการมาจากค่าชุดเดียวกับที่ logic เปิด/ปิดใช้ จะได้ไม่มีทางขัดกันเอง */
  const hoursText = useMemo(() => ({
    open: formatTime(parseTime(info.openTime, 8 * 60 + 30)),
    close: formatTime(parseTime(info.closeTime, 16 * 60 + 30)),
    financeClose: formatTime(parseTime(info.financeCloseTime, 15 * 60 + 30)),
  }), [info.openTime, info.closeTime, info.financeCloseTime]);

  const otherPhones = useMemo(() => otherPhonesOf(info, mainPhone), [info, mainPhone]);
  const faxes = useMemo(() => mergeFaxes(info), [info]);

  /* จับทางลัดเข้ากับฝ่ายจริงที่มีอยู่ — ฝ่ายไหนไม่มีในฐานข้อมูล ทางลัดนั้นก็หายไปเอง */
  const topics = useMemo(
    () =>
      CONTACT_TOPICS.map((topic) => {
        const index = departments.findIndex((d) => clean(d.name).includes(topic.match));
        return index === -1 ? null : { ...topic, index };
      }).filter((t): t is { label: string; match: string; index: number } => t !== null),
    [departments],
  );

  return (
    <>
      {/* ══ Hero: ข้อความซ้าย · นามบัตรสหกรณ์ขวา ══ */}
      <section className={css.hero}>
        <span className={css.heroGlowGold} aria-hidden="true" />
        <span className={css.heroGlowOrange} aria-hidden="true" />
        <span className={css.heroGrid} aria-hidden="true" />

        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>
              <span className={css.eyebrowRule} />
              CONTACT US
            </p>
            <h1 className={css.heroTitle}>
              ติดต่อสหกรณ์<br />
              <span className={css.heroTitleAccent}>ได้ทุกช่องทาง</span>
            </h1>
            <p className={css.heroLead}>
              โทรสายหลัก ทัก LINE หรือโทรตรงถึงฝ่ายที่ดูแลเรื่องของท่าน
              เจ้าหน้าที่พร้อมให้บริการทุกวันทำการ
            </p>

            <div className={css.heroActions}>
              <a href={telHref(mainPhone)} className={css.heroCall}>
                <Phone size={16} strokeWidth={2.4} aria-hidden="true" />
                โทร {mainPhone}
              </a>
              <a href={lineHref} target="_blank" rel="noopener noreferrer" className={css.heroLine}>
                <Image src="/images/logo/Line.png" alt="" width={18} height={18} />
                แชท LINE
              </a>
            </div>

            <p className={css.heroHours}>
              <Clock size={14} strokeWidth={2.2} aria-hidden="true" />
              จันทร์ – ศุกร์ {hoursText.open} – {hoursText.close} น. · ฝ่ายการเงินปิดรับรายการ {hoursText.financeClose} น.
            </p>
          </div>

          {/* นามบัตรสหกรณ์ — ข้อมูลติดต่อหลักรวมอยู่ในวัตถุชิ้นเดียว ดูปุ๊บรู้ปั๊บ */}
          <div className={css.cardStage}>
            <article className={css.bizCard} aria-label="ข้อมูลติดต่อหลักของสหกรณ์">
              <span className={css.bizGloss} aria-hidden="true" />
              <span className={css.bizLines} aria-hidden="true" />

              <header className={css.bizHead}>
                <span className={css.bizLogo}>
                  <Image src="/images/logo/logo.png" alt="" width={40} height={40} />
                </span>
                <span className={css.bizOrg}>
                  <span className={css.bizOrgTh}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</span>
                  <span className={css.bizOrgEn}>DOH SAVING &amp; CREDIT COOPERATIVE</span>
                </span>
              </header>

              {status ? (
                <p className={`${css.bizStatus} ${css[`tone_${status.tone}`]}`}>
                  <span className={css.bizDot} aria-hidden="true" />
                  {status.label}
                  <span className={css.bizStatusDetail}>· {status.detail}</span>
                </p>
              ) : (
                <p className={css.bizStatus}>&nbsp;</p>
              )}

              <p className={css.bizLabel}>โทรศัพท์สายหลัก</p>
              <a href={telHref(mainPhone)} className={css.bizPhone}>{mainPhone}</a>

              <dl className={css.bizRows}>
                <div>
                  <dt><MessageCircle size={13} strokeWidth={2.4} aria-hidden="true" /> LINE</dt>
                  <dd><a href={lineHref} target="_blank" rel="noopener noreferrer">{lineOfficial}</a></dd>
                </div>
                <div>
                  <dt><Mail size={13} strokeWidth={2.4} aria-hidden="true" /> อีเมล</dt>
                  <dd><a href={`mailto:${email}`}>{email}</a></dd>
                </div>
              </dl>

              <footer className={css.bizFoot}>
                <MapPin size={13} strokeWidth={2.4} aria-hidden="true" />
                <span>{addressLine}</span>
              </footer>
            </article>
          </div>
        </div>
      </section>

      <div className={css.content}>
        {/* ══ ช่องทางด่วน (bento) ══ */}
        <section className={css.bento} aria-label="ช่องทางติดต่อ">
          <a href={telHref(mainPhone)} className={`${css.tile} ${css.accentOrange}`}>
            <span className={css.tileIcon} aria-hidden="true"><Phone size={19} strokeWidth={2.2} /></span>
            <span className={css.tileLabel}>โทรศัพท์</span>
            <span className={css.tileValue}>{mainPhone}</span>
            <span className={css.tileHint}>สายตรงกรมทางหลวง แล้วต่อเลขภายใน</span>
            <Phone className={css.tileMark} size={96} strokeWidth={1.2} aria-hidden="true" />
            <ArrowUpRight size={16} strokeWidth={2.4} className={css.tileArrow} aria-hidden="true" />
          </a>

          <a href={lineHref} target="_blank" rel="noopener noreferrer" className={`${css.tile} ${css.accentGreen}`}>
            <span className={`${css.tileIcon} ${css.tileIconLine}`} aria-hidden="true">
              <Image src="/images/logo/Line.png" alt="" width={20} height={20} />
            </span>
            <span className={css.tileLabel}>LINE Official</span>
            <span className={css.tileValue}>{lineOfficial}</span>
            <span className={css.tileHint}>สอบถามทั่วไป · ส่งสลิปการโอน</span>
            <MessageCircle className={css.tileMark} size={96} strokeWidth={1.2} aria-hidden="true" />
            <ArrowUpRight size={16} strokeWidth={2.4} className={css.tileArrow} aria-hidden="true" />
          </a>

          <a href={`mailto:${email}`} className={`${css.tile} ${css.accentBlue}`}>
            <span className={css.tileIcon} aria-hidden="true"><Mail size={19} strokeWidth={2.2} /></span>
            <span className={css.tileLabel}>อีเมล</span>
            <span className={`${css.tileValue} ${css.tileValueSm}`}>{email}</span>
            <span className={css.tileHint}>ส่งเอกสารและหนังสือติดต่อ</span>
            <Mail className={css.tileMark} size={96} strokeWidth={1.2} aria-hidden="true" />
            <ArrowUpRight size={16} strokeWidth={2.4} className={css.tileArrow} aria-hidden="true" />
          </a>

          <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className={`${css.tile} ${css.accentGold}`}>
            <span className={css.tileIcon} aria-hidden="true"><Navigation size={19} strokeWidth={2.2} /></span>
            <span className={css.tileLabel}>สำนักงาน</span>
            <span className={css.tileValue}>อาคาร 26 กรมทางหลวง</span>
            <span className={css.tileHint}>ถนนศรีอยุธยา · เปิดแผนที่นำทาง</span>
            <MapPin className={css.tileMark} size={96} strokeWidth={1.2} aria-hidden="true" />
            <ArrowUpRight size={16} strokeWidth={2.4} className={css.tileArrow} aria-hidden="true" />
          </a>
        </section>
      </div>

      {/* ══ หมายเลขติดต่อรายฝ่าย — แถบพื้นอ่อนเต็มความกว้าง ══ */}
      <section className={css.band}>
        <div className={css.bandInner}>
          <SectionHead
            icon={Headphones}
            tone="accentOrange"
            eyebrow="DEPARTMENTS"
            title="โทรตรงถึงฝ่ายที่ดูแลเรื่องของท่าน"
            sub={
              <>
                โทร <a href={telHref(mainPhone)} className={css.inlineLink}>{mainPhone}</a>{" "}
                แล้วต่อหมายเลขภายใน หรือโทรเข้ามือถือของฝ่ายนั้นโดยตรง
              </>
            }
          />

          {topics.length > 0 && (
            <nav className={css.topics} aria-label="เลือกเรื่องที่ต้องการติดต่อ">
              <span className={css.topicsLabel}>ติดต่อเรื่อง</span>
              {topics.map((topic) => (
                <a
                  key={topic.label}
                  href={`#dept-${topic.index}`}
                  className={css.topicChip}
                  style={{ "--rgb": DEPT_THEMES[topic.index % DEPT_THEMES.length].rgb } as React.CSSProperties}
                >
                  <span className={css.topicDot} aria-hidden="true" />
                  {topic.label}
                </a>
              ))}
            </nav>
          )}

          <div className={css.deptGrid}>
            {departments.map((dept, i) => {
              const name = clean(dept.name);
              const mobiles = splitList(dept.mobile);
              const doh = splitList(dept.dohCodes);
              const ext = splitList(dept.coopExt);
              const theme = DEPT_THEMES[i % DEPT_THEMES.length];
              const Icon = deptIcon(name);
              return (
                <article
                  key={`${name}-${i}`}
                  id={`dept-${i}`}
                  className={css.deptCard}
                  style={{ "--from": theme.from, "--to": theme.to, "--rgb": theme.rgb } as React.CSSProperties}
                >
                  {/* หัวการ์ดย้อมสีฝ่ายแบบจาง + ไอคอนลายน้ำ — มีสีสันแต่ไม่กลบเนื้อหา */}
                  <header className={css.deptHead}>
                    <span className={css.deptIcon} aria-hidden="true"><Icon size={18} strokeWidth={2.2} /></span>
                    <h3 className={css.deptName}>{name}</h3>
                    <Icon className={css.deptMark} size={78} strokeWidth={1.1} aria-hidden="true" />
                  </header>

                  <div className={css.deptBody}>
                    {mobiles.length > 0 ? (
                      <div className={css.deptMobiles}>
                        {mobiles.map((m) => (
                          <a key={m} href={telHref(m)} className={css.deptMobile}>
                            <Phone size={13} strokeWidth={2.6} aria-hidden="true" />
                            {m}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className={css.deptNoMobile}>ติดต่อผ่านสายภายในด้านล่าง</p>
                    )}

                    <dl className={css.deptCodes}>
                      {doh.length > 0 && (
                        <div className={css.deptCodeRow}>
                          <dt>สายตรง</dt>
                          <dd>{doh.map((c) => <span key={c} className={css.code}>{c}</span>)}</dd>
                        </div>
                      )}
                      {ext.length > 0 && (
                        <div className={css.deptCodeRow}>
                          <dt>ต่อภายใน</dt>
                          <dd>{ext.map((c) => <span key={c} className={`${css.code} ${css.codeExt}`}>{c}</span>)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className={css.content}>
        {/* ══ LINE รายฝ่าย (แผงเขียว) + เบอร์สำนักงาน ══ */}
        <div className={css.twoCol}>
          <section className={css.linePanel} aria-labelledby="line-title">
            <span className={css.linePanelGlow} aria-hidden="true" />
            <header className={css.linePanelHead}>
              <span className={css.linePanelLogo} aria-hidden="true">
                <Image src="/images/logo/Line.png" alt="" width={26} height={26} />
              </span>
              <div>
                <h2 id="line-title" className={css.linePanelTitle}>แชทกับเจ้าหน้าที่แต่ละฝ่าย</h2>
                <p className={css.linePanelSub}>กดเพื่อเพิ่มเพื่อน แล้วเริ่มแชทได้ทันที</p>
              </div>
            </header>

            <ul className={css.lineList}>
              {lineContacts.map((item, i) => (
                <li key={`${item.lineUrl}-${i}`}>
                  <a href={item.lineUrl} target="_blank" rel="noopener noreferrer" className={css.lineItem}>
                    <span className={css.lineName}>{clean(item.name).replace(/^LINE\s*/i, "")}</span>
                    <span className={css.lineAdd}>
                      เพิ่มเพื่อน
                      <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className={css.officeCard} aria-labelledby="office-title">
            <SectionHead icon={Building2} tone="accentBlue" eyebrow="OFFICE" title="เบอร์สำนักงานและโทรสาร" />

            <dl className={css.officeList}>
              {otherPhones.length > 0 && (
                <div className={css.officeRow}>
                  <dt className={css.officeLabel}>
                    <span className={`${css.officeIcon} ${css.accentOrange}`} aria-hidden="true">
                      <Phone size={13} strokeWidth={2.6} />
                    </span>
                    โทรศัพท์
                  </dt>
                  <dd className={css.officeValue}>
                    {otherPhones.map((p) => (
                      <a key={p} href={telHref(p)} className={css.officeLink}>{p}</a>
                    ))}
                  </dd>
                </div>
              )}

              {faxes.map((fax) => (
                <div key={fax.number} className={css.officeRow}>
                  <dt className={css.officeLabel}>
                    <span className={`${css.officeIcon} ${css.accentPurple}`} aria-hidden="true">
                      <Printer size={13} strokeWidth={2.6} />
                    </span>
                    โทรสาร
                  </dt>
                  <dd className={css.officeValue}>
                    <span className={css.officeNumber}>{fax.number}</span>
                    {fax.note && <span className={css.officeNote}>{fax.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* ══ แผนที่ พร้อมการ์ดที่อยู่ลอยทับ ══ */}
        <section className={css.mapSection} aria-labelledby="map-title">
          <div className={css.mapWrap}>
            <iframe
              className={css.mapFrame}
              src={MAP_EMBED}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="แผนที่สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
            />
            <div className={css.mapCard}>
              <span className={css.mapCardIcon} aria-hidden="true"><MapPin size={18} strokeWidth={2.2} /></span>
              <h2 id="map-title" className={css.mapCardTitle}>สำนักงานสหกรณ์</h2>
              <p className={css.mapCardAddress}>{address}</p>
              <div className={css.mapActions}>
                <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className={css.mapCta}>
                  <Navigation size={14} strokeWidth={2.6} aria-hidden="true" />
                  นำทาง
                </a>
                <Link href="/contact/map" className={css.mapGhost}>วิธีเดินทาง</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ ลิงก์ที่เกี่ยวข้อง ══ */}
        <section className={css.related} aria-label="บริการที่เกี่ยวข้อง">
          <Link href="/bank-accounts" className={`${css.relatedCard} ${css.accentGreen}`}>
            <span className={css.relatedIcon} aria-hidden="true"><Landmark size={19} strokeWidth={2.2} /></span>
            <span className={css.relatedBody}>
              <span className={css.relatedTitle}>บัญชีธนาคารสำหรับโอนเงิน</span>
              <span className={css.relatedText}>ดูเลขบัญชีทุกธนาคาร พร้อมปุ่มคัดลอก</span>
            </span>
            <ArrowRight size={17} strokeWidth={2.4} className={css.relatedArrow} aria-hidden="true" />
          </Link>

          <Link href="/complaints" className={`${css.relatedCard} ${css.accentRose}`}>
            <span className={css.relatedIcon} aria-hidden="true"><MessageSquareWarning size={19} strokeWidth={2.2} /></span>
            <span className={css.relatedBody}>
              <span className={css.relatedTitle}>ข้อเสนอแนะและเรื่องร้องเรียน</span>
              <span className={css.relatedText}>แจ้งเรื่องถึงสหกรณ์ผ่านแบบฟอร์มออนไลน์</span>
            </span>
            <ArrowRight size={17} strokeWidth={2.4} className={css.relatedArrow} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </>
  );
}
