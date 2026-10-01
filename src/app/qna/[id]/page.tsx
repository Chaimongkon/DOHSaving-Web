"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  Send,
  ShieldCheck,
  Hourglass,
  Link2,
  Check,
  CircleAlert,
  LoaderCircle,
  PenLine,
  ArrowDown,
  MessagesSquare,
  Plus,
  UserRound,
  EyeOff,
} from "lucide-react";
import { ANONYMOUS, Avatar, QnaHero, RichText, formatDate, timeAgo, usePrivacyGate } from "../qnaShared";
import { isMyQuestion, markSeen } from "../myQuestions";
import { RESERVED_NAME_ERROR, isReservedName, removeSensitive } from "@/lib/qnaPrivacy";
import css from "../qna.module.css";

interface Reply {
  id: number;
  authorName: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}

interface QuestionDetail {
  id: number;
  authorName: string;
  title: string;
  body: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  replies: Reply[];
}

const REPLY_MAX = 3000;

export default function QnaThreadPage() {
  const params = useParams();
  const id = params?.id as string;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mine, setMine] = useState(false);

  const [replyAnon, setReplyAnon] = useState(false);
  const [replyName, setReplyName] = useState("");
  const [replyCode, setReplyCode] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const fetchQuestion = useCallback(async (): Promise<QuestionDetail | null> => {
    const res = await fetch(`/api/qna/${id}`);
    if (!res.ok) return null;
    return (await res.json()).question;
  }, [id]);

  // กระทู้ของตัวเอง → จดจำนวนคำตอบที่เห็นแล้ว (ล้างป้าย "มีคำตอบใหม่" ในหน้ากระดาน)
  const trackSeen = useCallback((q: QuestionDetail) => {
    if (isMyQuestion(q.id)) {
      markSeen(q.id, q.replies.length);
      setMine(true);
    }
  }, []);

  // โหลดซ้ำหลังส่งคำตอบ
  const load = useCallback(async () => {
    const q = await fetchQuestion().catch(() => null);
    if (q) {
      setQuestion(q);
      trackSeen(q);
    }
  }, [fetchQuestion, trackSeen]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchQuestion()
      .catch(() => null)
      .then((q) => {
        if (cancelled) return;
        if (q) {
          setQuestion(q);
          trackSeen(q);
        } else setNotFound(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchQuestion, trackSeen]);

  const nameReserved = !replyAnon && isReservedName(replyName);
  const canReply = replyBody.trim().length >= 2 && !nameReserved;

  const privacy = usePrivacyGate((types) => setReplyBody((b) => removeSensitive(b, types)));

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReply) return;
    privacy.check(replyBody, postReply);
  };

  const postReply = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/qna/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ไม่ประสงค์ออกนาม = ไม่ส่งทั้งชื่อและเลขสมาชิก
          authorName: replyAnon ? ANONYMOUS : replyName.trim() || ANONYMOUS,
          memberCode: replyAnon ? "000000" : replyCode.trim() || "000000",
          body: replyBody.trim(),
          _hp: hp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "ส่งคำตอบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      setReplyBody("");
      await load();
      flash("ส่งคำตอบเรียบร้อยแล้ว");
      requestAnimationFrame(() =>
        document.getElementById(`reply-${data.reply?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    } catch {
      setFormError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("คัดลอกลิงก์กระทู้แล้ว");
    } catch {
      flash("คัดลอกไม่สำเร็จ");
    }
  };

  const scrollTo = (elId: string) =>
    document.getElementById(elId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── Loading ──
  if (loading) {
    return (
      <>
        <QnaHero compact eyebrow="ถาม-ตอบ Q&A" title="กำลังโหลดกระทู้..." />
        <div className={css.main}>
          <div className={css.thread}>
            <div className={css.skeletonCard} style={{ height: 220 }} />
            <div className={css.skeletonCard} />
          </div>
        </div>
      </>
    );
  }

  // ── Not found ──
  if (notFound || !question) {
    return (
      <>
        <QnaHero compact eyebrow="ถาม-ตอบ Q&A" title="ไม่พบกระทู้นี้" />
        <div className={css.main}>
          <div className={css.empty}>
            <MessagesSquare size={40} strokeWidth={1.5} />
            <h3>กระทู้อาจถูกลบหรือซ่อนไปแล้ว</h3>
            <p>ลองค้นหาคำถามที่คล้ายกันในกระดานถาม-ตอบ</p>
            <Link href="/qna" className={css.primaryBtn}>
              <ArrowLeft size={16} /> กลับกระดานถาม-ตอบ
            </Link>
          </div>
        </div>
      </>
    );
  }

  const staffReply = question.replies.find((r) => r.isAdmin);
  const replyCount = question.replies.length;

  return (
    <>
      <QnaHero
        compact
        eyebrow={
          <Link href="/qna" className={css.crumb}>
            <ArrowLeft size={14} /> กระดานถาม-ตอบ
          </Link>
        }
        title={question.title}
      >
        <div className={css.threadTags}>
          {question.isPinned && <span className={`${css.tag} ${css.tagPin}`}><Pin size={12} /> ปักหมุด</span>}
          {staffReply ? (
            <span className={`${css.tag} ${css.tagStaff}`}><ShieldCheck size={12} /> เจ้าหน้าที่ตอบแล้ว</span>
          ) : replyCount > 0 ? (
            <span className={`${css.tag} ${css.tagAnswered}`}><MessageCircle size={12} /> มีคำตอบ</span>
          ) : (
            <span className={`${css.tag} ${css.tagWaiting}`}><Hourglass size={12} /> รอคำตอบ</span>
          )}
          {question.isClosed && <span className={`${css.tag} ${css.tagClosed}`}><Lock size={12} /> ปิดรับคำตอบ</span>}
          <span className={css.heroMeta}><Eye size={14} /> {question.views.toLocaleString("th-TH")} เข้าชม</span>
          <span className={css.heroMeta}><MessageCircle size={14} /> {replyCount} คำตอบ</span>
        </div>
      </QnaHero>

      <div className={css.main}>
        <div className={css.thread}>
          {/* ทางลัดไปคำตอบเจ้าหน้าที่ */}
          {staffReply && (
            <button className={css.staffBanner} onClick={() => scrollTo(`reply-${staffReply.id}`)}>
              <span className={css.staffBannerIcon}><ShieldCheck size={18} /></span>
              <span className={css.staffBannerText}>
                <strong>เจ้าหน้าที่สหกรณ์ตอบกระทู้นี้แล้ว</strong>
                <span>{timeAgo(staffReply.createdAt)} · แตะเพื่อไปที่คำตอบ</span>
              </span>
              <ArrowDown size={18} />
            </button>
          )}

          {mine && (
            <p className={css.mineNote}>
              <UserRound size={16} /> นี่คือคำถามของท่าน — เมื่อมีคำตอบใหม่ จะมีป้ายแจ้งที่หน้ากระดานถาม-ตอบ
            </p>
          )}

          {/* คำถาม */}
          <article className={css.post}>
            <header className={css.postHead}>
              <Avatar name={question.authorName} size={44} />
              <div className={css.postWho}>
                <strong>{question.authorName}</strong>
                <span title={formatDate(question.createdAt, true)}>
                  ตั้งคำถาม · {formatDate(question.createdAt, true)}
                </span>
              </div>
              <button className={css.iconBtn} onClick={copyLink} aria-label="คัดลอกลิงก์กระทู้" title="คัดลอกลิงก์">
                <Link2 size={17} />
              </button>
            </header>
            <div className={css.qaLine}>
              <span className={`${css.qaMark} ${css.qaMarkQ}`} aria-label="คำถาม">Q</span>
              <div className={css.postBody}>
                <RichText text={question.body} reveal={{ qid: question.id, src: "q" }} />
              </div>
            </div>
          </article>

          {/* คำตอบ */}
          <section aria-labelledby="replies-title">
            <h2 id="replies-title" className={css.repliesTitle}>
              คำตอบ <span className={css.repliesCount}>{replyCount}</span>
            </h2>

            {replyCount === 0 ? (
              <div className={css.noReplies}>
                <Hourglass size={22} />
                <p>
                  ยังไม่มีคำตอบ — เจ้าหน้าที่จะเข้ามาตอบโดยเร็ว
                  {!question.isClosed && <> หรือหากท่านทราบคำตอบ <button className={css.textBtn} onClick={() => scrollTo("reply-form")}>ช่วยตอบได้เลย</button></>}
                </p>
              </div>
            ) : (
              <ol className={css.replies}>
                {question.replies.map((r) => (
                  <li key={r.id} id={`reply-${r.id}`} className={`${css.reply} ${r.isAdmin ? css.replyStaff : ""}`}>
                    <Avatar name={r.authorName} staff={r.isAdmin} size={38} />
                    <div className={css.replyMain}>
                      <div className={css.replyHead}>
                        <span className={`${css.aChip} ${r.isAdmin ? css.qaMarkStaff : css.qaMarkMember}`} aria-label="คำตอบ">A</span>
                        <strong>{r.authorName}</strong>
                        {r.isAdmin && <span className={css.staffTag}><ShieldCheck size={12} /> เจ้าหน้าที่สหกรณ์</span>}
                        <span className={css.replyTime} title={formatDate(r.createdAt, true)}>{timeAgo(r.createdAt)}</span>
                      </div>
                      <div className={css.replyBody}>
                        <RichText text={r.body} reveal={{ qid: question.id, src: String(r.id) }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ตอบกระทู้ */}
          {question.isClosed ? (
            <div className={css.closedNote}>
              <Lock size={18} />
              <span>
                กระทู้นี้ปิดรับคำตอบแล้ว หากมีคำถามเพิ่มเติม{" "}
                <Link href="/qna/new" className={css.inlineLink}>ตั้งคำถามใหม่</Link>
              </span>
            </div>
          ) : (
            <form id="reply-form" className={css.composer} onSubmit={handleReply}>
              <h2 className={css.composerTitle}><PenLine size={18} /> ร่วมตอบกระทู้</h2>
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
              <div className={css.field}>
                <label htmlFor="reply-body" className={css.srOnly}>ข้อความ</label>
                <textarea
                  id="reply-body"
                  className={`${css.input} ${css.textarea}`}
                  placeholder="พิมพ์คำตอบหรือความคิดเห็นของท่าน..."
                  value={replyBody}
                  maxLength={REPLY_MAX}
                  onChange={(e) => setReplyBody(e.target.value)}
                />
                <span className={css.counter}>{replyBody.length}/{REPLY_MAX}</span>
              </div>
              <label className={css.toggle}>
                <input type="checkbox" checked={replyAnon} onChange={(e) => setReplyAnon(e.target.checked)} />
                <span className={css.toggleTrack} aria-hidden="true"><span className={css.toggleThumb} /></span>
                <span className={css.toggleText}>
                  <strong><EyeOff size={14} /> ไม่ประสงค์ออกนาม</strong>
                  <span>ไม่ต้องกรอกชื่อหรือเลขสมาชิก — ระบบไม่บันทึกตัวตนไว้กับคำตอบนี้</span>
                </span>
              </label>

              {!replyAnon && (
                <div className={css.composerRow}>
                  <div className={css.field}>
                    <label htmlFor="reply-name" className={css.label}>ชื่อที่แสดง <span className={css.optional}>ไม่บังคับ</span></label>
                    <input
                      id="reply-name"
                      className={`${css.input} ${nameReserved ? css.invalid : ""}`}
                      placeholder="เช่น สมชาย หรือ ชื่อเล่น"
                      value={replyName}
                      maxLength={100}
                      autoComplete="name"
                      onChange={(e) => setReplyName(e.target.value)}
                      aria-invalid={nameReserved}
                    />
                    {nameReserved && <span className={css.err}><CircleAlert size={13} /> {RESERVED_NAME_ERROR}</span>}
                  </div>
                  <div className={css.field}>
                    <label htmlFor="reply-code" className={css.label}>เลขทะเบียนสมาชิก <span className={css.optional}>ไม่บังคับ</span></label>
                    <input
                      id="reply-code"
                      className={css.input}
                      placeholder="เช่น 012345"
                      inputMode="numeric"
                      value={replyCode}
                      maxLength={20}
                      onChange={(e) => setReplyCode(e.target.value)}
                    />
                    <span className={css.hint}>ไม่แสดงบนกระดาน</span>
                  </div>
                </div>
              )}

              {formError && (
                <div className={css.alert} role="alert"><CircleAlert size={16} /> {formError}</div>
              )}

              <div className={css.submitRow}>
                <button className={css.submitBtn} type="submit" disabled={submitting || !canReply}>
                  {submitting ? <LoaderCircle size={16} className={css.spin} /> : <Send size={16} />}
                  {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                </button>
                <span className={css.privacyNote}>กระดานนี้เป็นสาธารณะ ห้ามใส่เลขบัตรประชาชนหรือเลขบัญชี · เบอร์โทรจะถูกซ่อนจนกว่ามีคนกดดู</span>
              </div>
            </form>
          )}

          <div className={css.threadNav}>
            <Link href="/qna" className={css.ghostBtn}><ArrowLeft size={16} /> กลับกระดานถาม-ตอบ</Link>
            <Link href="/qna/new" className={css.ghostBtn}><Plus size={16} /> ตั้งคำถามใหม่</Link>
          </div>
        </div>
      </div>

      {!question.isClosed && (
        <button className={css.fab} onClick={() => scrollTo("reply-form")}>
          <PenLine size={18} /> ตอบ
        </button>
      )}

      {privacy.dialog}

      <div className={`${css.toast} ${toast ? css.toastShow : ""}`} role="status" aria-live="polite">
        <Check size={16} /> {toast}
      </div>
    </>
  );
}
