"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  PushpinOutlined,
  LockOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface Reply {
  id: number;
  authorName: string;
  memberCode: string | null;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}

interface QuestionDetail {
  id: number;
  authorName: string;
  memberCode: string | null;
  title: string;
  body: string;
  views: number;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  replies: Reply[];
}

export default function QnaThreadPage() {
  const params = useParams();
  const id = params?.id as string;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reply form
  const [replyName, setReplyName] = useState("");
  const [replyCode, setReplyCode] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hp, setHp] = useState(""); // honeypot anti-bot

  const fetchQuestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/qna/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setQuestion(data.question);
    } catch {
      setError("ไม่พบกระทู้ที่ต้องการ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchQuestion();
  }, [id, fetchQuestion]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/qna/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: replyName.trim() || "ผู้ไม่ประสงค์ออกนาม",
          memberCode: replyCode.trim() || "000000",
          body: replyBody.trim(),
          _hp: hp, // honeypot
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      setReplyBody("");
      fetchQuestion();
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className={css.loading}>
        <div className={css.spinner} />
        <span>กำลังโหลดกระทู้...</span>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className={css.error}>
        <p>{error || "ไม่พบกระทู้"}</p>
        <Link href="/qna" className={css.backLink}>
          <ArrowLeftOutlined /> กลับหน้ากระดานถาม-ตอบ
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={css.backBar}>
        <Link href="/qna" className={css.backLink}>
          <ArrowLeftOutlined /> กลับหน้ากระดานถาม-ตอบ
        </Link>
      </div>

      {/* UX4: Floating reply button */}
      {!question.isClosed && (
        <button
          className={css.floatingReplyBtn}
          onClick={() => document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" })}
        >
          <EditOutlined /> ตอบกระทู้นี้
        </button>
      )}

      <div className={css.content}>
        {/* Question */}
        <div className={css.questionCard}>
          <div className={css.questionHeader}>
            {(question.isPinned || question.isClosed) && (
              <div className={css.questionBadges}>
                {question.isPinned && (
                  <span className={`${css.badge} ${css.badgePin}`}>
                    <PushpinOutlined /> ปักหมุด
                  </span>
                )}
                {question.isClosed && (
                  <span className={`${css.badge} ${css.badgeClosed}`}>
                    <LockOutlined /> ปิดรับคำตอบ
                  </span>
                )}
              </div>
            )}

            <h1 className={css.questionTitle}>{question.title}</h1>

            <div className={css.questionMeta}>
              <span className={css.metaItem}>
                <UserOutlined />
                <span className={css.metaAuthor}>{question.authorName}</span>
                {question.memberCode && <span>(รหัส {question.memberCode})</span>}
              </span>
              <span className={css.metaItem}>
                <ClockCircleOutlined /> {formatDate(question.createdAt)}
              </span>
            </div>
          </div>

          <div className={css.questionBody}>{question.body}</div>

          <div className={css.questionStats}>
            <span className={css.statItem}>
              <EyeOutlined /> {question.views} เข้าชม
            </span>
            <span className={css.statItem}>
              <MessageOutlined /> {question.replies.length} คำตอบ
            </span>
          </div>
        </div>

        {/* Replies */}
        <div className={css.repliesSection}>
          <div className={css.repliesHeader}>
            <h2 className={css.repliesTitle}>คำตอบทั้งหมด</h2>
            <span className={css.repliesCount}>{question.replies.length}</span>
          </div>

          {question.replies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#9ca3af", fontSize: 14 }}>
              ยังไม่มีคำตอบ เป็นคนแรกที่ตอบกระทู้นี้!
            </div>
          ) : (
            <div className={css.replyList}>
              {question.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`${css.replyCard} ${reply.isAdmin ? css.replyCardAdmin : ""}`}
                >
                  <div className={css.replyHeader}>
                    <div className={`${css.replyAvatar} ${reply.isAdmin ? css.avatarAdmin : css.avatarMember}`}>
                      {reply.isAdmin ? <SafetyCertificateOutlined /> : <UserOutlined />}
                    </div>
                    <div className={css.replyAuthorInfo}>
                      <div className={css.replyAuthor}>
                        {reply.authorName}
                        {reply.isAdmin && <span className={css.adminTag}>เจ้าหน้าที่</span>}
                      </div>
                      <div className={css.replyDate}>{formatDate(reply.createdAt)}</div>
                    </div>
                  </div>
                  <div className={css.replyBody}>{reply.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply form or closed message */}
        {question.isClosed ? (
          <div className={css.closedMsg}>
            <LockOutlined /> กระทู้นี้ปิดรับคำตอบแล้ว
          </div>
        ) : (
          <form id="reply-form" className={css.replyForm} onSubmit={handleReply}>
            <h3 className={css.replyFormTitle}>
              <MessageOutlined /> ตอบกระทู้
            </h3>

            <div className={css.formRow}>
              <div className={css.formGroup}>
                <label className={css.formLabel}>ชื่อ - สกุล</label>
                <input
                  className={css.formInput}
                  placeholder="ถ้าไม่กรอกจะใช้เป็น ผู้ไม่ประสงค์ออกนาม"
                  value={replyName}
                  onChange={(e) => setReplyName(e.target.value)}
                />
              </div>
              <div className={css.formGroup}>
                <label className={css.formLabel}>เลขสมาชิก</label>
                <input
                  className={css.formInput}
                  placeholder="เลขสมาชิก"
                  value={replyCode}
                  onChange={(e) => setReplyCode(e.target.value)}
                />
              </div>
            </div>

            <div className={css.formGroup}>
              <label className={css.formLabel}>ข้อความ *</label>
              <textarea
                className={css.formTextarea}
                placeholder="พิมพ์คำตอบของคุณ..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                required
              />
            </div>

            <div className={css.formActions}>
              <button className={css.submitBtn} type="submit" disabled={submitting}>
                <SendOutlined /> {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
