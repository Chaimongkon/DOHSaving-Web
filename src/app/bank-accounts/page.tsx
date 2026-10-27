"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  Copy,
  Check,
  ShieldCheck,
  BadgeCheck,
  UserRound,
  ReceiptText,
  ListChecks,
  Phone,
  Printer,
  MessageCircle,
  ArrowRight,
  TriangleAlert,
  Landmark,
} from "lucide-react";
import css from "./page.module.css";

/* ชื่อบัญชีปลายทาง — ทุกบัญชีในหน้านี้เป็นชื่อเดียวกัน จึงประกาศไว้ที่เดียว
   ถ้าชื่อบัญชีในสมุดคู่ฝากสะกดต่างจากนี้ ให้แก้ตรงนี้จุดเดียว */
const ACCOUNT_NAME = "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด";

interface BankData {
  bankName: string;
  bankNameSub: string | null;
  accountNumber: string;
  accountType: string;
  brandColor: string;
  abbr: string | null;
  logoUrl: string | null;
}

/* ── ข้อมูลสำรอง ใช้ระหว่างรอ API หรือเมื่อ API ล่ม ── */
const defaultBanks: BankData[] = [
  { bankName: "ธนาคารกรุงไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "013-1-25604-1", accountType: "ออมทรัพย์", brandColor: "#1ba5e0", abbr: "KTB", logoUrl: null },
  { bankName: "ธนาคารไทยพาณิชย์", bankNameSub: "จำกัด (มหาชน)", accountNumber: "026-4-09590-2", accountType: "ออมทรัพย์", brandColor: "#4e2a84", abbr: "SCB", logoUrl: null },
  { bankName: "ธนาคารกสิกรไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "023-2-56500-4", accountType: "ออมทรัพย์", brandColor: "#138f2d", abbr: "KBANK", logoUrl: null },
  { bankName: "ธนาคารกรุงเทพ", bankNameSub: "จำกัด (มหาชน)", accountNumber: "149-0-89521-4", accountType: "ออมทรัพย์", brandColor: "#1e2b87", abbr: "BBL", logoUrl: null },
  { bankName: "ธนาคารกรุงศรีอยุธยา", bankNameSub: "จำกัด (มหาชน)", accountNumber: "044-1-37968-0", accountType: "ออมทรัพย์", brandColor: "#fec400", abbr: "BAY", logoUrl: null },
  { bankName: "ธนาคารทหารไทยธนชาต", bankNameSub: "จำกัด (มหาชน)", accountNumber: "003-2-90393-2", accountType: "ออมทรัพย์", brandColor: "#1279be", abbr: "TTB", logoUrl: null },
  { bankName: "ธนาคารซีไอเอ็มบี ไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "700-0-23218-5", accountType: "ออมทรัพย์", brandColor: "#e02020", abbr: "CIMB", logoUrl: null },
];

/* ══════════════════════════════════════════════════════════
   สีประจำธนาคาร → ชุดตัวแปร CSS ของหน้าบัตร
   ธนาคารบางแห่งใช้สีอ่อน (กรุงศรี #fec400) ตัวหนังสือขาวจะอ่านไม่ออก
   จึงคำนวณความสว่างแล้วสลับเป็นตัวหนังสือเข้มให้อัตโนมัติ
   ══════════════════════════════════════════════════════════ */

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  let h = (hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [26, 45, 74]; // กรมท่า — ค่าเริ่มต้นเดียวกับ DB
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const toHex = (rgb: RGB) =>
  "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

const mix = (rgb: RGB, target: RGB, amount: number): RGB =>
  [0, 1, 2].map((i) => rgb[i] + (target[i] - rgb[i]) * amount) as RGB;

/** ความสว่างเชิงสัมพัทธ์ตาม WCAG — ใช้ตัดสินว่าจะวางตัวหนังสือสีขาวหรือสีเข้ม */
function luminance([r, g, b]: RGB) {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

function cardTheme(brandColor: string): React.CSSProperties {
  const rgb = parseHex(brandColor);
  const light = luminance(rgb) > 0.5;
  return {
    "--bank": toHex(rgb),
    "--bank-rgb": rgb.join(", "),
    /* ไล่เฉดจากสีธนาคาร: มุมบนสว่างขึ้น มุมล่างเข้มลง ให้ดูเหมือนบัตรจริงที่มีแสงตกกระทบ */
    "--face-1": toHex(mix(rgb, WHITE, light ? 0.3 : 0.2)),
    "--face-2": toHex(rgb),
    "--face-3": toHex(mix(rgb, BLACK, light ? 0.24 : 0.42)),
    "--ink": light ? "#16213c" : "#ffffff",
    "--ink-soft": light ? "rgba(22, 33, 60, 0.7)" : "rgba(255, 255, 255, 0.76)",
    "--veil": light ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.13)",
    "--edge": light ? "rgba(0, 0, 0, 0.13)" : "rgba(255, 255, 255, 0.24)",
    "--shine": light ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.2)",
  } as React.CSSProperties;
}

/* ══════════════════════════════════════════════════════════
   ตราสัญลักษณ์ธนาคาร (ใช้เมื่อผู้ดูแลยังไม่ได้อัปโหลดโลโก้จริง)
   ธนาคารที่มีสัญลักษณ์เด่นชัด วาดเป็นเงาสัญลักษณ์
   ธนาคารที่ใช้ตัวอักษรเป็นโลโก้ แสดงเป็นอักษรย่อบนแผ่นขาว
   ══════════════════════════════════════════════════════════ */
function BankMark({ abbr, brandColor }: { abbr: string | null; brandColor: string }) {
  const key = abbr?.toUpperCase().trim();
  const c = brandColor;

  switch (key) {
    /* กรุงไทย — ปีกโค้งสองชั้น */
    case "KTB":
    case "กรุงไทย":
      return (
        <svg viewBox="0 0 100 100" className={css.markSvg} aria-hidden="true">
          <path d="M50 22C31 22 20 40 18 52c8-11 20-17 32-17s24 6 32 17C80 40 69 22 50 22Z" fill={c} />
          <path d="M50 78c19 0 30-18 32-30-8 11-20 17-32 17s-24-6-32-17c2 12 13 30 32 30Z" fill={c} opacity="0.62" />
        </svg>
      );

    /* ไทยพาณิชย์ — ใบโพธิ์ */
    case "SCB":
      return (
        <svg viewBox="0 0 100 100" className={css.markSvg} aria-hidden="true">
          <path
            d="M50 14c16 14 28 30 28 44 0 15-12 26-28 26S22 73 22 58c0-14 12-30 28-44Z"
            fill={c}
          />
          <path d="M50 30v56" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />
          <path d="M50 52 36 40M50 62 64 50" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    /* กสิกรไทย — รวงข้าว */
    case "KBANK":
      return (
        <svg viewBox="0 0 100 100" className={css.markSvg} aria-hidden="true">
          <path d="M50 88V34" stroke={c} strokeWidth="5" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <ellipse cx="38" cy={38 + i * 13} rx="10" ry="5.5" fill={c} transform={`rotate(-32 38 ${38 + i * 13})`} />
              <ellipse cx="62" cy={38 + i * 13} rx="10" ry="5.5" fill={c} transform={`rotate(32 62 ${38 + i * 13})`} />
            </g>
          ))}
          <ellipse cx="50" cy="24" rx="5.5" ry="11" fill={c} />
        </svg>
      );

    /* กรุงเทพ — ดอกบัวหลวง */
    case "BBL":
      return (
        <svg viewBox="0 0 100 100" className={css.markSvg} aria-hidden="true">
          <path d="M50 16c9 13 13 26 13 36S57 74 50 82c-7-8-13-20-13-30s4-23 13-36Z" fill={c} />
          <path d="M28 34c11 5 18 14 21 23s1 19-2 26c-9-5-16-14-19-24s-2-19 0-25Z" fill={c} opacity="0.66" />
          <path d="M72 34c2 6 3 15 0 25s-10 19-19 24c-3-7-5-17-2-26s10-18 21-23Z" fill={c} opacity="0.66" />
        </svg>
      );

    /* ที่เหลือใช้อักษรย่อเป็นตราสัญลักษณ์ ตรงไปตรงมาและอ่านออกแน่นอน */
    default:
      return (
        <span className={css.markText} style={{ color: c }}>
          {key ? key.slice(0, 5) : <Landmark size={22} strokeWidth={2} />}
        </span>
      );
  }
}

/* ชิป EMV สีทอง — รายละเอียดที่ทำให้การ์ดดูเป็นบัตรธนาคารจริง */
function EmvChip() {
  /* บัตรทุกใบมีชิป ถ้าใช้ id ซ้ำกันจะกลายเป็น id ซ้ำในหน้าเดียว */
  const gradId = `chipGold-${useId()}`;
  return (
    <svg viewBox="0 0 44 34" className={css.chip} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e6a8" />
          <stop offset="45%" stopColor="#d9b455" />
          <stop offset="100%" stopColor="#a7842f" />
        </linearGradient>
      </defs>
      <rect x="0.7" y="0.7" width="42.6" height="32.6" rx="6" fill={`url(#${gradId})`} stroke="rgba(120,92,20,.55)" strokeWidth="1.2" />
      <g stroke="rgba(120,92,20,.6)" strokeWidth="1.3" fill="none">
        <path d="M0 11h13M31 11h13M0 23h13M31 23h13M15 0v6M29 0v6M15 34v-6M29 34v-6" />
        <rect x="13" y="6" width="18" height="22" rx="3" />
        <path d="M22 6v22" />
      </g>
    </svg>
  );
}

/* คลื่นสัญญาณ contactless */
function ContactlessWaves() {
  return (
    <svg viewBox="0 0 24 28" className={css.waves} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 9a9 9 0 0 1 0 10" />
        <path d="M11 5.5a15 15 0 0 1 0 17" />
        <path d="M17 2a21 21 0 0 1 0 24" />
      </g>
    </svg>
  );
}

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

/* เลขบัญชีในแอปธนาคารรับเฉพาะตัวเลข — คัดลอกออกไปจึงตัดขีดคั่นทิ้ง */
const digitsOnly = (s: string) => s.replace(/\D/g, "");

const slugFor = (bank: BankData, i: number) =>
  `bank-${(bank.abbr || String(i + 1)).toLowerCase().replace(/[^a-z0-9]/g, "") || i + 1}`;

export default function BankAccountsPage() {
  const [banks, setBanks] = useState<BankData[]>(defaultBanks);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length) setBanks(data);
      })
      .catch(() => {
        /* ใช้ข้อมูลสำรองต่อไป */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* key ของปุ่มที่เพิ่งกด ใช้สลับข้อความเป็น "คัดลอกแล้ว" ชั่วคราว */
  const handleCopy = async (key: string, value: string) => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(key);
    window.setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 2200);
  };

  const themes = useMemo(() => banks.map((b) => cardTheme(b.brandColor)), [banks]);

  return (
    <>
      {/* ══ Hero ══ */}
      <section className={css.hero}>
        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>
              <span className={css.eyebrowRule} />
              OFFICIAL BANK ACCOUNTS
            </p>
            <h1 className={css.heroTitle}>บัญชีธนาคารสำหรับโอนเงิน</h1>
            <p className={css.heroLead}>
              ช่องทางชำระค่าหุ้น ชำระเงินกู้ และฝากเงินเข้าบัญชีออมทรัพย์ของสหกรณ์
              เลือกธนาคารที่ท่านสะดวก แล้วกดคัดลอกเลขบัญชีไปวางในแอปธนาคารได้ทันที
            </p>
            <div className={css.heroChips}>
              <span className={css.heroChip}>
                <ShieldCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                บัญชีทางการของสหกรณ์
              </span>
              <span className={css.heroChip}>
                <Landmark size={16} strokeWidth={2.2} aria-hidden="true" />
                {banks.length} ธนาคาร
              </span>
              <span className={css.heroChip}>
                <Copy size={16} strokeWidth={2.2} aria-hidden="true" />
                คัดลอกเลขบัญชีได้ในคลิกเดียว
              </span>
            </div>
          </div>

          {/* การ์ดยืนยันชื่อบัญชี — ข้อมูลกันโอนผิดที่สำคัญที่สุดของหน้านี้ */}
          <aside className={css.verify} aria-labelledby="verify-title">
            <p className={css.verifyEyebrow}>
              <BadgeCheck size={18} strokeWidth={2.2} aria-hidden="true" />
              ตรวจก่อนกดโอนทุกครั้ง
            </p>
            <p id="verify-title" className={css.verifyLabel}>ชื่อบัญชีปลายทางต้องเป็น</p>
            <p className={css.verifyName}>{ACCOUNT_NAME}</p>
            <button
              type="button"
              className={`${css.verifyBtn} ${copied === "name" ? css.btnDone : ""}`}
              onClick={() => handleCopy("name", ACCOUNT_NAME)}
            >
              {copied === "name" ? (
                <><Check size={16} strokeWidth={3} aria-hidden="true" /> คัดลอกชื่อบัญชีแล้ว</>
              ) : (
                <><Copy size={16} strokeWidth={2.2} aria-hidden="true" /> คัดลอกชื่อบัญชี</>
              )}
            </button>
            <p className={css.verifyNote}>
              หากแอปธนาคารขึ้นชื่อผู้รับเป็นชื่อบุคคล หรือชื่อไม่ตรงกับข้างต้น
              <strong> ให้ยกเลิกรายการทันที</strong> แล้วแจ้งเจ้าหน้าที่สหกรณ์
            </p>
          </aside>
        </div>
      </section>

      <div className={css.content}>
        {/* ══ เลือกธนาคารอย่างรวดเร็ว ══ */}
        <nav className={css.picker} aria-label="ข้ามไปยังธนาคารที่ต้องการ">
          <span className={css.pickerLabel}>ธนาคารของท่าน</span>
          <ul className={css.pickerList}>
            {banks.map((bank, i) => (
              <li key={slugFor(bank, i)}>
                <a href={`#${slugFor(bank, i)}`} className={css.pickerChip}>
                  <span className={css.pickerDot} style={{ background: bank.brandColor }} aria-hidden="true" />
                  {bank.bankName.replace(/^ธนาคาร/, "")}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ══ บัตรธนาคาร ══ */}
        <section className={css.grid} aria-label="รายการบัญชีธนาคารของสหกรณ์">
          {banks.map((bank, i) => {
            const id = slugFor(bank, i);
            const numKey = `num-${i}`;
            const isDone = copied === numKey;
            return (
              <article key={id} id={id} className={css.card} style={themes[i]}>
                {/* หน้าบัตร — ไล่เฉดตามสีประจำธนาคาร */}
                <div className={css.face}>
                  <span className={css.faceGloss} aria-hidden="true" />
                  <span className={css.facePattern} aria-hidden="true" />

                  <header className={css.faceHead}>
                    <span className={css.logoPad}>
                      {bank.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bank.logoUrl} alt="" className={css.logoImg} loading="lazy" />
                      ) : (
                        <BankMark abbr={bank.abbr} brandColor={bank.brandColor} />
                      )}
                    </span>
                    <span className={css.faceNames}>
                      <h2 className={css.bankName}>{bank.bankName}</h2>
                      {bank.bankNameSub && <span className={css.bankSub}>{bank.bankNameSub}</span>}
                    </span>
                  </header>

                  <div className={css.faceMid}>
                    <EmvChip />
                    <span className={css.wavesWrap}><ContactlessWaves /></span>
                    <span className={css.typeTag}>{bank.accountType}</span>
                  </div>

                  <p className={css.numLabel}>เลขที่บัญชี</p>
                  <p className={css.num}>{bank.accountNumber}</p>

                  <footer className={css.faceFoot}>
                    <span className={css.footLabel}>ชื่อบัญชี</span>
                    <span className={css.footName}>{ACCOUNT_NAME}</span>
                  </footer>
                </div>

                {/* แถบปุ่มใต้บัตร */}
                <div className={css.actions}>
                  <button
                    type="button"
                    className={`${css.copyBtn} ${isDone ? css.btnDone : ""}`}
                    onClick={() => handleCopy(numKey, digitsOnly(bank.accountNumber))}
                    aria-label={`คัดลอกเลขบัญชี ${bank.bankName}`}
                  >
                    {isDone ? (
                      <><Check size={18} strokeWidth={3} aria-hidden="true" /> คัดลอกเลขบัญชีแล้ว</>
                    ) : (
                      <><Copy size={18} strokeWidth={2.2} aria-hidden="true" /> คัดลอกเลขบัญชี</>
                    )}
                  </button>
                </div>
                <span className={css.live} role="status" aria-live="polite">
                  {isDone ? `คัดลอกเลขบัญชี ${bank.bankName} แล้ว` : ""}
                </span>
              </article>
            );
          })}
        </section>

        <p className={css.copyNote}>
          <TriangleAlert size={17} strokeWidth={2.2} aria-hidden="true" />
          ปุ่มคัดลอกจะคัดลอกเป็น<strong> ตัวเลขล้วนไม่มีขีดคั่น</strong> เพื่อให้วางในแอปธนาคารได้ทันที
        </p>

        {/* ══ หลังโอนแล้วทำอย่างไรต่อ ══
            แผงกรมท่า + ป้ายขาวสามใบเรียงตามเส้นประทอง — ล้อภาพป้ายบอกทางริมทางหลวง */}
        <section className={css.steps} aria-labelledby="steps-title">
          <span className={css.stepsGlow} aria-hidden="true" />

          <header className={css.stepsHead}>
            <p className={css.stepsEyebrow}>
              <span className={css.stepsEyebrowRule} />
              AFTER TRANSFER
              <span className={css.stepsEyebrowRule} />
            </p>
            <h2 id="steps-title" className={css.stepsTitle}>โอนเงินแล้ว ต้องแจ้งสหกรณ์ทุกครั้ง</h2>
            <p className={css.stepsSub}>
              เงินที่โอนเข้ามาจะยังไม่ถูกบันทึกเข้าบัญชีของท่านโดยอัตโนมัติ
              สหกรณ์ต้องทราบก่อนว่าเงินก้อนนี้เป็นของสมาชิกท่านใดและชำระเพื่ออะไร
            </p>
          </header>

          <ol className={css.stepList}>
            <li className={css.step}>
              <span className={css.stepNum}>1</span>
              <span className={css.stepIcon} aria-hidden="true"><UserRound size={22} strokeWidth={2} /></span>
              <h3 className={css.stepTitle}>บอกว่าท่านเป็นใคร</h3>
              <p className={css.stepText}>
                แจ้ง <strong>ชื่อ – นามสกุล</strong> และ <strong>เลขที่สมาชิก</strong> ให้ครบถ้วน
              </p>
            </li>
            <li className={css.step}>
              <span className={css.stepNum}>2</span>
              <span className={css.stepIcon} aria-hidden="true"><ListChecks size={22} strokeWidth={2} /></span>
              <h3 className={css.stepTitle}>บอกว่าโอนมาเพื่ออะไร</h3>
              <p className={css.stepText}>
                เช่น ชำระค่าหุ้น · ชำระเงินกู้ (<strong>ระบุเลขที่สัญญา</strong>) · ฝากเข้าบัญชีออมทรัพย์
              </p>
            </li>
            <li className={css.step}>
              <span className={css.stepNum}>3</span>
              <span className={css.stepIcon} aria-hidden="true"><ReceiptText size={22} strokeWidth={2} /></span>
              <h3 className={css.stepTitle}>แนบสลิปการโอน</h3>
              <p className={css.stepText}>
                ส่ง <strong>สลิป (e-Slip)</strong> ที่เห็นวันเวลาและจำนวนเงินชัดเจน ให้เจ้าหน้าที่ตรวจสอบ
              </p>
            </li>
          </ol>

          {/* ช่องทางส่งหลักฐาน */}
          <div className={css.channels}>
            <p className={css.channelsTitle}>ส่งหลักฐานได้ที่ช่องทางเหล่านี้</p>
            <div className={css.channelGrid}>
              <a
                href="https://line.me/ti/p/@dohsaving"
                target="_blank"
                rel="noopener noreferrer"
                className={`${css.channel} ${css.channelMain}`}
              >
                <span className={css.channelIcon} style={{ background: "#06C755" }} aria-hidden="true">
                  <MessageCircle size={22} strokeWidth={2.2} />
                </span>
                <span className={css.channelBody}>
                  <span className={css.channelLabel}>LINE Official Account</span>
                  <span className={css.channelValue}>
                    @dohsaving
                    <span className={css.channelTip}>แนะนำ</span>
                  </span>
                </span>
                <ArrowRight size={18} strokeWidth={2.2} className={css.channelArrow} aria-hidden="true" />
              </a>

              <a href="tel:0989984420" className={css.channel}>
                <span className={css.channelIcon} style={{ background: "var(--brand-orange-500)" }} aria-hidden="true">
                  <Phone size={22} strokeWidth={2.2} />
                </span>
                <span className={css.channelBody}>
                  <span className={css.channelLabel}>โทรแจ้งเจ้าหน้าที่</span>
                  <span className={css.channelValue}>098-998-4420</span>
                </span>
                <ArrowRight size={18} strokeWidth={2.2} className={css.channelArrow} aria-hidden="true" />
              </a>

              <div className={css.channel}>
                <span className={css.channelIcon} style={{ background: "#06C755" }} aria-hidden="true">
                  <MessageCircle size={22} strokeWidth={2.2} />
                </span>
                <span className={css.channelBody}>
                  <span className={css.channelLabel}>LINE ID (สำรอง)</span>
                  <span className={css.channelValue}>dohcoop2</span>
                </span>
              </div>

              <div className={css.channel}>
                <span className={css.channelIcon} style={{ background: "#5b6472" }} aria-hidden="true">
                  <Printer size={22} strokeWidth={2.2} />
                </span>
                <span className={css.channelBody}>
                  <span className={css.channelLabel}>โทรสาร (FAX)</span>
                  <span className={css.channelValue}>02-644-4826</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <p className={css.disclaimer}>
          สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ไม่มีนโยบายให้โอนเงินเข้าบัญชีชื่อบุคคลไม่ว่ากรณีใด
          หากมีผู้แอบอ้างหรือท่านไม่แน่ใจ โปรดโทรตรวจสอบกับเจ้าหน้าที่ก่อนทำรายการทุกครั้ง
        </p>
      </div>
    </>
  );
}
