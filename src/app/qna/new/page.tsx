"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CircleAlert,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Ban,
  Phone,
  MessageSquareWarning,
  EyeOff,
  Hourglass,
  Eye,
} from "lucide-react";
import { ANONYMOUS, Avatar, QnaHero, usePrivacyGate } from "../qnaShared";
import { addMyQuestion } from "../myQuestions";
import { RESERVED_NAME_ERROR, isReservedName, removeSensitive } from "@/lib/qnaPrivacy";
import css from "../qna.module.css";

const TITLE_MAX = 200;
const BODY_MAX = 3000;

interface Similar {
  id: number;
  title: string;
  replyCount: number;
  hasStaffReply: boolean;
}

export default function QnaNewPage() {
  return (
    <Suspense fallback={null}>
      <AskForm />
    </Suspense>
  );
}

function AskForm() {
  const router = useRouter();
  const params = useSearchParams();

  // มาจาก "ยังไม่มีใครถามเรื่องนี้" ในหน้ารายการ → เติมหัวข้อให้
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [similar, setSimilar] = useState<Similar[]>([]);

  // คำถามที่คล้ายกัน — ช่วยให้เจอคำตอบเดิมก่อนตั้งกระทู้ซ้ำ
  useEffect(() => {
    const q = title.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (q.length < 3) {
        setSimilar([]);
        return;
      }
      try {
        const res = await fetch(`/api/qna?search=${encodeURIComponent(q)}&limit=4&sort=popular`, { signal: ctrl.signal });
        const data = await res.json();
        setSimilar(data.questions || []);
      } catch {
        // ไม่แสดง error — เป็นเพียงตัวช่วย
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [title]);

  const displayName = anonymous ? ANONYMOUS : authorName.trim() || ANONYMOUS;
  const nameReserved = !anonymous && isReservedName(authorName);
  const missing = [
    title.trim().length < 5 && "หัวข้อคำถาม",
    body.trim().length < 10 && "รายละเอียด",
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0 && !nameReserved;

  // ตรวจเบอร์โทร / เลขบัตร / เลขบัญชี ก่อนโพสต์
  const privacy = usePrivacyGate((types) => {
    setTitle((t) => removeSensitive(t, types));
    setBody((b) => removeSensitive(b, types));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    privacy.check(`${title}\n${body}`, post);
  };

  const post = async () => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: displayName,
          // ไม่ประสงค์ออกนาม = ไม่ส่งเลขสมาชิกเลย แม้เคยพิมพ์ไว้ก่อนเปิดสวิตช์
          memberCode: anonymous ? "000000" : memberCode.trim() || "000000",
          title: title.trim(),
          body: body.trim(),
          _hp: hp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "ตั้งคำถามไม่สำเร็จ กรุณาลองใหม่");
        setSubmitting(false);
        return;
      }
      // จำไว้ใน "คำถามของฉัน" → ได้ป้าย "มีคำตอบใหม่" ที่หน้ากระดาน
      addMyQuestion({ id: data.question.id, title: title.trim(), createdAt: new Date().toISOString() });
      router.push(`/qna/${data.question.id}`);
    } catch {
      setFormError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      setSubmitting(false);
    }
  };

  return (
    <>
      <QnaHero
        compact
        eyebrow={
          <Link href="/qna" className={css.crumb}>
            <ArrowLeft size={14} /> กระดานถาม-ตอบ
          </Link>
        }
        title="ตั้งคำถามใหม่"
        lead="ถามได้ทุกเรื่องเกี่ยวกับบริการสหกรณ์ เจ้าหน้าที่จะเข้ามาตอบโดยเร็ว"
      />

      <div className={css.main}>
        <div className={css.layout}>
          <form className={css.formCard} onSubmit={handleSubmit} noValidate>
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

            {/* ── 1. คำถาม ── */}
            <section className={css.formSection}>
              <h2 className={css.stepTitle}>
                <span className={css.stepNum}>1</span> คำถามของท่าน
              </h2>

              <div className={css.field}>
                <label htmlFor="q-title" className={css.label}>
                  หัวข้อคำถาม <span className={css.req}>*</span>
                </label>
                <div className={css.qInput}>
                  <span className={`${css.qaMark} ${css.qaMarkQ}`} aria-hidden="true">Q</span>
                  <input
                    id="q-title"
                    className={css.qInputField}
                    placeholder="เช่น กู้สามัญต้องใช้ผู้ค้ำประกันกี่คน"
                    value={title}
                    maxLength={TITLE_MAX}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className={css.fieldFoot}>
                  <span className={css.hint}>เขียนเป็นประโยคคำถามสั้น ๆ ให้เข้าใจได้ในบรรทัดเดียว</span>
                  <span className={css.counter}>{title.length}/{TITLE_MAX}</span>
                </div>
              </div>

              {similar.length > 0 && (
                <div className={css.similar}>
                  <p className={css.similarHead}>
                    <Sparkles size={15} /> มีคนเคยถามคล้ายกัน — ลองเปิดดูก่อน อาจมีคำตอบแล้ว
                  </p>
                  <ul>
                    {similar.map((s) => (
                      <li key={s.id}>
                        <Link href={`/qna/${s.id}`} target="_blank" className={css.similarLink}>
                          <span className={css.similarTitle}>{s.title}</span>
                          <span className={css.similarMeta}>
                            {s.hasStaffReply ? (
                              <><ShieldCheck size={13} /> เจ้าหน้าที่ตอบแล้ว</>
                            ) : (
                              <><MessageCircle size={13} /> {s.replyCount} คำตอบ</>
                            )}
                          </span>
                          <ChevronRight size={15} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={css.field}>
                <label htmlFor="q-body" className={css.label}>
                  รายละเอียด <span className={css.req}>*</span>
                </label>
                <textarea
                  id="q-body"
                  className={`${css.input} ${css.textarea} ${css.textareaLg}`}
                  placeholder="เล่าสถานการณ์ของท่านเพิ่มเติม เพื่อให้เจ้าหน้าที่ตอบได้ตรงคำถาม"
                  value={body}
                  maxLength={BODY_MAX}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className={css.fieldFoot}>
                  <span className={css.hintChips}>
                    ควรบอก: <span>ประเภทบริการ เช่น กู้สามัญ</span> <span>สถานะสมาชิก</span> <span>สิ่งที่อยากรู้</span>
                  </span>
                  <span className={css.counter}>{body.length}/{BODY_MAX}</span>
                </div>
              </div>
            </section>

            {/* ── 2. ผู้ถาม ── */}
            <section className={css.formSection}>
              <h2 className={css.stepTitle}>
                <span className={css.stepNum}>2</span> ผู้ถาม
                <span className={css.optional}>ไม่บังคับ</span>
              </h2>

              <label className={css.toggle}>
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                <span className={css.toggleTrack} aria-hidden="true"><span className={css.toggleThumb} /></span>
                <span className={css.toggleText}>
                  <strong><EyeOff size={14} /> ไม่ประสงค์ออกนาม</strong>
                  <span>ไม่ต้องกรอกชื่อหรือเลขสมาชิก — ไม่มีใครรู้ว่าใครถาม รวมถึงเจ้าหน้าที่</span>
                </span>
              </label>

              {anonymous ? (
                <p className={css.anonNote}>
                  <ShieldCheck size={16} /> ระบบจะไม่บันทึกชื่อและเลขสมาชิกไว้กับคำถามนี้
                  คำถามจะแสดงเป็น “{ANONYMOUS}”
                </p>
              ) : (
                <div className={css.composerRow}>
                  <div className={css.field}>
                    <label htmlFor="q-name" className={css.label}>
                      ชื่อที่แสดง <span className={css.optional}>ไม่บังคับ</span>
                    </label>
                    <input
                      id="q-name"
                      className={`${css.input} ${nameReserved ? css.invalid : ""}`}
                      placeholder="เช่น สมชาย หรือ ชื่อเล่น"
                      value={authorName}
                      maxLength={100}
                      autoComplete="name"
                      onChange={(e) => setAuthorName(e.target.value)}
                      aria-invalid={nameReserved}
                    />
                    {nameReserved && <span className={css.err}><CircleAlert size={13} /> {RESERVED_NAME_ERROR}</span>}
                  </div>
                  <div className={css.field}>
                    <label htmlFor="q-code" className={css.label}>
                      เลขทะเบียนสมาชิก <span className={css.optional}>ไม่บังคับ</span>
                    </label>
                    <input
                      id="q-code"
                      className={css.input}
                      placeholder="เช่น 012345"
                      inputMode="numeric"
                      value={memberCode}
                      maxLength={20}
                      onChange={(e) => setMemberCode(e.target.value)}
                    />
                    <span className={css.hint}>
                      ไม่แสดงบนกระดาน · ใส่เมื่ออยากให้เจ้าหน้าที่ตรวจสอบข้อมูลของท่านโดยเฉพาะ
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* ── ส่ง ── */}
            <div className={css.formFoot}>
              {formError && (
                <div className={css.alert} role="alert"><CircleAlert size={16} /> {formError}</div>
              )}
              <div className={css.submitRow}>
                <button className={css.submitBtn} type="submit" disabled={submitting || !canSubmit}>
                  {submitting ? <LoaderCircle size={16} className={css.spin} /> : <Send size={16} />}
                  {submitting ? "กำลังโพสต์..." : "โพสต์คำถาม"}
                </button>
                {!canSubmit && missing.length > 0 && (
                  <span className={css.missing}>
                    <CircleAlert size={14} /> ยังขาด: {missing.join(" · ")}
                  </span>
                )}
              </div>
            </div>
          </form>

          <aside className={css.aside}>
            {/* ตัวอย่างการ์ดจริงที่จะขึ้นบนกระดาน — อัปเดตขณะพิมพ์ */}
            <div className={css.previewBox}>
              <p className={css.previewLabel}><Eye size={14} /> ตัวอย่างบนกระดาน</p>
              <div className={`${css.qa} ${css.qaPreview}`} aria-hidden="true">
                <div className={css.qaAsker}>
                  <Avatar name={displayName} size={24} />
                  <span className={css.qaAskerName}>{displayName}</span>
                  <span className={css.qaDot}>·</span>
                  <span>เมื่อสักครู่</span>
                </div>
                <div className={css.qaLine}>
                  <span className={`${css.qaMark} ${css.qaMarkQ}`}>Q</span>
                  <h3 className={`${css.qaQuestion} ${title.trim() ? "" : css.previewEmpty}`}>
                    {title.trim() || "หัวข้อคำถามของท่าน"}
                  </h3>
                </div>
                <div className={css.qaLine}>
                  <span className={`${css.qaMark} ${css.qaMarkEmpty}`}>A</span>
                  <p className={css.qaWaiting}><Hourglass size={14} /> รอเจ้าหน้าที่ตอบ</p>
                </div>
              </div>
            </div>

            <div className={css.asideCard}>
              <h3 className={css.asideTitle}><ShieldCheck size={16} /> ก่อนโพสต์</h3>
              <ul className={css.ruleList}>
                <li>
                  <span className={`${css.ruleIcon} ${css.ruleNo}`}><Ban size={15} /></span>
                  <span><strong>ห้ามใส่เลขบัตรประชาชน หรือเลขบัญชี</strong> กระดานนี้ทุกคนอ่านได้</span>
                </li>
                <li>
                  <span className={css.ruleIcon}><Phone size={15} /></span>
                  <span>
                    <strong>ใส่เบอร์โทรได้</strong> เช่น หาผู้ค้ำประกัน — ระบบซ่อนเบอร์จนกว่ามีคนกดดู และซ่อนอัตโนมัติหลัง 30 วัน
                  </span>
                </li>
                <li>
                  <span className={css.ruleIcon}><MessageSquareWarning size={15} /></span>
                  <span>
                    <strong>เรื่องส่วนตัว / ร้องเรียน</strong> ใช้{" "}
                    <Link href="/complaints" className={css.inlineLink}>แจ้งร้องเรียน</Link> แทน
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      {privacy.dialog}
    </>
  );
}
