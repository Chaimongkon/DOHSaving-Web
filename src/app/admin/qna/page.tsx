"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SearchOutlined,
  MessageOutlined,
  EyeOutlined,
  PushpinOutlined,
  LockOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  SendOutlined,
} from "@ant-design/icons";
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
    <>
      <div className={css.header}>
        <h1 className={css.title}>จัดการกระดานถาม-ตอบ</h1>
        <div className={css.searchBox}>
          <SearchOutlined style={{ color: "#9ca3af" }} />
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

      {loading ? (
        <div className={css.loading}>กำลังโหลด...</div>
      ) : questions.length === 0 ? (
        <div className={css.empty}>ไม่มีกระทู้</div>
      ) : (
        <>
          <table className={css.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>หัวข้อ</th>
                <th>ผู้ถาม</th>
                <th>สถานะ</th>
                <th><MessageOutlined /> ตอบ</th>
                <th><EyeOutlined /> เข้าชม</th>
                <th>วันที่</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td className={css.titleCell}>
                    <Link href={`/qna/${q.id}`} className={css.titleLink} target="_blank">
                      {q.title}
                    </Link>
                  </td>
                  <td className={css.authorCell}>
                    {q.authorName}
                    {q.memberCode && <div>รหัส {q.memberCode}</div>}
                  </td>
                  <td>
                    {q.isPinned && <span className={`${css.badge} ${css.badgePin}`}>ปักหมุด</span>}
                    {q.isClosed && <span className={`${css.badge} ${css.badgeClosed}`}>ปิด</span>}
                    {!q.isActive && <span className={`${css.badge} ${css.badgeHidden}`}>ซ่อน</span>}
                  </td>
                  <td>
                    <span className={css.countChip}>{q.replyCount}</span>
                  </td>
                  <td>{q.views}</td>
                  <td style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {formatDate(q.createdAt)}
                  </td>
                  <td>
                    <div className={css.actions}>
                      <button
                        className={`${css.actionBtn} ${q.isPinned ? css.actionBtnActive : ""}`}
                        title="ปักหมุด"
                        onClick={() => updateQuestion(q.id, { isPinned: !q.isPinned })}
                      >
                        <PushpinOutlined />
                      </button>
                      <button
                        className={`${css.actionBtn} ${q.isClosed ? css.actionBtnActive : ""}`}
                        title="ปิดกระทู้"
                        onClick={() => updateQuestion(q.id, { isClosed: !q.isClosed })}
                      >
                        <LockOutlined />
                      </button>
                      <button
                        className={css.actionBtn}
                        title="ซ่อน/แสดง"
                        onClick={() => updateQuestion(q.id, { isActive: !q.isActive })}
                      >
                        <EyeInvisibleOutlined />
                      </button>
                      <button
                        className={css.actionBtn}
                        title="ตอบ (ในนาม admin)"
                        onClick={() => setReplyingId(replyingId === q.id ? null : q.id)}
                      >
                        <MessageOutlined />
                      </button>
                      <button
                        className={`${css.actionBtn} ${css.actionBtnDanger}`}
                        title="ลบ"
                        onClick={() => deleteQuestion(q.id)}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Inline reply panel */}
          {replyingId && (
            <div className={css.replySection}>
              <h3 className={css.replySectionTitle}>
                ตอบกระทู้ #{replyingId} ในนามเจ้าหน้าที่
              </h3>
              <textarea
                className={css.replyTextarea}
                placeholder="พิมพ์คำตอบ..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className={css.replyActions}>
                <button
                  className={css.replySubmitBtn}
                  onClick={submitReply}
                  disabled={replying || !replyBody.trim()}
                >
                  <SendOutlined /> {replying ? "กำลังส่ง..." : "ส่งคำตอบ"}
                </button>
                <button
                  className={css.replyCancelBtn}
                  onClick={() => { setReplyingId(null); setReplyBody(""); }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
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

      {toast && <div className={css.toast}>{toast}</div>}
    </>
  );
}
