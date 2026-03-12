"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  MessageCircle,
  Eye,
  EyeOff,
  Pin,
  Lock,
  Trash2,
  MessageSquareDiff,
  X,
  Send,
  Loader2
} from "lucide-react";
import css from "./page.module.css";

interface AdminQuestion {
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
}

export default function AdminQnaPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Reply state
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/qna?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateQuestion = async (id: number, data: Record<string, unknown>) => {
    try {
      await fetch("/api/admin/qna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      showToast("อัปเดตสำเร็จ");
      fetchData();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("ต้องการลบกระทู้นี้หรือไม่? (ลบถาวร)")) return;
    try {
      await fetch(`/api/admin/qna?id=${id}`, { method: "DELETE" });
      showToast("ลบสำเร็จ");
      fetchData();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const submitReply = async () => {
    if (!replyingId || !replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/qna/${replyingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (res.ok) {
        showToast("ตอบกระทู้สำเร็จ");
        setReplyingId(null);
        setReplyBody("");
        fetchData();
      }
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className={css.page}>
      {/* ── Hero Header ── */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/financial-icons/qna.png" alt="QnA" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 className={css.title}>จัดการกระดานถาม-ตอบ</h1>
            <p className={css.subtitle}>ดูแลและตอบปัญหาสมาชิกในระบบถาม-ตอบของสหกรณ์</p>
          </div>
        </div>
        <div className={css.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            className={css.searchInput}
            placeholder="ค้นหากระทู้..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      {loading ? (
        <div className={css.loading}>
          <Loader2 className="animate-spin" size={24} color="#3b82f6" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className={css.emptyStateContainer}>
          <div className={css.emptyState}>
            <MessageSquareDiff size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>ไม่พบกระทู้ถาม-ตอบในระบบ</p>
          </div>
        </div>
      ) : (
        <>
          <div className={css.tableContainer}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th className={css.th} style={{ width: "5%" }}>ID</th>
                  <th className={css.th} style={{ width: "30%" }}>หัวข้อ</th>
                  <th className={css.th} style={{ width: "15%" }}>ผู้ถาม</th>
                  <th className={css.th} style={{ width: "10%" }}>สถานะ</th>
                  <th className={css.th} style={{ width: "8%", textAlign: "center" }} title="จำนวนการตอบ">
                    <MessageCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    ตอบ
                  </th>
                  <th className={css.th} style={{ width: "8%", textAlign: "center" }} title="จำนวนผู้เข้าชม">
                    <Eye size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    เข้าชม
                  </th>
                  <th className={css.th} style={{ width: "12%" }}>วันที่ตั้งกระทู้</th>
                  <th className={css.th} style={{ width: "12%", textAlign: "center" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className={css.tableRow}>
                    <td className={css.td} style={{ color: "#64748b", fontWeight: 500 }}>{q.id}</td>
                    <td className={css.td}>
                      <div className={css.titleCell}>
                        <Link href={`/qna/${q.id}`} className={css.titleLink} target="_blank" title="เปิดดูกระทู้ (หน้าต่างใหม่)">
                          {q.title}
                        </Link>
                      </div>
                    </td>
                    <td className={css.td}>
                      <div className={css.authorCell}>
                        {q.authorName}
                        {q.memberCode && <div className={css.authorCode}>รหัส: {q.memberCode}</div>}
                      </div>
                    </td>
                    <td className={css.td}>
                      <div className={css.badgeWrap}>
                        {q.isPinned && <span className={`${css.badge} ${css.badgePin}`}>ปักหมุด</span>}
                        {q.isClosed && <span className={`${css.badge} ${css.badgeClosed}`}>ปิดกระทู้</span>}
                        {!q.isActive && <span className={`${css.badge} ${css.badgeHidden}`}>ซ่อนอยู่</span>}
                      </div>
                    </td>
                    <td className={css.td} style={{ textAlign: "center" }}>
                      <span className={css.countChip}>{q.replyCount}</span>
                    </td>
                    <td className={css.td} style={{ textAlign: "center", color: "#64748b", fontWeight: 500 }}>
                      {q.views}
                    </td>
                    <td className={css.td} style={{ fontSize: 13, color: "#64748b" }}>
                      {formatDate(q.createdAt)}
                    </td>
                    <td className={css.td} style={{ textAlign: "center" }}>
                      <div className={css.actions}>
                        <button
                          className={`${css.actionBtn} ${q.isPinned ? css.actionBtnActive : ""}`}
                          title={q.isPinned ? "เลิกปักหมุด" : "ปักหมุดกระทู้"}
                          onClick={() => updateQuestion(q.id, { isPinned: !q.isPinned })}
                        >
                          <Pin size={16} />
                        </button>
                        <button
                          className={`${css.actionBtn} ${q.isClosed ? css.actionBtnActive : ""}`}
                          title={q.isClosed ? "เปิดกระทู้" : "ปิดกระทู้ (ล็อกไม่ให้ตอบ)"}
                          onClick={() => updateQuestion(q.id, { isClosed: !q.isClosed })}
                        >
                          <Lock size={16} />
                        </button>
                        <button
                          className={`${css.actionBtn} ${!q.isActive ? css.actionBtnActive : ""}`}
                          title={q.isActive ? "ซ่อนกระทู้จากหน้าเว็บ" : "แสดงกระทู้บนหน้าเว็บ"}
                          onClick={() => updateQuestion(q.id, { isActive: !q.isActive })}
                        >
                          {q.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          className={css.actionBtn}
                          title="ตอบกระทู้ในนามเจ้าหน้าที่ (Admin)"
                          style={{ color: "#0284c7" }}
                          onClick={() => setReplyingId(replyingId === q.id ? null : q.id)}
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          className={`${css.actionBtn} ${css.actionBtnDanger}`}
                          title="ลบกระทู้ (ลบถาวร)"
                          onClick={() => deleteQuestion(q.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className={css.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${css.pageBtn} ${p === page ? css.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Reply Modal ── */}
      {replyingId && (
        <div className={css.modalOverlay} onClick={() => { setReplyingId(null); setReplyBody(""); }}>
          <div className={css.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                <MessageCircle size={20} color="#0284c7" />
                ตอบกระทู้ #{replyingId}
              </h3>
              <button className={css.closeBtn} onClick={() => { setReplyingId(null); setReplyBody(""); }}>
                <X size={20} />
              </button>
            </div>
            <div className={css.modalBody}>
              <textarea
                className={css.replyTextarea}
                placeholder="พิมพ์ข้อความตอบกลับในนามเจ้าหน้าที่..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                autoFocus
              />
            </div>
            <div className={css.modalFooter}>
              <button
                className={css.cancelBtn}
                onClick={() => { setReplyingId(null); setReplyBody(""); }}
              >
                ยกเลิก
              </button>
              <button
                className={css.submitBtn}
                onClick={submitReply}
                disabled={replying || !replyBody.trim()}
              >
                {replying ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send size={16} /> ส่งคำตอบ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
