"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  SendOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import css from "./ComplaintPopup.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ComplaintPopup({ open, onClose }: Props) {
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
  const [hp, setHp] = useState(""); // honeypot anti-bot

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !detail.trim()) return;
    if (!pdpaConsent) {
      alert("กรุณายินยอมให้จัดเก็บข้อมูลตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล");
      return;
    }
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

  const handleClose = () => {
    setMemberId("");
    setName("");
    setTel("");
    setEmail("");
    setCategory("complaint");
    setSubject("");
    setDetail("");
    setResultCode("");
    onClose();
  };

  // Success state
  if (resultCode) {
    return (
      <div className={css.overlay} onClick={handleClose}>
        <div className={css.modal} onClick={(e) => e.stopPropagation()}>
          <div className={css.modalHeader}>
            <div className={css.modalHeaderContent}>
              <h2 className={css.modalTitle}>
                <span className={css.modalTitleIcon}><SafetyCertificateOutlined /></span>
                แจ้งข้อเสนอแนะ / ร้องเรียน
              </h2>
              <button className={css.closeBtn} onClick={handleClose}><CloseOutlined /></button>
            </div>
          </div>
          <div className={css.successBody}>
            <div className={css.successIcon}><CheckCircleOutlined /></div>
            <h3 className={css.successTitle}>ส่งข้อมูลสำเร็จ!</h3>
            <p className={css.successSub}>ระบบได้รับข้อมูลของท่านแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบ</p>
            <div className={css.trackingCode}>รหัสติดตาม: {resultCode}</div>
            <p className={css.successSub}>กรุณาจดรหัสนี้ไว้เพื่อตรวจสอบสถานะ</p>
            <div className={css.successActions}>
              <button className={`${css.successBtn} ${css.successBtnPrimary}`} onClick={handleClose}>
                ปิด
              </button>
              <Link href="/complaints" className={css.successBtn} onClick={handleClose}>
                ตรวจสอบสถานะ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={css.overlay} onClick={handleClose}>
      <div className={css.modal} onClick={(e) => e.stopPropagation()}>
        <div className={css.modalHeader}>
          <div className={css.modalHeaderContent}>
            <h2 className={css.modalTitle}>
              <span className={css.modalTitleIcon}><SafetyCertificateOutlined /></span>
              แจ้งข้อเสนอแนะ / ร้องเรียน
            </h2>
            <button className={css.closeBtn} onClick={handleClose}><CloseOutlined /></button>
          </div>
          <p className={css.modalSub}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — ข้อมูลส่วนตัวเป็นทางเลือก</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={css.modalBody}>
            {/* ── Section: ข้อมูลผู้แจ้ง ── */}
            <div className={css.formSection}>
              <div className={css.formSectionLabel}><UserOutlined /> ข้อมูลผู้แจ้ง (ทางเลือก)</div>
              <div className={css.formRow}>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}><IdcardOutlined /> เลขสมาชิก</label>
                  <input className={css.formInput} placeholder="เช่น 12345" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
                </div>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}><UserOutlined /> ชื่อ - นามสกุล</label>
                  <input className={css.formInput} placeholder="หากต้องการให้ติดต่อกลับ" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className={css.formRow}>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}><PhoneOutlined /> เบอร์โทร</label>
                  <input className={css.formInput} placeholder="081-234-5678" value={tel} onChange={(e) => setTel(e.target.value)} />
                </div>
                <div className={css.formGroupInline}>
                  <label className={css.formLabel}><MailOutlined /> อีเมล</label>
                  <input className={css.formInput} type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── Section: รายละเอียดเรื่อง ── */}
            <div className={css.formSection}>
              <div className={css.formSectionLabel}><FileTextOutlined /> รายละเอียดเรื่อง</div>
              <div className={css.formGroup}>
                <label className={css.formLabel}>ประเภท <span className={css.formRequired}>*</span></label>
                <select className={css.formSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="complaint">ร้องเรียน / ร้องทุกข์</option>
                  <option value="suggestion">ข้อเสนอแนะ</option>
                  <option value="inquiry">สอบถามข้อมูล</option>
                </select>
              </div>
              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  เรื่อง <span className={css.formRequired}>*</span>
                </label>
                <input className={css.formInput} placeholder="ระบุหัวข้อเรื่อง" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className={css.formGroup}>
                <label className={css.formLabel}>
                  รายละเอียด <span className={css.formRequired}>*</span>
                </label>
                <textarea
                  className={css.formTextarea}
                  placeholder="อธิบายรายละเอียด เช่น บริการน้ำ, พนักงาน, วันที่ 15/1/67..."
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
                  ข้าพเจ้ายินยอมให้สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด จัดเก็บและใช้ข้อมูลส่วนบุคคล เพื่อดำเนินการตามเรื่องร้องเรียน/ข้อเสนอแนะ ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                </span>
              </label>
            </div>
          </div>

          <div className={css.modalFooter}>
            <Link href="/complaints" className={css.fullPageLink} onClick={handleClose}>
              เปิดแบบฟอร์มเต็ม →
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className={css.cancelBtn} onClick={handleClose}>ยกเลิก</button>
              <button type="submit" className={css.submitBtn} disabled={submitting || !pdpaConsent}>
                <SendOutlined /> {submitting ? "กำลังส่ง..." : "ส่งข้อมูล"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
