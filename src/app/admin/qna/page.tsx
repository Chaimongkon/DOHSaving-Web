"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Pin,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import css from "./page.module.css";

type AdminQuestionSummary = {
  id: number;
  authorName: string;
  memberCode: string | null;
  title: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  isActive: boolean;
  createdAt: string;
  replyCount: number;
};

type AdminReply = {
  id: number;
  authorName: string;
  memberCode: string | null;
  body: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
};

type AdminQuestionDetail = AdminQuestionSummary & {
  body: string;
  updatedAt: string;
  replies: AdminReply[];
};

const QUICK_REPLIES = [
  "ได้รับเรื่องแล้ว เจ้าหน้าที่กำลังตรวจสอบและจะอัปเดตให้ทราบโดยเร็ว",
  "รบกวนแจ้งเลขสมาชิกและรายละเอียดเพิ่มเติม เพื่อให้ตรวจสอบได้ถูกต้อง",
  "ขอบคุณสำหรับคำถาม หากต้องการความช่วยเหลือเร่งด่วนสามารถติดต่อสหกรณ์ในเวลาทำการได้",
];

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
  const decoded = decodeHTMLEntities(text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = decoded.split(urlRegex);
  return (
    <React.Fragment>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </React.Fragment>
  );
}

export default function AdminQnaPage() {
  const [questions, setQuestions] = useState<AdminQuestionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQuestionDetail | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout((window as Window & { __qnaToast?: number }).__qnaToast);
    (window as Window & { __qnaToast?: number }).__qnaToast = window.setTimeout(() => {
      setToast("");
    }, 3000);
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/qna?${params}`);
      const data = await res.json();
      const nextQuestions = data.questions || [];
      setQuestions(nextQuestions);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      if (nextQuestions.length === 0) {
        setSelectedId(null);
        setSelectedQuestion(null);
        return;
      }

      setSelectedId((current) => {
        if (current && nextQuestions.some((question: AdminQuestionSummary) => question.id === current)) {
          return current;
        }
        return nextQuestions[0].id;
      });
    } catch {
      setQuestions([]);
      setSelectedId(null);
      setSelectedQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchQuestionDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/qna/${id}`);
      if (!res.ok) {
        setSelectedQuestion(null);
        return;
      }
      const data = await res.json();
      setSelectedQuestion(data.question ?? null);
    } catch {
      setSelectedQuestion(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (!selectedId) return;
    fetchQuestionDetail(selectedId);
  }, [fetchQuestionDetail, selectedId]);

  const selectedSummary = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? null,
    [questions, selectedId]
  );

  const updateQuestion = async (id: number, data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/qna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error("update failed");
      showToast("อัปเดตสถานะเรียบร้อย");
      await fetchQuestions();
      await fetchQuestionDetail(id);
    } catch {
      showToast("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!window.confirm("ต้องการลบกระทู้นี้ถาวรใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/qna?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      showToast("ลบกระทู้เรียบร้อย");
      await fetchQuestions();
    } catch {
      showToast("ลบกระทู้ไม่สำเร็จ");
    }
  };

  const deleteReply = async (replyId: number) => {
    if (!selectedId) return;
    if (!window.confirm("ต้องการลบข้อความตอบนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/qna/${selectedId}?replyId=${replyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      showToast("ลบคำตอบเรียบร้อย");
      await fetchQuestions();
      await fetchQuestionDetail(selectedId);
    } catch {
      showToast("ลบคำตอบไม่สำเร็จ");
    }
  };

  const submitReply = async () => {
    if (!selectedId || !replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/qna/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (!res.ok) throw new Error("reply failed");
      showToast("ส่งคำตอบเรียบร้อย");
      setReplyBody("");
      await fetchQuestions();
      await fetchQuestionDetail(selectedId);
    } catch {
      showToast("ส่งคำตอบไม่สำเร็จ");
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const pinnedCount = questions.filter((question) => question.isPinned).length;
  const openCount = questions.filter((question) => !question.isClosed && question.isActive).length;

  return (
    <div className={css.page}>
      <section className={css.hero}>
        <div className={css.heroCopy}>
          <div className={css.eyebrow}>Admin Q&amp;A Workspace</div>
          <h1 className={css.title}>ตอบคำถามได้จากหน้าเดียว ไม่ต้องสลับมองหลายจุด</h1>
          <p className={css.subtitle}>
            คัดกรองคำถาม อ่านรายละเอียด และตอบกลับในพาเนลเดียว เพื่อให้เจ้าหน้าที่ทำงานได้เร็วและไม่หลุดบริบท
          </p>
        </div>
        <div className={css.heroMetrics}>
          <div className={css.metric}>
            <span className={css.metricLabel}>คำถามทั้งหมด</span>
            <strong className={css.metricValue}>{total}</strong>
          </div>
          <div className={css.metric}>
            <span className={css.metricLabel}>เปิดอยู่</span>
            <strong className={css.metricValue}>{openCount}</strong>
          </div>
          <div className={css.metric}>
            <span className={css.metricLabel}>ปักหมุด</span>
            <strong className={css.metricValue}>{pinnedCount}</strong>
          </div>
        </div>
      </section>

      <section className={css.toolbar}>
        <label className={css.searchBox}>
          <Search size={18} />
          <input
            className={css.searchInput}
            placeholder="ค้นหาจากหัวข้อคำถาม"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className={css.toolbarMeta}>
          <span className={css.toolbarChip}>{questions.length} รายการในหน้านี้</span>
          {selectedSummary && <span className={css.toolbarChip}>กำลังเลือก #{selectedSummary.id}</span>}
        </div>
      </section>

      <section className={css.workspace}>
        <aside className={css.inboxPane}>
          <div className={css.paneHeader}>
            <div>
              <h2 className={css.paneTitle}>รายการคำถาม</h2>
              <p className={css.paneText}>เลือกคำถามเพื่ออ่านและตอบได้ทันที</p>
            </div>
          </div>

          {loading ? (
            <div className={css.stateBox}>
              <Loader2 className={css.spin} size={22} />
              <span>กำลังโหลดรายการคำถาม...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className={css.stateBox}>
              <MessageSquare size={28} />
              <span>ไม่พบคำถามที่ตรงกับเงื่อนไข</span>
            </div>
          ) : (
            <div className={css.inboxList}>
              {questions.map((question) => {
                const isSelected = question.id === selectedId;
                const isAnswered = question.replyCount > 0;
                const statusClass = isAnswered ? css.cardAnswered : css.cardUnanswered;
                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`${css.questionCard} ${statusClass} ${isSelected ? css.questionCardActive : ""}`}
                    onClick={() => setSelectedId(question.id)}
                  >
                    <div className={css.questionCardTop}>
                      <span className={css.questionId}>#{question.id}</span>
                      <span className={css.questionDate}>{formatDate(question.createdAt)}</span>
                    </div>
                    <h3 className={css.questionTitle}>{question.title}</h3>
                    <div className={css.questionMeta}>
                      <span>{question.authorName}</span>
                      {question.memberCode && <span>รหัส {question.memberCode}</span>}
                    </div>
                    <div className={css.questionStats}>
                      {question.replyCount === 0 ? (
                        <span className={`${css.statusPill} ${css.pillUnanswered}`}>รอตอบ</span>
                      ) : (
                        <span className={`${css.statusPill} ${css.pillAnswered}`}>ตอบแล้ว</span>
                      )}
                      <span className={css.statPill}>
                        <MessageCircle size={12} />
                        {question.replyCount}
                      </span>
                      <span className={css.statPill}>
                        <Eye size={12} />
                        {question.views}
                      </span>
                      {question.isPinned && <span className={`${css.statusPill} ${css.statusPinned}`}>ปักหมุด</span>}
                      {question.isClosed && <span className={`${css.statusPill} ${css.statusClosed}`}>ปิดตอบ</span>}
                      {!question.isActive && <span className={`${css.statusPill} ${css.statusMuted}`}>ซ่อน</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className={css.pagination}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`${css.pageBtn} ${pageNumber === page ? css.pageBtnActive : ""}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={css.detailPane}>
          {!selectedId ? (
            <div className={css.emptyDetail}>
              <MessageSquareText size={40} />
              <h2>เลือกคำถามจากรายการด้านซ้าย</h2>
              <p>เมื่อเลือกแล้ว คุณจะเห็นรายละเอียดทั้งหมดและตอบกลับได้จากหน้าจอนี้ทันที</p>
            </div>
          ) : detailLoading && !selectedQuestion ? (
            <div className={css.emptyDetail}>
              <Loader2 className={css.spin} size={28} />
              <p>กำลังโหลดรายละเอียดคำถาม...</p>
            </div>
          ) : selectedQuestion ? (
            <>
              <div className={css.detailHeader}>
                <div className={css.detailHeading}>
                  <div className={css.detailBadgeRow}>
                    <span className={css.questionId}>Question #{selectedQuestion.id}</span>
                    <Link href={`/qna/${selectedQuestion.id}`} target="_blank" className={css.previewLink}>
                      เปิดหน้าจริง <ArrowUpRight size={14} />
                    </Link>
                  </div>
                  <h2 className={css.detailTitle}>{selectedQuestion.title}</h2>
                  <div className={css.detailMeta}>
                    <span>{selectedQuestion.authorName}</span>
                    {selectedQuestion.memberCode && <span>รหัสสมาชิก {selectedQuestion.memberCode}</span>}
                    <span>{formatDate(selectedQuestion.createdAt)}</span>
                  </div>
                </div>

                <div className={css.detailActions}>
                  <button
                    className={`${css.toggleBtn} ${selectedQuestion.isPinned ? css.toggleBtnActive : ""}`}
                    onClick={() => updateQuestion(selectedQuestion.id, { isPinned: !selectedQuestion.isPinned })}
                  >
                    <Pin size={16} />
                    {selectedQuestion.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
                  </button>
                  <button
                    className={`${css.toggleBtn} ${selectedQuestion.isClosed ? css.toggleBtnActive : ""}`}
                    onClick={() => updateQuestion(selectedQuestion.id, { isClosed: !selectedQuestion.isClosed })}
                  >
                    <Lock size={16} />
                    {selectedQuestion.isClosed ? "เปิดตอบ" : "ปิดตอบ"}
                  </button>
                  <button
                    className={`${css.toggleBtn} ${!selectedQuestion.isActive ? css.toggleBtnMuted : ""}`}
                    onClick={() => updateQuestion(selectedQuestion.id, { isActive: !selectedQuestion.isActive })}
                  >
                    {selectedQuestion.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    {selectedQuestion.isActive ? "แสดงบนเว็บ" : "ซ่อนจากเว็บ"}
                  </button>
                  <button className={css.deleteBtn} onClick={() => deleteQuestion(selectedQuestion.id)}>
                    <Trash2 size={16} />
                    ลบกระทู้
                  </button>
                </div>
              </div>

              <div className={css.detailGrid}>
                <article className={css.threadPanel}>
                  <div className={css.cardHeader}>
                    <h3 className={css.sectionTitle}>เนื้อหาคำถาม</h3>
                    <div className={css.inlineStats}>
                      <span className={css.statPill}>
                        <MessageCircle size={14} />
                        {selectedQuestion.replyCount} คำตอบ
                      </span>
                      <span className={css.statPill}>
                        <Eye size={14} />
                        {selectedQuestion.views} ครั้ง
                      </span>
                    </div>
                  </div>
                  <div className={css.questionBody}><Linkify text={selectedQuestion.body} /></div>

                  <div className={css.timeline}>
                    {selectedQuestion.replies.length === 0 ? (
                      <div className={css.timelineEmpty}>ยังไม่มีการตอบกลับ เริ่มตอบจากช่องด้านขวาได้เลย</div>
                    ) : (
                      selectedQuestion.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`${css.replyItem} ${reply.isAdmin ? css.replyAdmin : css.replyMember}`}
                        >
                          <div className={css.replyHead}>
                            <div>
                              <strong>{reply.authorName}</strong>
                              <div className={css.replyMeta}>
                                <span>{reply.isAdmin ? "เจ้าหน้าที่" : "สมาชิก"}</span>
                                {reply.memberCode && <span>รหัส {reply.memberCode}</span>}
                                <span>{formatDate(reply.createdAt)}</span>
                              </div>
                            </div>
                            {reply.isAdmin && (
                              <button
                                className={css.replyDeleteBtn}
                                onClick={() => deleteReply(reply.id)}
                                title="ลบข้อความตอบนี้"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                          <p className={css.replyBody}><Linkify text={reply.body} /></p>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <aside className={css.composePanel}>
                  <div className={css.cardHeader}>
                    <div>
                      <h3 className={css.sectionTitle}>ตอบกลับเจ้าหน้าที่</h3>
                      <span className={css.helperText}>ตอบได้ทันทีโดยไม่ต้องเลื่อนหาปุ่มส่งด้านล่าง</span>
                    </div>
                    <button
                      className={css.submitBtn}
                      onClick={submitReply}
                      disabled={replying || !replyBody.trim() || selectedQuestion.isClosed}
                    >
                      {replying ? <Loader2 className={css.spin} size={16} /> : <Send size={16} />}
                      {selectedQuestion.isClosed ? "ปิดตอบอยู่" : "ส่งคำตอบ"}
                    </button>
                  </div>

                  <div className={css.quickReplies}>
                    {QUICK_REPLIES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        className={css.quickReplyBtn}
                        onClick={() => setReplyBody(template)}
                      >
                        {template}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className={css.replyTextarea}
                    placeholder="พิมพ์คำตอบในนามเจ้าหน้าที่..."
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                  />

                  <div className={css.composeFooter}>
                    <span className={css.charCount}>{replyBody.trim().length} ตัวอักษร</span>
                    <span className={css.composeHint}>
                      {selectedQuestion.isClosed ? "กระทู้นี้ปิดตอบอยู่" : "กดส่งได้จากมุมขวาบนของกล่องนี้"}
                    </span>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className={css.emptyDetail}>
              <MessageSquareText size={40} />
              <h2>ไม่พบรายละเอียดคำถาม</h2>
              <p>ลองเลือกคำถามใหม่จากรายการด้านซ้ายอีกครั้ง</p>
            </div>
          )}
        </section>
      </section>

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
