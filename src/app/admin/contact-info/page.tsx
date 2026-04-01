/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  MapPin,
  Clock,
  Phone,
  Printer,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import css from "./page.module.css";

interface InfoField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

// Pre-defined field groupings for structured rendering
const LOCATION_FIELDS: InfoField[] = [
  { key: "address", label: "ที่อยู่ติดต่อ", placeholder: "2/486 อาคาร 26...", multiline: true },
  { key: "hours", label: "เวลาทำการ", placeholder: "จันทร์ - ศุกร์...", multiline: true },
  { key: "hoursNote", label: "หมายเหตุเวลา", placeholder: "(ปิดทำการ 15.30 น.)" },
];

const PHONE_FIELDS: InfoField[] = [
  { key: "phone", label: "โทรศัพท์หลัก", placeholder: "02-245-0668" },
  { key: "mainPhone", label: "สายตรงกรมทางหลวง", placeholder: "02-245-0668" },
  { key: "phoneSub1", label: "โทรศัพท์รอง 1", placeholder: "02-644-7940-43" },
  { key: "phoneSub2", label: "โทรศัพท์รอง 2", placeholder: "02-644-9243" },
];

const FAX_FIELDS: InfoField[] = [
  { key: "fax1", label: "เบอร์แฟกซ์ 1", placeholder: "02-354-6717" },
  { key: "fax1Note", label: "หมายเหตุ (แผกซ์ 1)", placeholder: "ต่อฝ่ายทะเบียนหุ้นฯ" },
  { key: "fax2", label: "เบอร์แฟกซ์ 2", placeholder: "02-644-4825" },
  { key: "fax2Note", label: "หมายเหตุ (แฟกซ์ 2)", placeholder: "ต่อฝ่ายการเงินฯ" },
];

const ONLINE_FIELDS: InfoField[] = [
  { key: "email", label: "อัศนีปกรณ์ (Email)", placeholder: "contact@domain.com" },
  { key: "lineOfficial", label: "LINE Official", placeholder: "@dohcoop" },
];

export default function AdminContactInfoPage() {
  const [data, setData] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contact");
      if (res.ok) {
        const json = await res.json();
        if (json.info && Array.isArray(json.info)) {
          const map: Record<string, string> = {};
          for (const item of json.info) map[item.key] = item.value;
          setData(map);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveField = async (key: string) => {
    const res = await fetch("/api/admin/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: data[key] || "" }),
    });
    if (res.ok) {
      setSaved((prev) => ({ ...prev, [key]: true }));
      showToast("บันทึกข้อมูลเรียบร้อยแล้ว");
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    } else {
      showToast("❌ ขัดข้อง! บันทึกไม่สำเร็จ");
    }
  };

  const renderField = (f: InfoField) => (
    <div key={f.key} className={css.fieldGroup}>
      <div className={css.fieldLabel}>
        <span>{f.label}</span>
        <span className={css.fieldKey}>{f.key}</span>
      </div>
      <div className={css.inputWrap}>
        {f.multiline ? (
          <textarea
            className={`${css.input} ${css.textarea}`}
            value={data[f.key] || ""}
            onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
            placeholder={f.placeholder}
          />
        ) : (
          <input
            className={css.input}
            value={data[f.key] || ""}
            onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
            placeholder={f.placeholder}
          />
        )}
      </div>
      <div className={css.actionRow}>
        {saved[f.key] && (
          <span className={css.savedStatus}>
            <CheckCircle2 size={14} /> สำเร็จ
          </span>
        )}
        <button className={css.saveBtn} onClick={() => saveField(f.key)}>
          <Save size={14} /> บันทึก
        </button>
      </div>
    </div>
  );

  return (
    <div className={css.page}>
      {/* ── Header ── */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/financial-icons/contact.png" alt="Contact" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 className={css.title}>ข้อมูลติดต่อสหกรณ์</h1>
            <p className={css.subtitle}>จัดการที่อยู่ เบอร์โทรสาร และช่องทางออนไลน์ต่างๆ ที่แสดงบนผลลัพธ์หน้าเว็บ</p>
          </div>
        </div>
      </div>

      {/* ── Form Layout ── */}
      <div className={css.formGrid}>

        {/* Card 1: Location & Hours */}
        <div className={css.categoryCard}>
          <div className={css.cardHeader}>
            <div className={css.cardIcon}><MapPin size={18} /></div>
            <h2 className={css.cardTitle}>สถานที่ตั้งและเวลาทำการ</h2>
          </div>
          <div className={css.cardBody}>
            {LOCATION_FIELDS.map(renderField)}
          </div>
        </div>

        {/* Card 2: Primary Phone Contacts */}
        <div className={css.categoryCard}>
          <div className={css.cardHeader}>
            <div className={css.cardIcon}><Phone size={18} /></div>
            <h2 className={css.cardTitle}>โทรศัพท์ติดต่อ</h2>
          </div>
          <div className={css.cardBody}>
            {PHONE_FIELDS.map(renderField)}
          </div>
        </div>

        {/* Card 3: Fax Directory */}
        <div className={css.categoryCard}>
          <div className={css.cardHeader}>
            <div className={css.cardIcon}><Printer size={18} /></div>
            <h2 className={css.cardTitle}>โทรสาร (FAX)</h2>
          </div>
          <div className={css.cardBody}>
            {FAX_FIELDS.map(renderField)}
          </div>
        </div>

        {/* Card 4: Online Channels */}
        <div className={css.categoryCard}>
          <div className={css.cardHeader}>
            <div className={css.cardIcon}><Globe size={18} /></div>
            <h2 className={css.cardTitle}>ช่องทางออนไลน์</h2>
          </div>
          <div className={css.cardBody}>
            {ONLINE_FIELDS.map(renderField)}
          </div>
        </div>

      </div>

      {toast && (
        <div className={css.toast}>
          <CheckCircle2 size={18} color="#10b981" />
          {toast}
        </div>
      )}
    </div>
  );
}
