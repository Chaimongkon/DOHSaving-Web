"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Handshake,
  Inbox,
  Loader2,
  Lock,
  LockOpen,
  MessageCircle,
  MessagesSquare,
  Pin,
  PinOff,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { excerptOf, makeQuote, quoteMatches, splitQuote } from "@/lib/qnaQuote";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
type Filter = "pending" | "all" | "answered" | "pinned" | "hidden";

interface Summary {
  id: number;
  authorName: string;
  memberCode: string | null;
  title: string;
  excerpt: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  replyCount: number;
  needsReply: boolean;
}

interface AdminReply {
  id: number;
  authorName: string;
  memberCode: string | null;
  body: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Detail extends Omit<Summary, "excerpt" | "lastActivity" | "needsReply"> {
  body: string;
  replies: AdminReply[];
}

type Counts = Record<Filter, number>;

interface ListState {
  key: string;
  items: Summary[];
  page: number;
  totalPages: number;
  total: number;
}

/** ข้อความที่เลือก "ตอบข้อความนี้" — key 0 = ตัวคำถาม */
type ReplyTarget = { questionId: number; key: number; author: string; text: string };

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "รอตอบ" },
  { key: "all", label: "ทั้งหมด" },
  { key: "answered", label: "ตอบแล้ว" },
  { key: "pinned", label: "ปักหมุด" },
  { key: "hidden", label: "ซ่อนอยู่" },
];

const PAGE_SIZE = 30;

/** กระทู้หาผู้ค้ำประกัน — สหกรณ์จัดหาผู้ค้ำให้ไม่ได้ แต่ควรตอบให้ผู้ถามรู้ และเตือนเรื่องมิจฉาชีพ */
const isGuarantorPost = (text: string) => /ค้ำ/.test(text);

// ข้อความมาตรฐานสำหรับกระทู้หาผู้ค้ำประกัน — ผู้มาหาส่วนใหญ่ไม่มีสิทธิ์กู้แบบอื่นแล้ว จึงไม่แนะนำวงเงินกู้
// ⚠ ประโยค "ไม่มีตัวแทนรับค้ำ / ไม่เรียกเก็บเงินลักษณะนี้" ควรให้ผู้บริหารยืนยันก่อนใช้งานจริง
const GUARANTOR_REPLY = [
  "ขอบคุณที่ไว้วางใจสอบถามค่ะ เจ้าหน้าที่เข้าใจดีว่าการหาผู้ค้ำประกันไม่ใช่เรื่องง่าย",
  "",
  "ขออนุญาตแจ้งว่า สหกรณ์ไม่สามารถจัดหา แนะนำ หรือเป็นตัวกลางหาผู้ค้ำประกันให้สมาชิกได้ เนื่องจากการค้ำประกันเป็นภาระผูกพันส่วนตัวของผู้ค้ำ ซึ่งต้องเกิดจากความยินยอมและความไว้วางใจระหว่างกันเองค่ะ",
  "",
  "⚠ โปรดระวังมิจฉาชีพ",
  "หากมีผู้ติดต่อมาอ้างว่า “รับค้ำประกัน” หรือ “ช่วยให้กู้ผ่าน” แล้วขอให้โอนค่าค้ำ ค่าดำเนินการ หรือเงินมัดจำก่อน ขอให้ปฏิเสธและอย่าโอนเงินในทุกกรณี สหกรณ์ไม่มีตัวแทนรับค้ำประกัน และไม่เรียกเก็บเงินในลักษณะนี้",
  "",
  "เพื่อความปลอดภัยของท่าน ไม่ควรลงเบอร์โทรหรือข้อมูลส่วนตัวไว้ในกระดานสาธารณะ หากสงสัยว่ากำลังถูกหลอก สามารถโทรสอบถามสหกรณ์ได้โดยตรงในเวลาทำการค่ะ",
].join("\n");

const QUICK_REPLIES = [
  "ได้รับเรื่องแล้ว เจ้าหน้าที่กำลังตรวจสอบและจะแจ้งให้ทราบโดยเร็วค่ะ",
  "รบกวนแจ้งเลขสมาชิกและรายละเอียดเพิ่มเติม เพื่อให้ตรวจสอบได้ถูกต้องค่ะ",
  "หากต้องการความช่วยเหลือเร่งด่วน ติดต่อสหกรณ์ได้ในเวลาทำการค่ะ",
];

/* ═════════ ตัวช่วย ═════════ */
function decodeHTMLEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x[2]F;/gi, "/");
}

function Linkify({ text }: { text: string }) {
  if (!text) return null;
  const parts = decodeHTMLEntities(text).split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={css.inlineLink}>
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาที`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วัน`;
  return new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });
}

const initial = (name: string) => name.replace(/^(นาย|นางสาว|นาง|ฝ่าย)/, "").trim().charAt(0) || "?";

/* ═════════ หน้า ═════════ */
export default function AdminQnaPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [list, setList] = useState<ListState | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailTick, setDetailTick] = useState(0);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const replyBoxRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const listKey = `${filter}|${search}|${reloadTick}`;
  const listLoading = !list || list.key.split("|").slice(0, 2).join("|") !== `${filter}|${search}`;
  const detailLoading = selectedId !== null && detail?.id !== selectedId;
  const activeTarget = replyTarget && replyTarget.questionId === selectedId ? replyTarget : null;

  /* ── ค้นหาแบบหน่วงเวลา ── */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── โหลดรายการ (หน้าแรกของตัวกรอง/คำค้นปัจจุบัน) ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ filter, page: "1", limit: String(PAGE_SIZE) });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/qna?${params}`);
        const data = await res.json();
        if (cancelled) return;
        setList({ key: listKey, items: data.questions ?? [], page: 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
        if (data.counts) setCounts(data.counts);
      } catch {
        if (!cancelled) setList({ key: listKey, items: [], page: 1, totalPages: 1, total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, search, listKey]);

  const loadMore = async () => {
    if (!list || list.page >= list.totalPages) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ filter, page: String(list.page + 1), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      const data = await (await fetch(`/api/admin/qna?${params}`)).json();
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: [...prev.items, ...(data.questions ?? []).filter((q: Summary) => !prev.items.some((p) => p.id === q.id))],
              page: prev.page + 1,
            }
          : prev
      );
    } finally {
      setLoadingMore(false);
    }
  };

  /* ── โหลดรายละเอียดกระทู้ที่เลือก ── */
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/qna/${selectedId}`);
        const data = await res.json();
        if (!cancelled && data.question) setDetail(data.question);
      } catch { /* คงหน้าจอเดิมไว้ */ }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailTick]);

  // เปิดกระทู้ใหม่ → เลื่อนบทสนทนาลงล่างสุด (ข้อความล่าสุด) และล้างข้อความที่ร่างไว้
  useEffect(() => {
    if (detail && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [detail?.id, detail?.replies.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshAll = useCallback(() => {
    setReloadTick((n) => n + 1);
    setDetailTick((n) => n + 1);
  }, []);

  const selectQuestion = (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setReplyBody("");
    setReplyTarget(null);
  };

  /* ── ข้อความที่ยังรอเจ้าหน้าที่ตอบ ──
     ข้อความสมาชิกถือว่าตอบแล้วเมื่อมีคำตอบเจ้าหน้าที่ที่มาทีหลัง และอ้างถึงข้อความนั้น
     หรือไม่ได้อ้างถึงใครเลย (คำตอบแบบเดิม = ตอบทุกข้อความก่อนหน้า) */
  const pendingKeys = useMemo(() => {
    const pending = new Set<number>();
    if (!detail) return pending;
    const staff = detail.replies
      .filter((r) => r.isAdmin && r.isActive)
      .map((r) => ({ at: r.createdAt, quote: splitQuote(r.body).quote }));
    const messages = [
      { key: 0, author: detail.authorName, text: detail.body, at: detail.createdAt },
      ...detail.replies
        .filter((r) => !r.isAdmin && r.isActive)
        .map((r) => ({ key: r.id, author: r.authorName, text: r.body, at: r.createdAt })),
    ];
    for (const m of messages) {
      if (!staff.some((s) => s.at > m.at && (!s.quote || quoteMatches(s.quote, m.author, m.text)))) pending.add(m.key);
    }
    return pending;
  }, [detail]);

  const findQuotedKey = (quote: { author: string; excerpt: string }) => {
    if (!detail) return null;
    if (quoteMatches(quote, detail.authorName, detail.body)) return 0;
    const hit = detail.replies.find((r) => !r.isAdmin && quoteMatches(quote, r.authorName, r.body));
    return hit ? hit.id : null;
  };

  const jumpTo = (key: number) => {
    document.getElementById(`msg-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashKey(key);
    window.setTimeout(() => setFlashKey((k) => (k === key ? null : k)), 1600);
  };

  const chooseTarget = (key: number, author: string, text: string) => {
    if (!selectedId) return;
    setReplyTarget({ questionId: selectedId, key, author, text });
    replyBoxRef.current?.focus();
  };

  /* ── การกระทำ ── */
  const updateQuestion = async (patch: Partial<Pick<Summary, "isPinned" | "isClosed" | "isActive">>, done: string) => {
    if (!detail) return;
    try {
      const res = await fetch("/api/admin/qna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detail.id, ...patch }),
      });
      if (!res.ok) throw new Error();
      setToast({ ok: true, text: done });
      refreshAll();
    } catch {
      setToast({ ok: false, text: "อัปเดตไม่สำเร็จ" });
    }
  };

  const deleteQuestion = async () => {
    if (!detail || !window.confirm(`ลบกระทู้ “${detail.title}” ถาวรใช่หรือไม่?\nคำตอบทั้งหมดในกระทู้จะถูกลบด้วย`)) return;
    try {
      const res = await fetch(`/api/admin/qna?id=${detail.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ ok: true, text: "ลบกระทู้แล้ว" });
      setSelectedId(null);
      setDetail(null);
      setReloadTick((n) => n + 1);
    } catch {
      setToast({ ok: false, text: "ลบกระทู้ไม่สำเร็จ" });
    }
  };

  const deleteReply = async (replyId: number) => {
    if (!selectedId || !window.confirm("ลบคำตอบนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/qna/${selectedId}?replyId=${replyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ ok: true, text: "ลบคำตอบแล้ว" });
      refreshAll();
    } catch {
      setToast({ ok: false, text: "ลบคำตอบไม่สำเร็จ" });
    }
  };

  const submitReply = async () => {
    if (!selectedId || !replyBody.trim() || replying) return;
    setReplying(true);
    try {
      const body = (activeTarget ? makeQuote(activeTarget.author, activeTarget.text) : "") + replyBody.trim();
      const res = await fetch(`/api/admin/qna/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      setToast({ ok: true, text: "ส่งคำตอบแล้ว" });
      setReplyBody("");
      setReplyTarget(null);
      refreshAll();
    } catch {
      setToast({ ok: false, text: "ส่งคำตอบไม่สำเร็จ" });
    } finally {
      setReplying(false);
    }
  };

  /* ── ส่วนแสดงผล ── */
  const items = list?.items ?? [];
  const emptyText =
    search
      ? `ไม่พบกระทู้ที่ตรงกับ “${search}”`
      : filter === "pending"
        ? "ตอบครบทุกคำถามแล้ว"
        : "ไม่มีกระทู้ในหมวดนี้";

  const memberBubble = (id: number, author: string, code: string | null, at: string, text: string) => {
    const pending = pendingKeys.has(id);
    return (
      <div
        key={id}
        id={`msg-${id}`}
        className={`${css.msg} ${css.msgMember} ${pending ? css.msgPending : ""} ${flashKey === id ? css.flash : ""} ${activeTarget?.key === id ? css.msgTarget : ""}`}
      >
        <span className={css.avatar}>{initial(author)}</span>
        <div className={css.bubbleWrap}>
          <div className={css.msgHead}>
            <strong>{author}</strong>
            {code && <span className={css.code}>รหัส {code}</span>}
            <span className={css.msgTime} title={fullDate(at)}>{fullDate(at)}</span>
          </div>
          <div className={css.bubble}>
            <Linkify text={text} />
          </div>
          <div className={css.msgFoot}>
            {pending && <span className={css.pendingTag}>รอตอบ</span>}
            {detail && !detail.isClosed && (
              <button type="button" className={css.replyTo} onClick={() => chooseTarget(id, author, text)}>
                <Reply size={14} /> ตอบข้อความนี้
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}>
            <MessagesSquare size={22} />
          </span>
          <div>
            <h1 className={css.title}>กระดานถาม-ตอบ</h1>
            <p className={css.subtitle}>เลือกคำถามทางซ้ายเพื่ออ่านและตอบ คำถามที่รอนานที่สุดอยู่บนสุดของแท็บ “รอตอบ”</p>
          </div>
        </div>
        <div className={css.headStats}>
          <button
            type="button"
            className={`${css.stat} ${css.statPending} ${counts && counts.pending > 0 ? css.statAlert : ""}`}
            onClick={() => setFilter("pending")}
          >
            <span className={css.statValue}>{counts?.pending ?? "–"}</span>
            <span className={css.statLabel}>รอตอบ</span>
          </button>
          <div className={css.stat}>
            <span className={css.statValue}>{counts?.all ?? "–"}</span>
            <span className={css.statLabel}>กระทู้ทั้งหมด</span>
          </div>
          <a href="/qna" target="_blank" rel="noopener noreferrer" className={css.headLink}>
            <ExternalLink size={15} /> ดูกระดานบนเว็บ
          </a>
        </div>
      </header>

      <div className={`${css.workspace} ${selectedId !== null ? css.workspaceOpen : ""}`}>
        {/* ═════════ รายการกระทู้ ═════════ */}
        <aside className={css.inbox}>
          <div className={css.inboxTop}>
            <label className={css.search}>
              <Search size={17} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ค้นหาหัวข้อ เนื้อหา ชื่อ หรือรหัสสมาชิก"
                aria-label="ค้นหากระทู้"
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput("")} aria-label="ล้างคำค้นหา">
                  <X size={15} />
                </button>
              )}
            </label>
            <div className={css.tabs} role="tablist" aria-label="กรองกระทู้">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`${css.tab} ${filter === f.key ? css.tabActive : ""} ${f.key === "pending" ? css.tabPending : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  {counts && <span className={css.tabCount}>{counts[f.key]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className={css.inboxList}>
            {listLoading ? (
              <div className={css.listState}>
                <Loader2 size={20} className={css.spin} /> กำลังโหลด…
              </div>
            ) : items.length === 0 ? (
              <div className={css.listState}>
                {filter === "pending" && !search ? <CheckCheck size={30} /> : <Inbox size={30} />}
                <p>{emptyText}</p>
                {filter !== "all" && (
                  <button type="button" className={css.linkBtn} onClick={() => setFilter("all")}>
                    ดูกระทู้ทั้งหมด
                  </button>
                )}
              </div>
            ) : (
              <>
                <ul className={css.items}>
                  {items.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        className={`${css.item} ${q.id === selectedId ? css.itemActive : ""} ${!q.isActive ? css.itemHidden : ""}`}
                        onClick={() => selectQuestion(q.id)}
                      >
                        <span className={`${css.dot} ${q.needsReply ? css.dotPending : css.dotDone}`} aria-hidden="true" />
                        <span className={css.itemMain}>
                          <span className={css.itemTop}>
                            <span className={css.itemTitle}>{q.title}</span>
                            <span className={css.itemTime} title={fullDate(q.lastActivity)}>{timeAgo(q.lastActivity)}</span>
                          </span>
                          <span className={css.itemExcerpt}>{q.excerpt}</span>
                          <span className={css.itemMeta}>
                            <span>{q.authorName}</span>
                            <span className={css.itemCount}>
                              <MessageCircle size={12} /> {q.replyCount}
                            </span>
                            {q.needsReply && <span className={css.badgePending}>รอตอบ</span>}
                            {isGuarantorPost(`${q.title} ${q.excerpt}`) && (
                              <span className={`${css.badge} ${css.badgeGuarantor}`}>
                                <Handshake size={11} /> หาผู้ค้ำ
                              </span>
                            )}
                            {q.isPinned && <span className={css.badge}><Pin size={11} /> ปักหมุด</span>}
                            {q.isClosed && <span className={css.badge}><Lock size={11} /> ปิดตอบ</span>}
                            {!q.isActive && <span className={css.badge}><EyeOff size={11} /> ซ่อน</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {list && list.page < list.totalPages && (
                  <button type="button" className={css.moreBtn} onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? <Loader2 size={16} className={css.spin} /> : null}
                    แสดงเพิ่ม ({list.total - items.length} กระทู้)
                  </button>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ═════════ บทสนทนา ═════════ */}
        <section className={css.thread}>
          {selectedId === null ? (
            <div className={css.threadEmpty}>
              <MessagesSquare size={44} />
              <h2>เลือกคำถามจากรายการด้านซ้าย</h2>
              <p>คำถามที่มีจุดสีส้มคือคำถามที่ยังรอเจ้าหน้าที่ตอบ</p>
            </div>
          ) : detailLoading || !detail ? (
            <div className={css.threadEmpty}>
              <Loader2 size={28} className={css.spin} />
            </div>
          ) : (
            <>
              <div className={css.threadHead}>
                <button type="button" className={css.backBtn} onClick={() => setSelectedId(null)} aria-label="กลับไปรายการ">
                  <ArrowLeft size={18} />
                </button>
                <div className={css.threadTitleWrap}>
                  <span className={css.threadId}>
                    #{detail.id}
                    {detail.isPinned && <span className={css.badge}><Pin size={11} /> ปักหมุด</span>}
                    {detail.isClosed && <span className={css.badge}><Lock size={11} /> ปิดตอบ</span>}
                    {!detail.isActive && <span className={`${css.badge} ${css.badgeWarn}`}><EyeOff size={11} /> ซ่อนจากเว็บ</span>}
                  </span>
                  <h2 className={css.threadTitle}>{detail.title}</h2>
                  <span className={css.threadMeta}>
                    <Eye size={13} /> {detail.views} ครั้ง · {detail.replyCount} คำตอบ
                  </span>
                </div>
                <div className={css.tools}>
                  <a href={`/qna/${detail.id}`} target="_blank" rel="noopener noreferrer" className={css.tool} title="เปิดหน้าจริง">
                    <ExternalLink size={16} /> <span>หน้าจริง</span>
                  </a>
                  <button
                    type="button"
                    className={`${css.tool} ${detail.isPinned ? css.toolOn : ""}`}
                    onClick={() => updateQuestion({ isPinned: !detail.isPinned }, detail.isPinned ? "เลิกปักหมุดแล้ว" : "ปักหมุดแล้ว")}
                  >
                    {detail.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    <span>{detail.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}</span>
                  </button>
                  <button
                    type="button"
                    className={`${css.tool} ${detail.isClosed ? css.toolOn : ""}`}
                    onClick={() => updateQuestion({ isClosed: !detail.isClosed }, detail.isClosed ? "เปิดให้ตอบแล้ว" : "ปิดการตอบแล้ว")}
                  >
                    {detail.isClosed ? <LockOpen size={16} /> : <Lock size={16} />}
                    <span>{detail.isClosed ? "เปิดให้ตอบ" : "ปิดตอบ"}</span>
                  </button>
                  <button
                    type="button"
                    className={`${css.tool} ${!detail.isActive ? css.toolOn : ""}`}
                    onClick={() => updateQuestion({ isActive: !detail.isActive }, detail.isActive ? "ซ่อนจากเว็บแล้ว" : "แสดงบนเว็บแล้ว")}
                  >
                    {detail.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{detail.isActive ? "ซ่อน" : "แสดงบนเว็บ"}</span>
                  </button>
                  <button type="button" className={`${css.tool} ${css.toolDanger}`} onClick={deleteQuestion} title="ลบกระทู้">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={css.conversation} ref={threadRef}>
                {memberBubble(0, detail.authorName, detail.memberCode, detail.createdAt, detail.body)}

                {detail.replies.map((r) => {
                  if (!r.isAdmin) {
                    return (
                      memberBubble(r.id, r.authorName, r.memberCode, r.createdAt, r.body)
                    );
                  }
                  const { quote, rest } = splitQuote(r.body);
                  const quotedKey = quote ? findQuotedKey(quote) : null;
                  return (
                    <div key={r.id} className={`${css.msg} ${css.msgStaff}`}>
                      <div className={css.bubbleWrap}>
                        <div className={css.msgHead}>
                          <span className={css.msgTime}>{fullDate(r.createdAt)}</span>
                          <strong>{r.authorName}</strong>
                          <span className={css.staffTag}><ShieldCheck size={12} /> เจ้าหน้าที่</span>
                        </div>
                        <div className={css.bubble}>
                          {quote && (
                            <button
                              type="button"
                              className={css.quote}
                              onClick={() => quotedKey !== null && jumpTo(quotedKey)}
                              disabled={quotedKey === null}
                            >
                              <span className={css.quoteHead}>
                                <Reply size={12} /> ตอบ {quote.author}
                              </span>
                              <span className={css.quoteText}>“{quote.excerpt}”</span>
                            </button>
                          )}
                          <Linkify text={rest} />
                        </div>
                        <div className={css.msgFoot}>
                          <button type="button" className={css.deleteReply} onClick={() => deleteReply(r.id)}>
                            <Trash2 size={13} /> ลบ
                          </button>
                        </div>
                      </div>
                      <span className={`${css.avatar} ${css.avatarStaff}`}>
                        <ShieldCheck size={16} />
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ── กล่องตอบ ── */}
              {detail.isClosed ? (
                <div className={css.closedNote}>
                  <Lock size={16} /> กระทู้นี้ปิดการตอบอยู่ — กด “เปิดให้ตอบ” ด้านบนเพื่อตอบเพิ่ม
                </div>
              ) : (
                <div className={css.composer}>
                  {activeTarget ? (
                    <div className={css.target}>
                      <Reply size={15} />
                      <span className={css.targetText}>
                        <strong>กำลังตอบ {activeTarget.author}</strong>
                        <span>“{excerptOf(activeTarget.text)}”</span>
                      </span>
                      <button type="button" onClick={() => setReplyTarget(null)} aria-label="ยกเลิก ตอบทั้งกระทู้แทน">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    pendingKeys.size > 1 && (
                      <p className={css.targetHint}>
                        มี {pendingKeys.size} ข้อความรอตอบ — กด “ตอบข้อความนี้” ใต้ข้อความ เพื่อให้สมาชิกรู้ว่าตอบใคร
                      </p>
                    )
                  )}
                  {isGuarantorPost(`${detail.title} ${detail.body}`) && replyBody !== GUARANTOR_REPLY && (
                    <div className={css.suggest}>
                      <Handshake size={18} />
                      <span className={css.suggestText}>
                        <strong>กระทู้หาผู้ค้ำประกัน</strong>
                        <span>ตอบให้ผู้ถามทราบว่าสหกรณ์จัดหาผู้ค้ำให้ไม่ได้ และเตือนเรื่องมิจฉาชีพที่อ้างรับค้ำ</span>
                      </span>
                      <button type="button" className={css.suggestBtn} onClick={() => setReplyBody(GUARANTOR_REPLY)}>
                        ใช้ข้อความแนะนำ
                      </button>
                    </div>
                  )}
                  <div className={css.quick}>
                    {QUICK_REPLIES.map((t) => (
                      <button key={t} type="button" className={css.quickBtn} onClick={() => setReplyBody(t)} title={t}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className={css.composeRow}>
                    <textarea
                      ref={replyBoxRef}
                      className={css.textarea}
                      rows={3}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          submitReply();
                        }
                      }}
                      placeholder={activeTarget ? `พิมพ์คำตอบถึง ${activeTarget.author}…` : "พิมพ์คำตอบในนามเจ้าหน้าที่…"}
                    />
                    <button type="button" className={css.send} onClick={submitReply} disabled={replying || !replyBody.trim()}>
                      {replying ? <Loader2 size={18} className={css.spin} /> : <Send size={18} />}
                      ส่งคำตอบ
                    </button>
                  </div>
                  <span className={css.composeHint}>กด Ctrl + Enter เพื่อส่ง</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {toast && (
        <div className={`${css.toast} ${toast.ok ? css.toastOk : css.toastErr}`} role="status">
          {toast.text}
        </div>
      )}

    </div>
  );
}
