"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  FormOutlined,
  FileTextOutlined,
  SendOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

type TabType = "submit" | "track";

interface TrackResult {
  trackingCode: string;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const categoryLabels: Record<string, string> = {
  complaint: "ร้องเรียน / ร้องทุกข์",
  suggestion: "ข้อเสนอแนะ",
  inquiry: "สอบถามข้อมูล",
};

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  reviewing: "กำลังตรวจสอบ",
  resolved: "ดำเนินการเสร็จสิ้น",
  rejected: "ไม่รับพิจารณา",
};

const statusClass: Record<string, string> = {
  pending: css.statusPending,
  reviewing: css.statusReviewing,
  resolved: css.statusResolved,
  rejected: css.statusRejected,
};

export default function ComplaintsPage() {
  const [tab, setTab] = useState<TabType>("submit");

  // Form state
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("complaint");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState("");
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hp, setHp] = useState(""); // honeypot anti-bot

  // Track state
  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null);
  const [trackError, setTrackError] = useState("");

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !detail.trim()) return;
    if (!pdpaConsent) {
      alert("กรุณายินยอมให้จัดเก็บข้อมูลตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: memberId.trim() || null,
          name: name.trim() || null,
          tel: tel.trim() || null,
          email: email.trim() || null,
          category,
          subject: subject.trim(),
          complaint: detail.trim(),
          _hp: hp, // honeypot
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultCode(data.trackingCode);
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = () => setShowConfirm(false);

  const handleTrack = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    setTrackResult(null);
    setTrackError("");

    try {
      const res = await fetch(`/api/complaints?code=${trackCode.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResult(data.complaint);
      } else {
        setTrackError(data.error || "ไม่พบข้อมูล");
      }
    } catch {
      setTrackError("เกิดข้อผิดพลาด");
    } finally {
      setTracking(false);
    }
  };

  const resetForm = () => {
    setMemberId("");
    setName("");
    setTel("");
    setEmail("");
    setCategory("complaint");
    setSubject("");
    setDetail("");
    setResultCode("");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Success screen
  if (resultCode) {
    return (
      <>
        <div className={css.hero}>
          <div className={css.heroInner}>
            <div className={css.heroIcon}><SafetyCertificateOutlined /></div>
            <h1 className={css.heroTitle}>แจ้งข้อเสนอแนะ ร้องเรียน</h1>
            <p className={css.heroSub}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</p>
          </div>
        </div>

        <div className={css.content}>
          <div className={css.success}>
            <div className={css.successIcon}><CheckCircleOutlined /></div>
            <h2 className={css.successTitle}>ส่งข้อมูลสำเร็จ!</h2>
            <p className={css.successSub}>ระบบได้รับข้อมูลของท่านแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบ</p>
            <div className={css.trackingDisplay}>
              รหัสติดตาม: {resultCode}
            </div>
            <p className={css.successSub}>กรุณาจดรหัสนี้ไว้ เพื่อใช้ตรวจสอบสถานะ</p>
            <div className={css.successActions}>
              <button className={`${css.successBtn} ${css.successBtnPrimary}`} onClick={resetForm}>
                ส่งเรื่องใหม่
              </button>
              <button className={css.successBtn} onClick={() => { setResultCode(""); setTab("track"); setTrackCode(resultCode); }}>
                ตรวจสอบสถานะ
              </button>
              <Link href="/" className={css.successBtn}>
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroInner}>
          <div className={css.heroIcon}><SafetyCertificateOutlined /></div>
          <h1 className={css.heroTitle}>แจ้งข้อเสนอแนะ ร้องเรียน</h1>
          <p className={css.heroSub}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ได้จัดทำช่องทางการแจ้งข้อเสนอแนะหรือร้องเรียนต่างๆ เพื่ออำนวยความสะดวกให้กับสมาชิก</p>

          <div className={css.infoBanner}>
            <span className={css.infoBannerIcon}><ExclamationCircleOutlined /></span>
            หากท่านได้รับความเดือดร้อนหรือความไม่เป็นธรรมจากการไม่ปฏิบัติตามระเบียบสหกรณ์ หรือเจ้าหน้าที่สหกรณ์ สามารถแจ้งข้อเสนอแนะหรือร้องเรียนได้ตามแบบฟอร์มด้านล่างนี้
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={css.content}>
        {/* Tabs */}
        <div className={css.tabs}>
          <button
            className={`${css.tab} ${tab === "submit" ? css.tabActive : ""}`}
            onClick={() => setTab("submit")}
          >
            <FormOutlined /> แจ้งข้อเสนอแนะ / ร้องเรียน
          </button>
          <button
            className={`${css.tab} ${tab === "track" ? css.tabActive : ""}`}
            onClick={() => setTab("track")}
          >
            <SearchOutlined /> ตรวจสอบสถานะ
          </button>
        </div>

        {tab === "submit" ? (
          <form className={css.formCard} onSubmit={handleSubmitClick}>
            {/* ข้อมูลผู้แจ้ง */}
            <div className={css.formSection}>
              <div className={css.formSectionTitle}>
                <UserOutlined /> ข้อมูลผู้แจ้ง (ข้อมูลส่วนตัวเป็นทางเลือก)
              </div>

              <div className={css.formRow}>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}>
                    <IdcardOutlined /> เลขสมาชิก
                  </label>
                  <input
                    className={css.formInput}
                    placeholder="ใส่เลขสมาชิก (ถ้ามี) เช่น 12345"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                  />
                </div>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}>
                    <UserOutlined /> ชื่อ - นามสกุล
                  </label>
                  <input
                    className={css.formInput}
                    placeholder="ใส่ชื่อ-นามสกุล (หากต้องการให้ติดต่อกลับ)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className={css.formRow}>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}>
                    <PhoneOutlined /> เบอร์โทรศัพท์
                  </label>
                  <input
                    className={css.formInput}
                    placeholder="เช่น 081-234-5678"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                  />
                </div>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}>
                    <MailOutlined /> อีเมล
                  </label>
                  <input
                    className={css.formInput}
                    type="email"
                    placeholder="เช่น example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ประเภทและรายละเอียด */}
            <div className={css.formSection}>
              <div className={css.formSectionTitle}>
                <FileTextOutlined /> รายละเอียดเรื่อง
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  ประเภท <span className={css.formRequired}>*</span>
                </label>
                <select
                  className={css.formSelect}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="complaint">ร้องเรียน / ร้องทุกข์</option>
                  <option value="suggestion">ข้อเสนอแนะ</option>
                  <option value="inquiry">สอบถามข้อมูล</option>
                </select>
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  เรื่อง <span className={css.formRequired}>*</span>
                </label>
                <input
                  className={css.formInput}
                  placeholder="ระบุหัวข้อเรื่อง"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  รายละเอียด <span className={css.formRequired}>*</span>
                </label>
                <textarea
                  className={css.formTextarea}
                  placeholder="อธิบายข้อเสนอแนะ/ร้องเรียน/เหตุ เช่น บริการน้ำ, พนักงานไม่สุภาพ, วันที่ 15/1/67, 10:30 น."
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  required
                />
                <span className={css.formHint}>
                  <InfoCircleOutlined /> กรอกเฉพาะข้อร้องเรียนได้เลย ข้อมูลส่วนตัวเป็นทางเลือก
                </span>
              </div>
            </div>

            {/* PDPA Consent */}
            <div className={css.formSection}>
              <label className={css.pdpaLabel}>
                <input
                  type="checkbox"
                  checked={pdpaConsent}
                  onChange={(e) => setPdpaConsent(e.target.checked)}
                  className={css.pdpaCheckbox}
                />
                <span className={css.pdpaText}>
                  ข้าพเจ้ายินยอมให้สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด จัดเก็บและใช้ข้อมูลส่วนบุคคลของข้าพเจ้า เพื่อดำเนินการตามเรื่องร้องเรียน/ข้อเสนอแนะเท่านั้น ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                </span>
              </label>
            </div>

            <div className={css.formActions}>
              <button className={css.submitBtn} type="submit" disabled={submitting || !pdpaConsent}>
                <SendOutlined /> {submitting ? "กำลังส่ง..." : "ส่งข้อมูล"}
              </button>
              <button type="button" className={css.cancelBtn} onClick={resetForm}>
                <CloseOutlined /> ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <div className={css.trackCard}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f1d36", margin: "0 0 8px" }}>
              ตรวจสอบสถานะเรื่อง
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              กรอกรหัสติดตามที่ได้รับเมื่อส่งเรื่อง
            </p>
            <div className={css.trackInputRow}>
              <input
                className={css.trackInput}
                placeholder="เช่น CP260219-1234"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
              <button className={css.trackBtn} onClick={handleTrack} disabled={tracking}>
                {tracking ? "..." : "ค้นหา"}
              </button>
            </div>

            {trackError && (
              <p style={{ color: "#ef4444", fontSize: 13, marginTop: 16 }}>{trackError}</p>
            )}

            {trackResult && (
              <div className={css.trackResult}>
                <div className={css.trackRow}>
                  <span className={css.trackLabel}>รหัสติดตาม</span>
                  <span className={css.trackValue}>{trackResult.trackingCode}</span>
                </div>
                <div className={css.trackRow}>
                  <span className={css.trackLabel}>ประเภท</span>
                  <span className={css.trackValue}>{categoryLabels[trackResult.category] || trackResult.category}</span>
                </div>
                <div className={css.trackRow}>
                  <span className={css.trackLabel}>เรื่อง</span>
                  <span className={css.trackValue}>{trackResult.subject}</span>
                </div>
                <div className={css.trackRow}>
                  <span className={css.trackLabel}>สถานะ</span>
                  <span className={`${css.statusBadge} ${statusClass[trackResult.status] || ""}`}>
                    {statusLabels[trackResult.status] || trackResult.status}
                  </span>
                </div>
                <div className={css.trackRow}>
                  <span className={css.trackLabel}>วันที่แจ้ง</span>
                  <span className={css.trackValue}>{formatDate(trackResult.createdAt)}</span>
                </div>
                {trackResult.resolvedAt && (
                  <div className={css.trackRow}>
                    <span className={css.trackLabel}>วันที่เสร็จสิ้น</span>
                    <span className={css.trackValue}>{formatDate(trackResult.resolvedAt)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className={css.confirmOverlay}>
          <div className={css.confirmBox}>
            <div className={css.confirmIcon}><ExclamationCircleOutlined /></div>
            <h3 className={css.confirmTitle}>ยืนยันการส่งข้อมูล</h3>
            <p className={css.confirmText}>
              คุณต้องการส่งเรื่อง <strong>&quot;{subject}&quot;</strong> ใช่หรือไม่?<br/>
              เมื่อส่งแล้วจะไม่สามารถแก้ไขได้
            </p>
            <div className={css.confirmActions}>
              <button className={css.confirmBtnOk} onClick={handleConfirmSubmit}>
                <SendOutlined /> ยืนยันส่ง
              </button>
              <button className={css.confirmBtnCancel} onClick={handleCancelConfirm}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
