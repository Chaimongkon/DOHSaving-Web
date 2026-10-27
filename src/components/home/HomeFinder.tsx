"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2, MessageCircleQuestion, Newspaper, Search, X } from "lucide-react";
import { useSearchMiss } from "@/lib/trackEvent";
import { readSavedMember, type MemberKey } from "@/lib/memberType";
import type { FormGroup } from "@/lib/formGroups";
import FormDownloadButtons from "./FormDownloadButtons";
import css from "./HomeFinder.module.css";

/*
 * ส่วน "บริการของเรา" บนหน้าหลัก:
 *   HomeSearch    ช่องค้นหาเดียว (แบบฟอร์ม · ถาม-ตอบ · ข่าว) ใต้หัวข้อ ก่อนการ์ดบริการ
 *   PopularForms  แถบแบบฟอร์มยอดนิยม ดาวน์โหลดได้ทันที ใต้การ์ดบริการ
 * แบบฟอร์มคือเหตุผลอันดับ 1 ที่สมาชิกเข้าเว็บ — ไม่ต้องเข้าไปหาในหน้าแบบฟอร์มก่อน
 */

interface Results {
  forms: FormGroup[];
  formsTotal: number;
  qna: { id: number; title: string; answered: boolean }[];
  qnaTotal: number;
  news: { id: number; title: string; createdAt: string }[];
  newsTotal: number;
  total: number;
}

/** คำที่สมาชิกค้นบ่อย — กดแล้วค้นทันที */
const SUGGESTIONS = ["กู้สามัญ", "กู้ฉุกเฉิน", "สวัสดิการ", "เปิดบัญชีเงินฝาก", "ทุนการศึกษาบุตร", "ลาออก"];

const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });

/** ประเภทสมาชิกที่จำไว้ในเครื่อง — อ่านหลังโหลดหน้า (กันหน้าเว็บที่สร้างจากเซิร์ฟเวอร์ไม่ตรงกัน) */
function useSavedMember() {
  const [member, setMember] = useState<MemberKey | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- อ่านค่าจาก localStorage ได้เฉพาะฝั่งเบราว์เซอร์
    setMember(readSavedMember());
  }, []);
  return member;
}

/* ═════════ ช่องค้นหา ═════════ */
export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const member = useSavedMember();
  const boxRef = useRef<HTMLDivElement>(null);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setResults(await res.json());
      } catch { /* พิมพ์ต่อ/ยกเลิก */ } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // ปิดผลค้นหาเมื่อคลิกนอกกล่อง
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const shown = q.length >= 2 ? results : null;
  useSearchMiss("home", q, loading || !shown ? null : shown.total);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.length < 2) return;
    window.location.href = shown?.formsTotal ? `/forms?q=${encodeURIComponent(q)}` : `/qna?q=${encodeURIComponent(q)}`;
  };

  return (
    <div className={css.search} ref={boxRef}>
      <form className={css.searchBox} onSubmit={submit} role="search">
        <Search size={20} className={css.searchIcon} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="ค้นหาแบบฟอร์ม คำถาม หรือข่าว เช่น กู้สามัญ ผู้ค้ำ ทุนการศึกษา"
          aria-label="ค้นหาแบบฟอร์ม คำถาม และข่าว"
          autoComplete="off"
          enterKeyHint="search"
        />
        {loading && <Loader2 size={18} className={css.spin} />}
        {query && !loading && (
          <button type="button" className={css.clear} onClick={() => setQuery("")} aria-label="ล้างคำค้น">
            <X size={16} />
          </button>
        )}
      </form>

      <div className={css.chips}>
        <span>ค้นบ่อย</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={css.chip}
            onClick={() => {
              setQuery(s);
              setOpen(true);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {open && shown && (
        <div className={css.results} role="region" aria-live="polite" aria-label="ผลการค้นหา">
          {shown.total === 0 ? (
            <div className={css.empty}>
              <p>ไม่พบผลสำหรับ “{q}”</p>
              <Link href={`/qna/new?title=${encodeURIComponent(q)}`} className={css.askLink}>
                <MessageCircleQuestion size={16} /> ถามเจ้าหน้าที่ในกระดานถาม-ตอบ
              </Link>
            </div>
          ) : (
            <>
              {shown.forms.length > 0 && (
                <div className={css.group}>
                  <div className={css.groupHead}>
                    <span><FileText size={15} /> แบบฟอร์ม</span>
                    <Link href={`/forms?q=${encodeURIComponent(q)}`}>ดูทั้งหมด {shown.formsTotal} <ArrowRight size={13} /></Link>
                  </div>
                  <ul className={css.formList}>
                    {shown.forms.map((f) => (
                      <li key={f.title}>
                        <span className={css.formTitle}>{f.title}</span>
                        <FormDownloadButtons title={f.title} variants={f.variants} member={member} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {shown.qna.length > 0 && (
                <div className={css.group}>
                  <div className={css.groupHead}>
                    <span><MessageCircleQuestion size={15} /> ถาม-ตอบ</span>
                    <Link href={`/qna?q=${encodeURIComponent(q)}`}>ดูทั้งหมด {shown.qnaTotal} <ArrowRight size={13} /></Link>
                  </div>
                  <ul className={css.linkList}>
                    {shown.qna.map((x) => (
                      <li key={x.id}>
                        <Link href={`/qna/${x.id}`}>
                          <span>{x.title}</span>
                          <small className={x.answered ? css.answered : css.waiting}>{x.answered ? "ตอบแล้ว" : "รอคำตอบ"}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {shown.news.length > 0 && (
                <div className={css.group}>
                  <div className={css.groupHead}>
                    <span><Newspaper size={15} /> ข่าวและประกาศ</span>
                    <Link href="/news">ข่าวทั้งหมด <ArrowRight size={13} /></Link>
                  </div>
                  <ul className={css.linkList}>
                    {shown.news.map((n) => (
                      <li key={n.id}>
                        <Link href={`/news/${n.id}`}>
                          <span>{n.title}</span>
                          <small>{thaiDate(n.createdAt)}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═════════ แถบแบบฟอร์มยอดนิยม ═════════ */
const STRIP_SIZE = 4;

export function PopularForms() {
  const [popular, setPopular] = useState<(FormGroup & { count: number })[] | null>(null);
  const member = useSavedMember();

  useEffect(() => {
    fetch("/api/forms/popular")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setPopular(d.items ?? []))
      .catch(() => setPopular([]));
  }, []);

  if (!popular || popular.length === 0) return null;

  return (
    <div className={css.strip}>
      <div className={css.stripLabel}>
        <span className={css.stripIcon}><FileText size={18} /></span>
        <div>
          <strong>แบบฟอร์มยอดนิยม</strong>
          <Link href="/forms">ดูทั้งหมด <ArrowRight size={12} /></Link>
        </div>
      </div>
      <ul className={css.stripList}>
        {popular.slice(0, STRIP_SIZE).map((f) => (
          <li key={f.title} className={css.stripItem}>
            {/* หัวแถบบอกแล้วว่าเป็นแบบฟอร์ม — ตัดคำนำหน้า "แบบฟอร์ม" ให้ชื่อสั้นลง */}
            <span className={css.stripTitle} title={f.title}>{f.title.replace(/^แบบฟอร์ม(?=\S)/, "")}</span>
            <FormDownloadButtons title={f.title} variants={f.variants} member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}
