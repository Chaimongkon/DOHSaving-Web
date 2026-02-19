"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserOutlined,
  IdcardOutlined,
  FormOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

export default function QnaNewPage() {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim() || "ผู้ไม่ประสงค์ออกนาม",
          memberCode: memberCode.trim() || "000000",
          title: title.trim(),
          body: body.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      const data = await res.json();
      router.push(`/qna/${data.question.id}`);
    } catch {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={css.hero}>
        <h1 className={css.heroTitle}>ตั้งกระทู้คำถาม</h1>
        <p className={css.heroSub}>แบ่งปันคำถามของคุณ เจ้าหน้าที่สหกรณ์จะตอบให้เร็วที่สุด</p>
      </div>

      <div className={css.content}>
        <form className={css.formCard} onSubmit={handleSubmit}>
          <div className={css.formRow}>
            <div className={css.formGroupInline}>
              <label className={css.formLabel}>
                <UserOutlined /> ชื่อ - สกุล
              </label>
              <input
                className={css.formInput}
                placeholder="ชื่อ - สกุล"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <span className={css.formHint}>
                <InfoCircleOutlined /> ถ้าไม่กรอกจะใช้เป็น &quot;ผู้ไม่ประสงค์ออกนาม&quot;
              </span>
            </div>

            <div className={css.formGroupInline}>
              <label className={css.formLabel}>
                <IdcardOutlined /> เลขสมาชิก
              </label>
              <input
                className={css.formInput}
                placeholder="เลขสมาชิก"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
              />
              <span className={css.formHint}>
                <InfoCircleOutlined /> ถ้าไม่กรอกจะใช้เป็น &quot;000000&quot;
              </span>
            </div>
          </div>

          <div className={css.formGroup}>
            <label className={css.formLabel}>
              <FormOutlined /> หัวข้อ <span className={css.formRequired}>*</span>
            </label>
            <input
              className={css.formInput}
              placeholder="หัวข้อของคำถาม"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={css.formGroup}>
            <label className={css.formLabel}>
              <FileTextOutlined /> เรื่องที่ต้องการสอบถาม <span className={css.formRequired}>*</span>
            </label>
            <textarea
              className={css.formTextarea}
              placeholder="รายละเอียดของคำถามที่ต้องการสอบถาม..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className={css.formActions}>
            <button className={css.submitBtn} type="submit" disabled={submitting}>
              <SendOutlined /> {submitting ? "กำลังส่ง..." : "ตั้งกระทู้คำถาม"}
            </button>
            <Link href="/qna" className={css.backBtn}>
              <ArrowLeftOutlined /> กลับหน้าหลัก Q&A
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
