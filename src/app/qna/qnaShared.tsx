// ส่วนที่ใช้ร่วมกันของหน้า /qna, /qna/[id], /qna/new (client components)
import React, { useState } from "react";
import { UserRound, ShieldCheck, ShieldAlert, Phone, EyeOff, Clock } from "lucide-react";
import {
  PHONE_VISIBLE_DAYS,
  findSensitive,
  formatPhone,
  type SensitiveMatch,
  type SensitiveType,
} from "@/lib/qnaPrivacy";
import css from "./qna.module.css";

export const ANONYMOUS = "ผู้ไม่ประสงค์ออกนาม";

export const formatDate = (d: string, withTime = false) =>
  new Date(d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

/** "5 นาทีที่แล้ว", "เมื่อวาน", "3 วันที่แล้ว" — เกิน 30 วันแสดงเป็นวันที่ */
export function timeAgo(d: string): string {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "เมื่อสักครู่";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "เมื่อวาน";
  if (days < 30) return `${days} วันที่แล้ว`;
  return formatDate(d);
}

// สีอวาตาร์คงที่ตามชื่อ ให้แต่ละคนในกระทู้แยกกันออกง่าย
const AVATAR_TONES = ["#4A90DC", "#9B7BD4", "#DD6A84", "#2BA7A0", "#E5A13A", "#6C8EBF"];

export function Avatar({ name, staff = false, size = 40 }: { name: string; staff?: boolean; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (staff) {
    return (
      <span className={`${css.avatar} ${css.avatarStaff}`} style={style} aria-hidden="true">
        <ShieldCheck size={size * 0.5} />
      </span>
    );
  }
  const clean = name.trim();
  if (!clean || clean === ANONYMOUS) {
    return (
      <span className={`${css.avatar} ${css.avatarAnon}`} style={style} aria-hidden="true">
        <UserRound size={size * 0.5} />
      </span>
    );
  }
  // ข้ามสระหน้า (เ แ โ ใ ไ) เพื่อให้ได้พยัญชนะตัวแรกของชื่อ
  const initial = clean.replace(/^[เแโใไ]+/, "").charAt(0).toUpperCase();
  let hash = 0;
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      className={css.avatar}
      style={{ ...style, background: AVATAR_TONES[hash % AVATAR_TONES.length] }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className={css.bodyLink}>
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * ข้อความหลายบรรทัด + ลิงก์กดได้ + marker ข้อมูลส่วนตัวจาก API (ดู lib/qnaPrivacy)
 * reveal = ที่มาของข้อความ สำหรับปุ่ม "แตะเพื่อดูเบอร์"
 */
export function RichText({ text, reveal }: { text: string; reveal?: { qid: number; src: string } }) {
  // split ด้วย capture group → index คี่ = เนื้อใน marker
  const parts = text.split(/([^]*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Linkified key={i} text={part} />;
        const tel = /^tel:(\d+):(\d{0,2})$/.exec(part);
        if (tel && reveal) {
          return <PhoneReveal key={i} qid={reveal.qid} src={reveal.src} index={Number(tel[1])} last2={tel[2]} />;
        }
        const label =
          part === "idcard" ? "ซ่อนเลขบัตรประชาชน" : part === "account" ? "ซ่อนเลขบัญชี" : "เบอร์ติดต่อหมดอายุแล้ว";
        return (
          <span key={i} className={css.maskedPill} title="ซ่อนเพื่อความปลอดภัยของสมาชิก">
            <EyeOff size={13} aria-hidden="true" /> {label}
          </span>
        );
      })}
    </>
  );
}

function PhoneReveal({ qid, src, index, last2 }: { qid: number; src: string; index: number; last2: string }) {
  const [state, setState] = useState<"idle" | "loading" | "shown" | "error">("idle");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const reveal = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/qna/${qid}/contact?src=${src}&i=${index}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เปิดดูเบอร์ไม่สำเร็จ");
        setState("error");
        return;
      }
      setPhone(data.phone);
      setState("shown");
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
      setState("error");
    }
  };

  if (state === "shown") {
    return (
      <span className={css.phoneShown}>
        <a href={`tel:${phone}`} className={css.phoneLink}>
          <Phone size={14} aria-hidden="true" /> {formatPhone(phone)}
        </a>
        <span className={css.phoneWarn}>สหกรณ์ไม่มีนโยบายโทรขอเลขบัญชีหรือรหัส OTP</span>
      </span>
    );
  }
  return (
    <button type="button" className={css.phoneBtn} onClick={reveal} disabled={state === "loading"}>
      <Phone size={14} aria-hidden="true" />
      <span className={css.phoneMasked}>0XX-XXX-XX{last2}</span>
      <span className={css.phoneCta}>
        {state === "loading" ? "กำลังโหลด..." : state === "error" ? error : "แตะเพื่อดูเบอร์"}
      </span>
    </button>
  );
}

/* ═══════════════════ ตรวจข้อมูลส่วนตัวก่อนโพสต์ ═══════════════════ */

const TYPE_LABEL: Record<SensitiveType, string> = {
  phone: "เบอร์โทรศัพท์",
  idcard: "เลขบัตรประชาชน",
  account: "เลขบัญชี",
};

/**
 * ใช้ในฟอร์มโพสต์: check(ข้อความ, ส่งจริง)
 * - ไม่มีข้อมูลอ่อนไหว → ส่งทันที
 * - มีเลขบัตร/เลขบัญชี → ต้องลบก่อน
 * - มีเบอร์โทร → ถามยืนยันว่าตั้งใจให้ติดต่อ (เช่น หาผู้ค้ำประกัน)
 * remove(types) = ให้หน้าฟอร์มลบข้อมูลประเภทนั้นออกจากช่องที่เกี่ยวข้อง
 */
export function usePrivacyGate(remove: (types: SensitiveType[]) => void) {
  const [pending, setPending] = useState<{ findings: SensitiveMatch[]; proceed: () => void } | null>(null);

  const check = (text: string, proceed: () => void) => {
    const findings = findSensitive(text);
    if (findings.length === 0) proceed();
    else setPending({ findings, proceed });
  };

  const dialog = pending && (
    <PrivacyDialog
      findings={pending.findings}
      onRemove={(types) => {
        remove(types);
        setPending(null);
      }}
      onConfirm={() => {
        const go = pending.proceed;
        setPending(null);
        go();
      }}
      onClose={() => setPending(null)}
    />
  );

  return { check, dialog };
}

function PrivacyDialog({
  findings,
  onRemove,
  onConfirm,
  onClose,
}: {
  findings: SensitiveMatch[];
  onRemove: (types: SensitiveType[]) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const blocked = findings.filter((f) => f.type !== "phone");
  const phones = findings.filter((f) => f.type === "phone");
  const blockedTypes = [...new Set(blocked.map((f) => f.type))];

  return (
    <div className={css.overlay} onClick={onClose}>
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
      >
        {blocked.length > 0 ? (
          <>
            <span className={`${css.dialogIcon} ${css.dialogIconDanger}`}><ShieldAlert size={24} /></span>
            <h3 id="privacy-title" className={css.dialogTitle}>
              พบ{blockedTypes.map((t) => TYPE_LABEL[t]).join("และ")}ในข้อความ
            </h3>
            <p className={css.dialogText}>
              กระดานนี้ทุกคนอ่านได้ ข้อมูลนี้อาจถูกนำไปใช้แอบอ้างหรือหลอกลวงได้ กรุณาลบออกก่อนโพสต์
            </p>
            <ul className={css.dialogFound}>
              {blocked.map((f, i) => (
                <li key={i}><span>{TYPE_LABEL[f.type]}</span> <code>{f.value}</code></li>
              ))}
            </ul>
            <div className={css.dialogActions}>
              <button className={css.ghostBtn} onClick={onClose}>กลับไปแก้ไขเอง</button>
              <button className={css.primaryBtn} onClick={() => onRemove(blockedTypes)}>ลบให้อัตโนมัติ</button>
            </div>
          </>
        ) : (
          <>
            <span className={css.dialogIcon}><Phone size={24} /></span>
            <h3 id="privacy-title" className={css.dialogTitle}>ต้องการให้สมาชิกติดต่อทางเบอร์นี้ใช่ไหม?</h3>
            <ul className={css.dialogFound}>
              {phones.map((f, i) => (
                <li key={i}><span>เบอร์โทร</span> <code>{f.value}</code></li>
              ))}
            </ul>
            <ul className={css.dialogPoints}>
              <li><EyeOff size={15} /> เบอร์จะ<strong>ไม่แสดงตรง ๆ</strong> ผู้อ่านต้องกด “ดูเบอร์” ก่อน และ Google ค้นหาไม่เจอ</li>
              <li><Clock size={15} /> ซ่อนอัตโนมัติหลัง <strong>{PHONE_VISIBLE_DAYS} วัน</strong> หรือเมื่อกระทู้ถูกปิด</li>
              <li><ShieldAlert size={15} /> ระวังมิจฉาชีพ — สหกรณ์ไม่มีนโยบายโทรขอเลขบัญชีหรือรหัส OTP</li>
            </ul>
            <div className={css.dialogActions}>
              <button className={css.ghostBtn} onClick={() => onRemove(["phone"])}>ลบเบอร์ออก</button>
              <button className={css.primaryBtn} onClick={onConfirm}>ใช่ โพสต์พร้อมเบอร์</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Hero กรมท่า + เส้นประทอง แบบเดียวกับหน้า /contact และ /complaints */
export function QnaHero({
  eyebrow,
  title,
  accent,
  lead,
  compact = false,
  narrow = false,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  accent?: React.ReactNode;
  lead?: React.ReactNode;
  compact?: boolean;
  /** ให้เนื้อหา hero กว้างเท่ารายการคำถาม (.board) — ขอบซ้ายตรงกัน */
  narrow?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className={`${css.hero} ${compact ? css.heroCompact : ""} ${narrow ? css.heroNarrow : ""}`}>
      <span className={css.heroGlowGold} aria-hidden="true" />
      <span className={css.heroGlowOrange} aria-hidden="true" />
      <span className={css.heroGrid} aria-hidden="true" />
      <div className={css.heroInner}>
        <p className={css.eyebrow}>
          <span className={css.eyebrowRule} />
          {eyebrow}
        </p>
        <h1 className={css.heroTitle}>
          {title}
          {accent && <> <span className={css.heroTitleAccent}>{accent}</span></>}
        </h1>
        {lead && <p className={css.heroLead}>{lead}</p>}
        {children}
      </div>
    </section>
  );
}
