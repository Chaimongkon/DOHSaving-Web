"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Car,
  TrainFront,
  Bus,
  CarTaxiFront,
  Building2,
  Hospital,
  Landmark,
  GraduationCap,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Info,
  Footprints,
  Flag,
} from "lucide-react";
import {
  MAP_EMBED,
  MAP_LINK,
  clean,
  formatTime,
  parseTime,
  telHref,
  useContactData,
  DEFAULT_CONTACT_INFO,
} from "@/lib/contactInfo";
import css from "./page.module.css";

/* ══════════════════════════════════════════════════════════
   ข้อมูลการเดินทาง — ตรวจสอบกันยายน 2569
   ที่ตั้ง: กรมทางหลวงอยู่ที่ "แยกศรีอยุธยา" (ถนนพระรามที่ 6 ตัดถนนศรีอยุธยา) เขตราชเทวี
   สถานีรถไฟฟ้าใกล้สุด: พญาไท (BTS N2 / Airport Rail Link) บนถนนพญาไท ห่างราว 1.2 กม.
   รถเมล์: ป้าย "กรมทางหลวง (ศรีอยุธยา)" อ้างอิง route.in.th
   ระยะทางทั้งหมดเป็นค่าประมาณจากพิกัดแผนที่ ไม่ใช่ระยะเดินจริง
   ══════════════════════════════════════════════════════════ */

/** สายรถเมล์ที่จอดป้ายกรมทางหลวง — ขสมก. ปรับเลขสายเป็นระยะ ควรทวนกับแอปก่อนเดินทาง */
const BUS_LINES = ["8", "44", "72", "97", "201", "503", "509"];

const ROUTES = [
  {
    icon: TrainFront,
    tone: "toneGreen",
    title: "รถไฟฟ้า BTS / Airport Rail Link",
    sub: "แนะนำ · เลี่ยงรถติด",
    time: "เดิน ~15 นาที",
    steps: [
      <>ลงสถานี <strong>พญาไท</strong> — BTS สายสุขุมวิท (N2) หรือ Airport Rail Link ก็ได้ อยู่สถานีเดียวกัน</>,
      <>ลงมาที่ <strong>ถนนพญาไท</strong> เดินขึ้นเหนือไปยัง <strong>แยกพญาไท</strong></>,
      <>เลี้ยวซ้ายเข้า <strong>ถนนศรีอยุธยา</strong> เดินตรงไปราว 900 ม. ผ่าน รพ.พญาไท 1</>,
      <>ถึง <strong>แยกศรีอยุธยา</strong> กรมทางหลวงอยู่ที่หัวมุม — หรือต่อวินมอเตอร์ไซค์/แท็กซี่ราว 5 นาที</>,
    ],
  },
  {
    icon: Bus,
    tone: "toneRose",
    title: "รถโดยสารประจำทาง",
    sub: "ลงป้าย “กรมทางหลวง (ศรีอยุธยา)”",
    time: "ลงหน้ากรมฯ",
    steps: [
      <>ขึ้นสายที่ผ่านถนนศรีอยุธยา แล้วลงป้าย <strong>กรมทางหลวง</strong> (ดูเลขสายด้านล่าง)</>,
      <>สาย <strong>97</strong> สิ้นสุดที่ <strong>โรงพยาบาลสงฆ์</strong> ซึ่งอยู่ติดกับแยกศรีอยุธยา</>,
      <>เดินเข้าประตูกรมทางหลวง แล้วถามทางไป <strong>อาคาร 26</strong></>,
    ],
  },
  {
    icon: Car,
    tone: "toneOrange",
    title: "รถยนต์ส่วนตัว",
    sub: "ขับรถมาเอง",
    time: "จอดในกรมฯ",
    steps: [
      <>ตั้งปลายทางในแอปนำทางเป็น <strong>&ldquo;กรมทางหลวง ถนนศรีอยุธยา&rdquo;</strong></>,
      <>มาตาม <strong>ถนนพระรามที่ 6</strong> หรือ <strong>ถนนศรีอยุธยา</strong> จนถึงแยกศรีอยุธยา</>,
      <>เข้าประตูกรมทางหลวง จอดรถในลานจอดภายในบริเวณ แล้วไปที่ <strong>อาคาร 26</strong></>,
    ],
  },
  {
    icon: CarTaxiFront,
    tone: "toneGold",
    title: "แท็กซี่ / Grab / Bolt",
    sub: "บริการเรียกรถ",
    time: "ลงหน้าประตู",
    steps: [
      <>แจ้งคนขับ <strong>&ldquo;กรมทางหลวง แยกศรีอยุธยา&rdquo;</strong> (พระราม 6 ตัดศรีอยุธยา)</>,
      <>ในแอป ค้นหา <strong>&ldquo;สหกรณ์ออมทรัพย์กรมทางหลวง&rdquo;</strong> หรือ <strong>&ldquo;กรมทางหลวง&rdquo;</strong></>,
      <>ลงที่ประตูกรมทางหลวง แล้วเดินไป <strong>อาคาร 26</strong></>,
    ],
  },
];

/* สถานที่ใกล้เคียงที่ยืนยันตำแหน่งได้ — เรียงจากใกล้ไปไกล */
const LANDMARKS = [
  { icon: Landmark, name: "กระทรวงการต่างประเทศ", dist: "แยกเดียวกัน" },
  { icon: Hospital, name: "โรงพยาบาลสงฆ์", dist: "แยกเดียวกัน" },
  { icon: GraduationCap, name: "คณะเภสัชศาสตร์ ม.มหิดล", dist: "ถนนศรีอยุธยา" },
  { icon: Hospital, name: "โรงพยาบาลพญาไท 1", dist: "~800 ม." },
  { icon: TrainFront, name: "BTS / ARL พญาไท", dist: "~1.2 กม." },
  { icon: Building2, name: "อนุสาวรีย์ชัยสมรภูมิ", dist: "~1.5 กม." },
];

/** คัดลอกข้อความ — เว็บที่ยังเป็น http ใช้ navigator.clipboard ไม่ได้ จึงมีทางสำรอง */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ตกไปใช้วิธีสำรองด้านล่าง */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function MapPage() {
  const { info } = useContactData();
  const [copied, setCopied] = useState(false);

  const address = clean(info.address) || DEFAULT_CONTACT_INFO.address;
  const addressLine = address.replace(/\n/g, " ");
  const mainPhone = clean(info.mainPhone) || DEFAULT_CONTACT_INFO.mainPhone;
  const openLabel = formatTime(parseTime(info.openTime, 8 * 60 + 30));
  const closeLabel = formatTime(parseTime(info.closeTime, 16 * 60 + 30));

  const handleCopy = async () => {
    if (!(await copyText(`สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ${addressLine}`))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      {/* ══ Hero: ข้อความซ้าย · บัตรปลายทางขวา ══ */}
      <section className={css.hero}>
        <span className={css.heroGlowGold} aria-hidden="true" />
        <span className={css.heroGlowOrange} aria-hidden="true" />
        <span className={css.heroGrid} aria-hidden="true" />

        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <Link href="/contact" className={css.back}>
              <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
              กลับไปหน้าติดต่อสหกรณ์
            </Link>
            <p className={css.eyebrow}>
              <span className={css.eyebrowRule} />
              HOW TO GET HERE
            </p>
            <h1 className={css.heroTitle}>
              เดินทางมา<br />
              <span className={css.heroTitleAccent}>สหกรณ์ฯ ได้ง่าย ๆ</span>
            </h1>
            <p className={css.heroLead}>
              สำนักงานอยู่ในอาคาร 26 ภายในกรมทางหลวง ตรง<strong>แยกศรีอยุธยา</strong>{" "}
              จุดตัดถนนพระรามที่ 6 กับถนนศรีอยุธยา เขตราชเทวี
            </p>

            <div className={css.heroActions}>
              <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className={css.heroCta}>
                <Navigation size={15} strokeWidth={2.4} aria-hidden="true" />
                เปิดแผนที่นำทาง
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className={`${css.heroGhost} ${copied ? css.copied : ""}`}
              >
                {copied ? (
                  <><Check size={15} strokeWidth={3} aria-hidden="true" /> คัดลอกแล้ว</>
                ) : (
                  <><Copy size={15} strokeWidth={2.4} aria-hidden="true" /> คัดลอกที่อยู่</>
                )}
              </button>
            </div>
          </div>

          {/* บัตรปลายทาง — สรุปทุกอย่างที่ต้องรู้ก่อนออกจากบ้านไว้ในชิ้นเดียว */}
          <div className={css.passStage}>
            <article className={css.pass} aria-label="สรุปข้อมูลปลายทาง">
              <span className={css.passGloss} aria-hidden="true" />

              <header className={css.passHead}>
                <span className={css.passLogo}>
                  <Image src="/images/logo/logo.png" alt="" width={34} height={34} />
                </span>
                <span className={css.passHeadText}>
                  <span className={css.passKicker}>DESTINATION</span>
                  <span className={css.passTitle}>สหกรณ์ออมทรัพย์กรมทางหลวง</span>
                </span>
              </header>

              {/* เส้นทางแบบตั๋วเดินทาง: จุดต้นทาง → ปลายทาง */}
              <div className={css.passRoute}>
                <div className={css.passStop}>
                  <span className={css.passStopLabel}>รถไฟฟ้าใกล้สุด</span>
                  <span className={css.passStopValue}>BTS พญาไท</span>
                  <span className={css.passStopSub}>N2 · ARL</span>
                </div>
                <div className={css.passLine} aria-hidden="true">
                  <span className={css.passLineDist}>~1.2 กม.</span>
                  <span className={css.passLineTrack}>
                    <Footprints size={13} strokeWidth={2.4} />
                  </span>
                </div>
                <div className={`${css.passStop} ${css.passStopEnd}`}>
                  <span className={css.passStopLabel}>ปลายทาง</span>
                  <span className={css.passStopValue}>อาคาร 26</span>
                  <span className={css.passStopSub}>กรมทางหลวง</span>
                </div>
              </div>

              <div className={css.passPerf} aria-hidden="true" />

              <dl className={css.passFacts}>
                <div>
                  <dt><Flag size={12} strokeWidth={2.6} aria-hidden="true" /> จุดสังเกต</dt>
                  <dd>แยกศรีอยุธยา</dd>
                </div>
                <div>
                  <dt><Clock size={12} strokeWidth={2.6} aria-hidden="true" /> เปิดทำการ</dt>
                  <dd>จ.–ศ. {openLabel}–{closeLabel}</dd>
                </div>
                <div className={css.passBus}>
                  <dt><Bus size={12} strokeWidth={2.6} aria-hidden="true" /> รถเมล์</dt>
                  <dd>
                    {BUS_LINES.map((n) => (
                      <span key={n} className={css.passBusChip}>{n}</span>
                    ))}
                  </dd>
                </div>
              </dl>
            </article>
          </div>
        </div>
      </section>

      <div className={css.content}>
        {/* ══ แผนที่ + การ์ดที่อยู่ลอยทับ ══ */}
        <section className={css.mapWrap} aria-label="แผนที่">
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
            <h2 className={css.mapCardTitle}>สำนักงานสหกรณ์</h2>
            <p className={css.mapCardAddress}>{address}</p>
            <p className={css.mapCardHint}>
              <Info size={12} strokeWidth={2.6} aria-hidden="true" />
              อยู่ภายในบริเวณกรมทางหลวง
            </p>
          </div>
        </section>

        {/* ══ วิธีเดินทาง ══ */}
        <section className={css.section} aria-labelledby="routes-title">
          <header className={`${css.sectionHead} ${css.toneOrange}`}>
            <span className={css.sectionIcon} aria-hidden="true"><Navigation size={18} strokeWidth={2.2} /></span>
            <div>
              <p className={css.sectionEyebrow}>ROUTES</p>
              <h2 id="routes-title" className={css.sectionTitle}>เลือกวิธีเดินทางที่สะดวก</h2>
            </div>
          </header>

          <div className={css.routeGrid}>
            {ROUTES.map(({ icon: Icon, tone, title, sub, time, steps }) => (
              <article key={title} className={`${css.routeCard} ${css[tone]}`}>
                <header className={css.routeHead}>
                  <span className={css.routeIcon} aria-hidden="true"><Icon size={19} strokeWidth={2.2} /></span>
                  <span className={css.routeNames}>
                    <h3 className={css.routeTitle}>{title}</h3>
                    <span className={css.routeSub}>{sub}</span>
                  </span>
                  <span className={css.routeTime}>{time}</span>
                  <Icon className={css.routeMark} size={84} strokeWidth={1.1} aria-hidden="true" />
                </header>

                <ol className={css.routeSteps}>
                  {steps.map((step, i) => (
                    <li key={i} className={css.routeStep}>
                      <span className={css.routeNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {tone === "toneRose" && (
                  <div className={css.busLines}>
                    <span className={css.busLinesLabel}>สายที่จอดป้าย</span>
                    {BUS_LINES.map((n) => (
                      <span key={n} className={css.busChip}>{n}</span>
                    ))}
                    <p className={css.busNote}>
                      ขสมก. มีการปรับเลขสายเป็นระยะ โปรดตรวจสอบในแอป ViaBus หรือ Google Maps ก่อนเดินทาง
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ══ สถานที่ใกล้เคียง ══ */}
        <section className={css.section} aria-labelledby="landmark-title">
          <header className={`${css.sectionHead} ${css.toneGold}`}>
            <span className={css.sectionIcon} aria-hidden="true"><Flag size={18} strokeWidth={2.2} /></span>
            <div>
              <p className={css.sectionEyebrow}>LANDMARKS</p>
              <h2 id="landmark-title" className={css.sectionTitle}>จุดสังเกตระหว่างทาง</h2>
              <p className={css.sectionSub}>ระยะทางเป็นค่าประมาณจากแยกศรีอยุธยา</p>
            </div>
          </header>

          <ul className={css.landmarkGrid}>
            {LANDMARKS.map(({ icon: Icon, name, dist }) => (
              <li key={name} className={css.landmark}>
                <span className={css.landmarkIcon} aria-hidden="true"><Icon size={16} strokeWidth={2.2} /></span>
                <span className={css.landmarkBody}>
                  <span className={css.landmarkName}>{name}</span>
                  <span className={css.landmarkDist}>{dist}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ══ ต้องการความช่วยเหลือ ══ */}
        <section className={css.help}>
          <span className={css.helpGlow} aria-hidden="true" />
          <div className={css.helpText}>
            <h2 className={css.helpTitle}>หาไม่เจอ หรืออยากถามเส้นทาง</h2>
            <p className={css.helpSub}>โทรหาเจ้าหน้าที่ได้ทุกวันทำการ จันทร์ – ศุกร์ {openLabel} – {closeLabel} น.</p>
          </div>
          <div className={css.helpActions}>
            <a href={telHref(mainPhone)} className={css.helpCta}>
              <Phone size={15} strokeWidth={2.6} aria-hidden="true" />
              โทร {mainPhone}
            </a>
            <Link href="/contact" className={css.helpGhost}>
              ข้อมูลติดต่อทั้งหมด
              <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
