"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  Lightbulb,
  CircleHelp,
  Send,
  Search,
  Copy,
  Check,
  Link2,
  Printer,
  Share2,
  ShieldCheck,
  EyeOff,
  Clock,
  User,
  Phone,
  Mail,
  IdCard,
  RefreshCw,
  X,
  ChevronRight,
  Inbox,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Ticket,
  CircleAlert,
  History,
  Trash2,
  MessageCircleReply,
} from "lucide-react";
import { decodeEntities } from "@/lib/decodeEntities";
import {
  categoryLabels,
  statusLabels,
  normalizeTrackingCode,
  isValidTrackingCode,
  loadSavedComplaints,
  saveComplaint,
  removeSavedComplaint,
  type SavedComplaint,
} from "@/lib/complaintTracking";
import css from "./page.module.css";

type View = "submit" | "track";

interface TrackResult {
  trackingCode: string;
  category: string;
  subject: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface Receipt {
  code: string;
  subject: string;
  category: string;
  createdAt: string;
}

type FieldErrors = Partial<Record<"subject" | "detail" | "tel" | "email" | "pdpa", string>>;

const SUBJECT_MAX = 200;
const DETAIL_MAX = 3000;

const categories = [
  {
    value: "complaint",
    label: "ร้องเรียน / ร้องทุกข์",
    desc: "แจ้งปัญหา หรือความไม่เป็นธรรม",
    Icon: MessageSquareWarning,
    tone: "toneRose",
  },
  {
    value: "suggestion",
    label: "ข้อเสนอแนะ",
    desc: "ไอเดียเพื่อพัฒนาบริการ",
    Icon: Lightbulb,
    tone: "toneGold",
  },
  {
    value: "inquiry",
    label: "สอบถามข้อมูล",
    desc: "ข้อสงสัยเรื่องบริการหรือระเบียบ",
    Icon: CircleHelp,
    tone: "toneBlue",
  },
] as const;

const statusTone: Record<string, string> = {
  pending: css.badgePending,
  reviewing: css.badgeReviewing,
  resolved: css.badgeResolved,
  rejected: css.badgeRejected,
};

const formatDate = (d: string, withTime = true) =>
  new Date(d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

const trackingUrl = (code: string) =>
  `${window.location.origin}/complaints?code=${encodeURIComponent(code)}`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback สำหรับเบราว์เซอร์เก่า / non-secure context
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

/** แสดงเลขที่เรื่องแบบแบ่งกลุ่ม อ่านออกเสียง/จดง่าย เช่น CP260924 · K7QX2M */
function CodeChunks({ code }: { code: string }) {
  const [head, tail] = code.split("-");
  return (
    <span className={css.codeChunks}>
      <span>{head}</span>
      <span className={css.codeDash} aria-hidden="true">-</span>
      <span className={css.codeTail}>{tail}</span>
    </span>
  );
}

export default function ComplaintsPage() {
  const [view, setView] = useState<View>("submit");
  const mainRef = useRef<HTMLDivElement>(null);

  // ── Form ──
  const [category, setCategory] = useState("complaint");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [hp, setHp] = useState(""); // honeypot anti-bot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // ── Track ──
  const [trackInput, setTrackInput] = useState("");
  const [heroInput, setHeroInput] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null);
  const [trackError, setTrackError] = useState("");

  // ── เรื่องของฉัน (บนอุปกรณ์นี้) ──
  const [saved, setSaved] = useState<SavedComplaint[]>([]);
  const [savedStatus, setSavedStatus] = useState<Record<string, string>>({});

  // ── Toast ──
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const refreshSavedStatuses = useCallback(async (list: SavedComplaint[]) => {
    if (list.length === 0) return;
    try {
      const res = await fetch(`/api/complaints?codes=${list.map((c) => c.code).join(",")}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const c of data.complaints as { trackingCode: string; status: string }[]) {
        map[c.trackingCode] = c.status;
      }
      setSavedStatus(map);
    } catch {
      // ไม่แสดง error — รายการยังกดดูรายละเอียดทีละเรื่องได้
    }
  }, []);

  const lookup = useCallback(async (raw: string) => {
    const code = normalizeTrackingCode(raw);
    setTrackInput(code);
    setTrackError("");
    if (!code) {
      setTrackError("กรุณากรอกเลขที่เรื่อง");
      return;
    }
    if (!isValidTrackingCode(code)) {
      setTrackError("รูปแบบเลขที่เรื่องไม่ถูกต้อง ตัวอย่างที่ถูกต้อง: CP260924-K7QX2M");
      return;
    }
    setTracking(true);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/complaints?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResult(data.complaint);
        setSavedStatus((prev) => ({ ...prev, [code]: data.complaint.status }));
        window.history.replaceState(null, "", `/complaints?code=${encodeURIComponent(code)}`);
      } else {
        setTrackError(data.error || "ไม่พบข้อมูล");
      }
    } catch {
      setTrackError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setTracking(false);
    }
  }, []);

  const goTrack = useCallback(
    (code?: string) => {
      setReceipt(null);
      setView("track");
      if (code) lookup(code);
      requestAnimationFrame(() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    [lookup],
  );

  // เปิดจากลิงก์ติดตาม (?code=...) → ไปหน้าติดตามและค้นหาให้อัตโนมัติ
  useEffect(() => {
    const list = loadSavedComplaints();
    // localStorage อ่านได้หลัง hydrate เท่านั้น — อ่านตอน render จะทำให้ HTML ฝั่ง server/client ไม่ตรงกัน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(list);
    refreshSavedStatuses(list);

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setView("track");
      lookup(code);
    } else if (window.location.hash === "#track") {
      setView("track");
    }
  }, [lookup, refreshSavedStatuses]);

  // ── Form handlers ──
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (subject.trim().length < 3) e.subject = "กรุณาระบุหัวข้อเรื่องสั้น ๆ";
    if (detail.trim().length < 10) e.detail = "กรุณาเล่ารายละเอียดอย่างน้อย 10 ตัวอักษร เพื่อให้เจ้าหน้าที่เข้าใจเรื่อง";
    if (!anonymous) {
      if (tel.trim() && !/^[\d\s\-+()]{6,20}$/.test(tel.trim())) e.tel = "รูปแบบเบอร์โทรไม่ถูกต้อง";
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!pdpaConsent) e.pdpa = "กรุณายอมรับเงื่อนไขการใช้ข้อมูลก่อนส่งเรื่อง";
    return e;
  };

  const handleSubmitClick = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError("");
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: anonymous ? null : memberId.trim() || null,
          name: anonymous ? null : name.trim() || null,
          tel: anonymous ? null : tel.trim() || null,
          email: anonymous ? null : email.trim() || null,
          category,
          subject: subject.trim(),
          complaint: detail.trim(),
          _hp: hp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowConfirm(false);
        setSubmitError(data.error || "ส่งเรื่องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }
      const r: Receipt = {
        code: data.trackingCode,
        subject: subject.trim(),
        category,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      // บันทึกเลขที่เรื่องไว้ในอุปกรณ์นี้ — กลับมาดูได้แม้ลืมจด
      const list = saveComplaint(r);
      setSaved(list);
      setSavedStatus((prev) => ({ ...prev, [r.code]: "pending" }));
      setShowConfirm(false);
      setReceipt(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setShowConfirm(false);
      setSubmitError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory("complaint");
    setSubject("");
    setDetail("");
    setAnonymous(false);
    setMemberId("");
    setName("");
    setTel("");
    setEmail("");
    setPdpaConsent(false);
    setErrors({});
    setSubmitError("");
    setReceipt(null);
    setView("submit");
  };

  // ปุ่มส่งเป็นสีเทาจนกว่าช่องบังคับครบ + ติ๊กยินยอม — บอกด้วยว่ายังขาดอะไร
  const missing = [
    subject.trim().length < 3 && "หัวข้อเรื่อง",
    detail.trim().length < 10 && "รายละเอียด",
    !pdpaConsent && "ติ๊กยินยอมการใช้ข้อมูล",
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0;

  const clearError = (key: keyof FieldErrors) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  // ── Receipt actions ──
  const handleCopyCode = async (code: string) => {
    flash((await copyText(code)) ? "คัดลอกเลขที่เรื่องแล้ว" : "คัดลอกไม่สำเร็จ");
  };
  const handleCopyLink = async (code: string) => {
    flash((await copyText(trackingUrl(code))) ? "คัดลอกลิงก์ติดตามแล้ว" : "คัดลอกไม่สำเร็จ");
  };
  const handleShare = async (code: string) => {
    const text = `เลขที่เรื่องร้องเรียน/ข้อเสนอแนะ สหกรณ์ออมทรัพย์กรมทางหลวง: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "เลขที่เรื่อง", text, url: trackingUrl(code) });
      } catch {
        // ผู้ใช้กดยกเลิก
      }
    } else {
      handleCopyLink(code);
    }
  };

  const handleRemoveSaved = (code: string) => {
    setSaved(removeSavedComplaint(code));
  };

  const catMeta = (value: string) => categories.find((c) => c.value === value) ?? categories[0];

  // ═══════════════════════ Render ═══════════════════════
  return (
    <>
      {/* ══ Hero ══ */}
      <section className={css.hero}>
        <span className={css.heroGlowGold} aria-hidden="true" />
        <span className={css.heroGlowOrange} aria-hidden="true" />
        <span className={css.heroGrid} aria-hidden="true" />

        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>
              <span className={css.eyebrowRule} />
              เสียงของสมาชิก
            </p>
            <h1 className={css.heroTitle}>
              แจ้งข้อเสนอแนะ <span className={css.heroTitleAccent}>/ ร้องเรียน</span>
            </h1>
            <p className={css.heroLead}>
              ทุกเรื่องที่ท่านแจ้งจะได้รับ <strong>เลขที่เรื่อง</strong> ทันที
              ใช้ติดตามสถานะและอ่านคำตอบจากเจ้าหน้าที่ได้ตลอด 24 ชั่วโมง
            </p>

            <ol className={css.steps}>
              <li>
                <span className={css.stepNum}>1</span>
                <span>กรอกเรื่อง</span>
              </li>
              <li aria-hidden="true" className={css.stepArrow}><ChevronRight size={16} /></li>
              <li>
                <span className={css.stepNum}>2</span>
                <span>รับเลขที่เรื่อง</span>
              </li>
              <li aria-hidden="true" className={css.stepArrow}><ChevronRight size={16} /></li>
              <li>
                <span className={css.stepNum}>3</span>
                <span>ติดตามสถานะ</span>
              </li>
            </ol>
          </div>

          {/* ติดตามเรื่องแบบด่วน จาก hero */}
          <form
            className={css.quickTrack}
            onSubmit={(e) => {
              e.preventDefault();
              goTrack(heroInput);
            }}
          >
            <span className={css.quickTrackIcon}><Ticket size={20} /></span>
            <h2 className={css.quickTrackTitle}>มีเลขที่เรื่องแล้ว?</h2>
            <p className={css.quickTrackSub}>กรอกเลขที่เรื่องเพื่อดูสถานะและคำตอบ</p>
            <div className={css.quickTrackRow}>
              <input
                className={css.quickTrackInput}
                placeholder="CP260924-K7QX2M"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value.toUpperCase())}
                aria-label="เลขที่เรื่อง"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className={css.quickTrackBtn}>
                <Search size={16} /> ตรวจสอบ
              </button>
            </div>
            {saved.length > 0 && (
              <button type="button" className={css.quickTrackSaved} onClick={() => goTrack()}>
                <History size={14} /> เรื่องที่เคยแจ้งจากอุปกรณ์นี้ ({saved.length})
              </button>
            )}
          </form>
        </div>
      </section>

      <div className={css.main} ref={mainRef}>
        {/* ══ สลับโหมด ══ */}
        {!receipt && (
          <div className={css.switcher} role="tablist" aria-label="เลือกการทำรายการ">
            <button
              role="tab"
              aria-selected={view === "submit"}
              className={`${css.switchBtn} ${view === "submit" ? css.switchActive : ""}`}
              onClick={() => setView("submit")}
            >
              <Send size={16} /> แจ้งเรื่องใหม่
            </button>
            <button
              role="tab"
              aria-selected={view === "track"}
              className={`${css.switchBtn} ${view === "track" ? css.switchActive : ""}`}
              onClick={() => setView("track")}
            >
              <Search size={16} /> ติดตามสถานะ
              {saved.length > 0 && <span className={css.switchCount}>{saved.length}</span>}
            </button>
          </div>
        )}

        {receipt ? (
          /* ══ หลังส่งสำเร็จ: ใบรับเรื่อง ══ */
          <div className={css.receiptWrap}>
            <div className={css.receiptHead}>
              <span className={css.receiptCheck}><CircleCheck size={30} /></span>
              <h2 className={css.receiptTitle}>ส่งเรื่องเรียบร้อยแล้ว</h2>
              <p className={css.receiptLead}>
                เก็บ <strong>เลขที่เรื่อง</strong> ด้านล่างไว้ เพื่อใช้ติดตามสถานะและอ่านคำตอบจากเจ้าหน้าที่
              </p>
            </div>

            <article className={css.ticket} id="complaint-receipt" aria-label="ใบรับเรื่อง">
              <header className={css.ticketHead}>
                <span>ใบรับเรื่อง · สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</span>
                <span className={css.ticketCat}>{categoryLabels[receipt.category]}</span>
              </header>
              <div className={css.ticketBody}>
                <span className={css.ticketLabel}>เลขที่เรื่อง</span>
                <button
                  type="button"
                  className={css.ticketCode}
                  onClick={() => handleCopyCode(receipt.code)}
                  title="แตะเพื่อคัดลอก"
                >
                  <CodeChunks code={receipt.code} />
                  <Copy size={18} className={css.ticketCopyIcon} aria-hidden="true" />
                </button>
                <dl className={css.ticketMeta}>
                  <div>
                    <dt>เรื่อง</dt>
                    <dd>{receipt.subject}</dd>
                  </div>
                  <div>
                    <dt>วันที่แจ้ง</dt>
                    <dd>{formatDate(receipt.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>สถานะ</dt>
                    <dd><span className={`${css.badge} ${css.badgePending}`}>{statusLabels.pending}</span></dd>
                  </div>
                </dl>
              </div>
              <footer className={css.ticketFoot}>
                ติดตามสถานะ: <span className={css.ticketUrl}>{trackingUrl(receipt.code)}</span>
              </footer>
            </article>

            <div className={css.receiptActions}>
              <button className={css.actionBtn} onClick={() => handleCopyCode(receipt.code)}>
                <Copy size={16} /> คัดลอกเลข
              </button>
              <button className={css.actionBtn} onClick={() => handleCopyLink(receipt.code)}>
                <Link2 size={16} /> คัดลอกลิงก์ติดตาม
              </button>
              <button className={css.actionBtn} onClick={() => handleShare(receipt.code)}>
                <Share2 size={16} /> ส่งเข้า LINE / แชร์
              </button>
              <button className={css.actionBtn} onClick={() => window.print()}>
                <Printer size={16} /> พิมพ์ / บันทึก PDF
              </button>
            </div>

            <p className={css.savedNote}>
              <ShieldCheck size={16} />
              ระบบบันทึกเลขที่เรื่องไว้ในเบราว์เซอร์นี้แล้ว หากเปิดจากเครื่องอื่นหรือล้างข้อมูลเบราว์เซอร์
              จะต้องใช้เลขที่เรื่องในการค้นหา — แนะนำให้ถ่ายภาพหน้าจอเก็บไว้
            </p>

            <div className={css.receiptNav}>
              <button className={css.primaryBtn} onClick={() => goTrack(receipt.code)}>
                <Search size={16} /> ดูสถานะเรื่องนี้
              </button>
              <button className={css.ghostBtn} onClick={resetForm}>
                แจ้งเรื่องใหม่
              </button>
              <Link href="/" className={css.ghostBtn}>กลับหน้าหลัก</Link>
            </div>
          </div>
        ) : view === "submit" ? (
          /* ══ แบบฟอร์มแจ้งเรื่อง ══ */
          <div className={css.layout}>
            <form className={css.card} onSubmit={handleSubmitClick} noValidate>
              {/* honeypot — มองไม่เห็นสำหรับคน */}
              <input
                type="text"
                name="website"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className={css.hp}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* 1. ประเภท */}
              <fieldset className={css.section}>
                <legend className={css.sectionTitle}>
                  <span className={css.sectionNum}>1</span> ต้องการแจ้งเรื่องอะไร
                </legend>
                <div className={css.catGrid} role="radiogroup">
                  {categories.map(({ value, label, desc, Icon, tone }) => (
                    <label
                      key={value}
                      className={`${css.catCard} ${css[tone]} ${category === value ? css.catActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={value}
                        checked={category === value}
                        onChange={() => setCategory(value)}
                        className={css.srOnly}
                      />
                      <span className={css.catIcon}><Icon size={22} /></span>
                      <span className={css.catText}>
                        <span className={css.catLabel}>{label}</span>
                        <span className={css.catDesc}>{desc}</span>
                      </span>
                      <span className={css.catRadio} aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* 2. รายละเอียด */}
              <fieldset className={css.section}>
                <legend className={css.sectionTitle}>
                  <span className={css.sectionNum}>2</span> รายละเอียดเรื่อง
                </legend>

                <div className={css.field}>
                  <label htmlFor="field-subject" className={css.label}>
                    หัวข้อเรื่อง <span className={css.req}>*</span>
                  </label>
                  <input
                    id="field-subject"
                    className={`${css.input} ${errors.subject ? css.invalid : ""}`}
                    placeholder="เช่น รอคิวที่เคาน์เตอร์นานเกิน 1 ชั่วโมง"
                    value={subject}
                    maxLength={SUBJECT_MAX}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      clearError("subject");
                    }}
                    aria-invalid={!!errors.subject}
                  />
                  <div className={css.fieldFoot}>
                    {errors.subject ? <span className={css.err}><CircleAlert size={13} /> {errors.subject}</span> : <span />}
                    <span className={css.counter}>{subject.length}/{SUBJECT_MAX}</span>
                  </div>
                </div>

                <div className={css.field}>
                  <label htmlFor="field-detail" className={css.label}>
                    รายละเอียด <span className={css.req}>*</span>
                  </label>
                  <textarea
                    id="field-detail"
                    className={`${css.input} ${css.textarea} ${errors.detail ? css.invalid : ""}`}
                    placeholder={"เล่าเหตุการณ์ให้เจ้าหน้าที่เข้าใจ เช่น\n• เกิดอะไรขึ้น\n• วันที่และเวลาโดยประมาณ\n• สถานที่ / ช่องทาง (สาขา, แอป, โทรศัพท์)\n• สิ่งที่ต้องการให้สหกรณ์ดำเนินการ"}
                    value={detail}
                    maxLength={DETAIL_MAX}
                    onChange={(e) => {
                      setDetail(e.target.value);
                      clearError("detail");
                    }}
                    aria-invalid={!!errors.detail}
                  />
                  <div className={css.fieldFoot}>
                    {errors.detail ? <span className={css.err}><CircleAlert size={13} /> {errors.detail}</span> : <span />}
                    <span className={css.counter}>{detail.length}/{DETAIL_MAX}</span>
                  </div>
                </div>
              </fieldset>

              {/* 3. ข้อมูลติดต่อ */}
              <fieldset className={css.section}>
                <legend className={css.sectionTitle}>
                  <span className={css.sectionNum}>3</span> ข้อมูลติดต่อกลับ
                  <span className={css.optional}>ไม่บังคับ</span>
                </legend>

                <label className={css.toggle}>
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => {
                      setAnonymous(e.target.checked);
                      setErrors((prev) => ({ ...prev, tel: undefined, email: undefined }));
                    }}
                  />
                  <span className={css.toggleTrack} aria-hidden="true"><span className={css.toggleThumb} /></span>
                  <span className={css.toggleText}>
                    <strong><EyeOff size={14} /> ไม่ประสงค์ออกนาม</strong>
                    <span>ไม่ต้องกรอกข้อมูลส่วนตัว ยังติดตามผลได้ด้วยเลขที่เรื่อง</span>
                  </span>
                </label>

                {!anonymous && (
                  <div className={css.contactGrid}>
                    <div className={css.field}>
                      <label htmlFor="field-member" className={css.label}><IdCard size={14} /> เลขทะเบียนสมาชิก</label>
                      <input
                        id="field-member"
                        className={css.input}
                        placeholder="เช่น 012345"
                        inputMode="numeric"
                        value={memberId}
                        maxLength={20}
                        onChange={(e) => setMemberId(e.target.value)}
                      />
                    </div>
                    <div className={css.field}>
                      <label htmlFor="field-name" className={css.label}><User size={14} /> ชื่อ - นามสกุล</label>
                      <input
                        id="field-name"
                        className={css.input}
                        placeholder="ชื่อ-นามสกุล"
                        autoComplete="name"
                        value={name}
                        maxLength={120}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className={css.field}>
                      <label htmlFor="field-tel" className={css.label}><Phone size={14} /> เบอร์โทรศัพท์</label>
                      <input
                        id="field-tel"
                        className={`${css.input} ${errors.tel ? css.invalid : ""}`}
                        placeholder="เช่น 081-234-5678"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={tel}
                        maxLength={20}
                        onChange={(e) => {
                          setTel(e.target.value);
                          clearError("tel");
                        }}
                        aria-invalid={!!errors.tel}
                      />
                      {errors.tel && <span className={css.err}><CircleAlert size={13} /> {errors.tel}</span>}
                    </div>
                    <div className={css.field}>
                      <label htmlFor="field-email" className={css.label}><Mail size={14} /> อีเมล</label>
                      <input
                        id="field-email"
                        className={`${css.input} ${errors.email ? css.invalid : ""}`}
                        placeholder="เช่น example@gmail.com"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        maxLength={120}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearError("email");
                        }}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <span className={css.err}><CircleAlert size={13} /> {errors.email}</span>}
                    </div>
                    <p className={css.contactHint}>
                      ให้เบอร์โทรหรืออีเมลไว้ เจ้าหน้าที่จะติดต่อกลับได้ในกรณีที่ต้องการข้อมูลเพิ่มเติม
                    </p>
                  </div>
                )}
              </fieldset>

              {/* ยืนยันและส่ง */}
              <div className={css.submitArea}>
                <label className={`${css.pdpa} ${errors.pdpa ? css.pdpaInvalid : ""}`}>
                  <input
                    id="field-pdpa"
                    type="checkbox"
                    checked={pdpaConsent}
                    onChange={(e) => {
                      setPdpaConsent(e.target.checked);
                      clearError("pdpa");
                    }}
                  />
                  <span>
                    ข้าพเจ้ายินยอมให้สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด จัดเก็บและใช้ข้อมูลที่แจ้งไว้
                    เพื่อดำเนินการตามเรื่องนี้เท่านั้น ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562{" "}
                    <Link href="/privacy-policy" target="_blank" className={css.inlineLink}>อ่านนโยบาย</Link>
                  </span>
                </label>
                {errors.pdpa && <span className={css.err}><CircleAlert size={13} /> {errors.pdpa}</span>}

                {submitError && (
                  <div className={css.alert} role="alert">
                    <CircleAlert size={16} /> {submitError}
                  </div>
                )}

                <div className={css.submitRow}>
                  <button
                    className={css.submitBtn}
                    type="submit"
                    disabled={submitting || !canSubmit}
                    aria-describedby="submit-missing"
                  >
                    <Send size={17} /> ตรวจสอบและส่งเรื่อง
                  </button>
                  {!canSubmit && (
                    <span id="submit-missing" className={css.missing}>
                      <CircleAlert size={14} /> ยังขาด: {missing.join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            </form>

            {/* Aside: ความมั่นใจ */}
            <aside className={css.aside}>
              <div className={css.asideCard}>
                <h3 className={css.asideTitle}>หลังส่งเรื่อง ท่านจะได้รับ</h3>
                <div className={css.miniTicket} aria-hidden="true">
                  <span className={css.miniTicketLabel}>เลขที่เรื่อง</span>
                  <span className={css.miniTicketCode}>CP260924-K7QX2M</span>
                </div>
                <ul className={css.promiseList}>
                  <li>
                    <span className={`${css.promiseIcon} ${css.toneBlue}`}><Search size={16} /></span>
                    <span><strong>ติดตามสถานะได้ 24 ชม.</strong>ดูว่าเรื่องอยู่ขั้นตอนไหน และอ่านคำตอบจากเจ้าหน้าที่</span>
                  </li>
                  <li>
                    <span className={`${css.promiseIcon} ${css.toneGold}`}><Share2 size={16} /></span>
                    <span><strong>บันทึก / ส่งเข้า LINE</strong>คัดลอกลิงก์ติดตาม หรือพิมพ์ใบรับเรื่องเก็บไว้</span>
                  </li>
                  <li>
                    <span className={`${css.promiseIcon} ${css.toneGreen}`}><ShieldCheck size={16} /></span>
                    <span><strong>ข้อมูลเป็นความลับ</strong>เฉพาะเจ้าหน้าที่ผู้รับผิดชอบเท่านั้นที่เห็นข้อมูลผู้แจ้ง</span>
                  </li>
                </ul>
              </div>

              <div className={css.asideHelp}>
                <Clock size={16} />
                <span>
                  เรื่องเร่งด่วน? <Link href="/contact" className={css.inlineLink}>ติดต่อสหกรณ์โดยตรง</Link>
                </span>
              </div>
            </aside>
          </div>
        ) : (
          /* ══ ติดตามสถานะ ══ */
          <div className={css.layout}>
            <div className={css.card}>
              <div className={css.section}>
                <h2 className={css.sectionTitle}>
                  <Search size={18} /> ติดตามสถานะเรื่อง
                </h2>
                <form
                  className={css.trackRow}
                  onSubmit={(e) => {
                    e.preventDefault();
                    lookup(trackInput);
                  }}
                >
                  <input
                    className={`${css.input} ${css.trackInput}`}
                    placeholder="กรอกเลขที่เรื่อง เช่น CP260924-K7QX2M"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                    aria-label="เลขที่เรื่อง"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button className={css.primaryBtn} type="submit" disabled={tracking}>
                    {tracking ? <LoaderCircle size={16} className={css.spin} /> : <Search size={16} />}
                    ค้นหา
                  </button>
                </form>
                <p className={css.trackHint}>ไม่ต้องกังวลเรื่องตัวพิมพ์เล็ก-ใหญ่ หรือเครื่องหมายขีด ระบบจัดรูปแบบให้อัตโนมัติ</p>

                {trackError && (
                  <div className={css.alert} role="alert">
                    <CircleAlert size={16} /> {trackError}
                  </div>
                )}

                {tracking && !trackResult && <div className={css.skeleton} aria-label="กำลังค้นหา" />}

                {!tracking && !trackResult && !trackError && (
                  <div className={css.empty}>
                    <Inbox size={36} strokeWidth={1.5} />
                    <p>กรอกเลขที่เรื่องที่ได้รับหลังส่งเรื่อง<br />หรือเลือกจากรายการ “เรื่องของฉัน”</p>
                  </div>
                )}

                {trackResult && <StatusCard result={trackResult} onRefresh={() => lookup(trackResult.trackingCode)} onCopyLink={() => handleCopyLink(trackResult.trackingCode)} refreshing={tracking} />}
              </div>
            </div>

            {/* เรื่องของฉัน */}
            <aside className={css.aside}>
              <div className={css.asideCard}>
                <h3 className={css.asideTitle}><History size={16} /> เรื่องของฉัน</h3>
                {saved.length === 0 ? (
                  <p className={css.asideEmpty}>
                    ยังไม่มีเรื่องที่แจ้งจากอุปกรณ์นี้ เมื่อแจ้งเรื่อง ระบบจะจำเลขที่เรื่องไว้ให้ที่นี่อัตโนมัติ
                  </p>
                ) : (
                  <ul className={css.myList}>
                    {saved.map((c) => {
                      const st = savedStatus[c.code];
                      const Icon = catMeta(c.category).Icon;
                      const active = trackResult?.trackingCode === c.code;
                      return (
                        <li key={c.code} className={`${css.myItem} ${active ? css.myItemActive : ""}`}>
                          <button className={css.myItemBtn} onClick={() => lookup(c.code)}>
                            <span className={`${css.myIcon} ${css[catMeta(c.category).tone]}`}><Icon size={16} /></span>
                            <span className={css.myText}>
                              <span className={css.mySubject}>{c.subject}</span>
                              <span className={css.myCode}>{c.code} · {formatDate(c.createdAt, false)}</span>
                            </span>
                            {st && <span className={`${css.dot} ${statusTone[st] || ""}`} title={statusLabels[st]} />}
                          </button>
                          <button
                            className={css.myRemove}
                            onClick={() => handleRemoveSaved(c.code)}
                            aria-label={`ลบ ${c.code} ออกจากรายการในอุปกรณ์นี้`}
                            title="ลบออกจากรายการ (ไม่ได้ลบเรื่องในระบบ)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className={css.asideHelp}>
                <ShieldCheck size={16} />
                <span>รายการนี้เก็บเฉพาะในเบราว์เซอร์ของท่าน ผู้อื่นไม่สามารถเห็นได้</span>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ══ ยืนยันก่อนส่ง ══ */}
      {showConfirm && (
        <div className={css.overlay} onClick={() => !submitting && setShowConfirm(false)}>
          <div className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <button className={css.dialogClose} onClick={() => setShowConfirm(false)} disabled={submitting} aria-label="ปิด">
              <X size={18} />
            </button>
            <h3 id="confirm-title" className={css.dialogTitle}>ตรวจสอบก่อนส่งเรื่อง</h3>
            <p className={css.dialogSub}>เมื่อส่งแล้วจะไม่สามารถแก้ไขได้</p>
            <dl className={css.summary}>
              <div><dt>ประเภท</dt><dd>{categoryLabels[category]}</dd></div>
              <div><dt>หัวข้อ</dt><dd>{subject}</dd></div>
              <div><dt>รายละเอียด</dt><dd className={css.summaryDetail}>{detail}</dd></div>
              <div>
                <dt>ผู้แจ้ง</dt>
                <dd>{anonymous || (!name.trim() && !memberId.trim()) ? "ไม่ประสงค์ออกนาม" : [name.trim(), memberId.trim() && `สมาชิก ${memberId.trim()}`].filter(Boolean).join(" · ")}</dd>
              </div>
            </dl>
            <div className={css.dialogActions}>
              <button className={css.ghostBtn} onClick={() => setShowConfirm(false)} disabled={submitting}>
                กลับไปแก้ไข
              </button>
              <button className={css.primaryBtn} onClick={handleConfirmSubmit} disabled={submitting}>
                {submitting ? <LoaderCircle size={16} className={css.spin} /> : <Send size={16} />}
                {submitting ? "กำลังส่ง..." : "ยืนยันส่งเรื่อง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`${css.toast} ${toast ? css.toastShow : ""}`} role="status" aria-live="polite">
        <Check size={16} /> {toast}
      </div>
    </>
  );
}

/* ═══════════════════════ Status card + timeline ═══════════════════════ */
function StatusCard({
  result,
  onRefresh,
  onCopyLink,
  refreshing,
}: {
  result: TrackResult;
  onRefresh: () => void;
  onCopyLink: () => void;
  refreshing: boolean;
}) {
  const rejected = result.status === "rejected";
  const stage = { pending: 0, reviewing: 1, resolved: 2, rejected: 2 }[result.status] ?? 0;
  const closed = stage === 2;

  const steps = [
    { label: "รับเรื่องแล้ว", date: result.createdAt, desc: "ระบบได้รับเรื่องของท่านแล้ว" },
    { label: "กำลังตรวจสอบ", date: stage === 1 ? result.updatedAt : null, desc: "เจ้าหน้าที่กำลังพิจารณาและดำเนินการ" },
    {
      label: rejected ? "ไม่รับพิจารณา" : "ดำเนินการเสร็จสิ้น",
      date: closed ? result.resolvedAt ?? result.updatedAt : null,
      desc: rejected ? "โปรดอ่านเหตุผลจากเจ้าหน้าที่ด้านล่าง" : "ปิดเรื่องเรียบร้อย",
    },
  ];

  const note = decodeEntities(result.adminNote);

  return (
    <div className={css.status}>
      <header className={css.statusHead}>
        <div className={css.statusHeadText}>
          <span className={css.statusCode}><CodeChunks code={result.trackingCode} /></span>
          <h3 className={css.statusSubject}>{decodeEntities(result.subject)}</h3>
          <span className={css.statusCat}>{categoryLabels[result.category] || result.category}</span>
        </div>
        <span className={`${css.badge} ${statusTone[result.status] || ""}`}>
          {statusLabels[result.status] || result.status}
        </span>
      </header>

      <ol className={css.timeline}>
        {steps.map((s, i) => {
          const done = i < stage || (i === stage && closed);
          const current = i === stage && !closed;
          const cls = [
            css.tlItem,
            done ? css.tlDone : "",
            current ? css.tlCurrent : "",
            i === 2 && rejected ? css.tlRejected : "",
          ].join(" ");
          return (
            <li key={s.label} className={cls}>
              <span className={css.tlDot} aria-hidden="true">
                {i === 2 && rejected ? <CircleX size={16} /> : done ? <Check size={14} strokeWidth={3} /> : current ? <span className={css.tlPulse} /> : null}
              </span>
              <div className={css.tlBody}>
                <span className={css.tlLabel}>
                  {s.label}
                  {current && <span className={css.tlNow}>ขั้นตอนปัจจุบัน</span>}
                </span>
                <span className={css.tlDesc}>
                  {s.date && (done || current) ? formatDate(s.date) : s.desc}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {note && result.status !== "pending" ? (
        <div className={`${css.reply} ${rejected ? css.replyRejected : ""}`}>
          <div className={css.replyHead}>
            <MessageCircleReply size={16} /> คำตอบจากเจ้าหน้าที่
          </div>
          <p className={css.replyBody}>{note}</p>
        </div>
      ) : (
        !closed && (
          <p className={css.waitNote}>
            <Clock size={15} /> เมื่อเจ้าหน้าที่ตอบกลับ คำตอบจะแสดงที่นี่ — กลับมาตรวจสอบได้ด้วยเลขที่เรื่องเดิม
          </p>
        )
      )}

      <footer className={css.statusFoot}>
        <span>อัปเดตล่าสุด {formatDate(result.updatedAt)}</span>
        <span className={css.statusFootActions}>
          <button className={css.linkBtn} onClick={onCopyLink}><Link2 size={14} /> คัดลอกลิงก์</button>
          <button className={css.linkBtn} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? css.spin : ""} /> รีเฟรช
          </button>
        </span>
      </footer>
    </div>
  );
}
