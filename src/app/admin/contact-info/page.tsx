"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Printer,
  RotateCcw,
  Save,
  Users,
} from "lucide-react";
import {
  DEFAULT_CONTACT_INFO,
  clean,
  formatTime,
  mergeFaxes,
  otherPhonesOf,
  parseTime,
} from "@/lib/contactInfo";
import css from "./page.module.css";

/* ═════════ ช่องข้อมูล ═════════
   ป้ายชื่อและคำอธิบายบอกตรง ๆ ว่าแต่ละช่องไปแสดงที่ไหนบนหน้าเว็บ */
type FieldType = "text" | "phone" | "time" | "email" | "line" | "address";
interface Field {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type: FieldType;
  required?: boolean;
}

const SECTIONS: { id: string; title: string; desc: string; icon: React.ElementType; fields: Field[] }[] = [
  {
    id: "hours",
    title: "เวลาทำการ",
    desc: "หน้า “ติดต่อเรา” ใช้เวลานี้แสดงป้าย เปิดทำการอยู่ / ปิดแล้ว ให้สมาชิกเห็นอัตโนมัติ (วันจันทร์–ศุกร์)",
    icon: Clock,
    fields: [
      { key: "openTime", label: "เวลาเปิด", type: "time", required: true },
      { key: "closeTime", label: "เวลาปิด", type: "time", required: true },
      { key: "financeCloseTime", label: "การเงินปิดรับรายการ", type: "time", hint: "เว้นว่างได้ ถ้าไม่มีเวลาปิดแยก" },
    ],
  },
  {
    id: "phones",
    title: "เบอร์โทรศัพท์",
    desc: "เบอร์หลักจะอยู่บนปุ่ม “โทร” ทุกหน้า เบอร์อื่นแสดงเป็นรายการเพิ่มเติมในหน้าติดต่อเรา",
    icon: Phone,
    fields: [
      { key: "mainPhone", label: "เบอร์หลัก", hint: "แสดงบนปุ่มโทรของทุกหน้า", type: "phone", required: true, placeholder: "02-345-6668" },
      { key: "phone", label: "เบอร์สำนักงานอื่น 1", type: "phone", placeholder: "02-644-7940-43" },
      { key: "phoneSub1", label: "เบอร์สำนักงานอื่น 2", type: "phone", placeholder: "02-644-9243" },
      { key: "phoneSub2", label: "เบอร์สำนักงานอื่น 3", type: "phone", placeholder: "02-644-4633" },
    ],
  },
  {
    id: "online",
    title: "ช่องทางออนไลน์",
    desc: "แสดงในหน้าติดต่อเรา กดแล้วเปิดอีเมลหรือ LINE ได้ทันที",
    icon: Globe,
    fields: [
      { key: "email", label: "อีเมล", type: "email", placeholder: "dohcoop@hotmail.com" },
      { key: "lineOfficial", label: "LINE Official ID", hint: "ขึ้นต้นด้วย @", type: "line", placeholder: "@dohsaving" },
    ],
  },
  {
    id: "fax",
    title: "โทรสาร (แฟกซ์)",
    desc: "ระบุว่าแต่ละเบอร์ส่งถึงฝ่ายใด ถ้าสองเบอร์เป็นเลขเดียวกัน หน้าเว็บจะรวมเป็นแถวเดียวให้",
    icon: Printer,
    fields: [
      { key: "fax1", label: "แฟกซ์เบอร์ที่ 1", type: "phone", placeholder: "02-354-6717" },
      { key: "fax1Note", label: "ส่งถึงฝ่าย", type: "text", placeholder: "ฝ่ายทะเบียนหุ้นฯ, ฝ่ายบัญชี" },
      { key: "fax2", label: "แฟกซ์เบอร์ที่ 2", type: "phone", placeholder: "02-644-4825" },
      { key: "fax2Note", label: "ส่งถึงฝ่าย", type: "text", placeholder: "ฝ่ายการเงินฯ, ฝ่ายสินเชื่อ" },
    ],
  },
  {
    id: "address",
    title: "ที่อยู่สำนักงาน",
    desc: "ขึ้นบรรทัดใหม่ตามที่ต้องการให้แสดงบนการ์ดแผนที่",
    icon: MapPin,
    fields: [{ key: "address", label: "ที่อยู่", type: "address", required: true }],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

/* ═════════ ตรวจรูปแบบ ═════════ */
function validate(field: Field, raw: string, values: Record<string, string>): string | null {
  const v = clean(raw);
  if (!v) return field.required ? "ต้องกรอกช่องนี้" : null;
  switch (field.type) {
    case "phone":
      return /^[0-9+\-\s(),]+$/.test(v) ? null : "ใช้ได้เฉพาะตัวเลข ขีด (-) และวงเล็บ";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "รูปแบบอีเมลไม่ถูกต้อง";
    case "line":
      return v.startsWith("@") ? null : "LINE Official ID ต้องขึ้นต้นด้วย @";
    case "time": {
      if (!/^\d{1,2}:\d{2}$/.test(v)) return "รูปแบบเวลาไม่ถูกต้อง";
      const open = parseTime(values.openTime, -1);
      const close = parseTime(values.closeTime, -1);
      const mine = parseTime(v, -1);
      if (field.key === "closeTime" && open >= 0 && mine <= open) return "เวลาปิดต้องหลังเวลาเปิด";
      if (field.key === "financeCloseTime" && (mine <= open || (close >= 0 && mine > close)))
        return "ต้องอยู่ระหว่างเวลาเปิดและเวลาปิด";
      return null;
    }
    default:
      return null;
  }
}

const thaiDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface InfoRow {
  key: string;
  value: string;
  updatedBy: string | null;
  updatedAt: string;
}

export default function AdminContactInfoPage() {
  const [original, setOriginal] = useState<Record<string, string> | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lastUpdate, setLastUpdate] = useState<{ at: string; by: string | null } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/contact");
        if (!res.ok) throw new Error(String(res.status));
        const json: { info?: InfoRow[] } = await res.json();
        if (cancelled) return;
        const map: Record<string, string> = {};
        let latest: InfoRow | null = null;
        for (const row of json.info ?? []) {
          map[row.key] = row.value ?? "";
          if (!latest || row.updatedAt > latest.updatedAt) latest = row;
        }
        setOriginal(map);
        setValues(map);
        if (latest) setLastUpdate({ at: latest.updatedAt, by: latest.updatedBy });
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirtyKeys = useMemo(
    () => (original ? ALL_FIELDS.map((f) => f.key).filter((k) => (values[k] ?? "") !== (original[k] ?? "")) : []),
    [original, values]
  );
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    for (const f of ALL_FIELDS) {
      const msg = validate(f, values[f.key] ?? "", values);
      if (msg) e[f.key] = msg;
    }
    return e;
  }, [values]);
  const errorCount = Object.keys(errors).length;
  const dirty = dirtyKeys.length > 0;

  // เตือนก่อนปิดหน้าถ้ายังไม่ได้บันทึก
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const discard = () => {
    if (!original) return;
    setValues(original);
    setTouched({});
  };

  const save = async () => {
    if (!original || !dirty) return;
    if (errorCount > 0) {
      setTouched(Object.fromEntries(ALL_FIELDS.map((f) => [f.key, true])));
      setToast({ ok: false, text: "ยังมีช่องที่กรอกไม่ถูกต้อง กรุณาตรวจสอบช่องที่เป็นสีแดง" });
      return;
    }
    setSaving(true);
    const saved: Record<string, string> = {};
    const failed: string[] = [];
    for (const key of dirtyKeys) {
      const value = clean(values[key]) === "" ? "" : (values[key] ?? "").trim();
      try {
        const res = await fetch("/api/admin/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error(String(res.status));
        saved[key] = value;
      } catch {
        failed.push(key);
      }
    }
    setOriginal((prev) => ({ ...(prev ?? {}), ...saved }));
    setValues((prev) => ({ ...prev, ...saved }));
    if (Object.keys(saved).length > 0) setLastUpdate({ at: new Date().toISOString(), by: "คุณ" });
    setSaving(false);
    setToast(
      failed.length === 0
        ? { ok: true, text: `บันทึกแล้ว ${Object.keys(saved).length} รายการ หน้าเว็บอัปเดตทันที` }
        : { ok: false, text: `บันทึกไม่สำเร็จ ${failed.length} รายการ ลองอีกครั้ง` }
    );
  };

  /* ── ตัวอย่างที่สมาชิกเห็น (ใช้ฟังก์ชันเดียวกับหน้า /contact) ── */
  const preview = useMemo(() => {
    const info = { ...DEFAULT_CONTACT_INFO, ...Object.fromEntries(Object.entries(values).filter(([, v]) => clean(v))) };
    const mainPhone = clean(info.mainPhone);
    return {
      open: formatTime(parseTime(info.openTime, 8 * 60 + 30)),
      close: formatTime(parseTime(info.closeTime, 16 * 60 + 30)),
      financeClose: clean(values.financeCloseTime) ? formatTime(parseTime(info.financeCloseTime, 15 * 60 + 30)) : null,
      mainPhone,
      otherPhones: otherPhonesOf(info, mainPhone),
      email: clean(info.email),
      line: clean(info.lineOfficial),
      faxes: mergeFaxes(info),
      address: clean(info.address),
    };
  }, [values]);

  if (loadError) {
    return (
      <div className={css.page}>
        <div className={css.stateBox}>
          <AlertCircle size={36} />
          <p>โหลดข้อมูลติดต่อไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p>
        </div>
      </div>
    );
  }

  const renderField = (f: Field) => {
    const value = values[f.key] ?? "";
    const isDirty = original !== null && value !== (original[f.key] ?? "");
    const error = touched[f.key] || isDirty ? errors[f.key] : undefined;
    const id = `field-${f.key}`;
    const common = {
      id,
      value,
      disabled: !original || saving,
      placeholder: f.placeholder,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${id}-error` : f.hint ? `${id}-hint` : undefined,
      onBlur: () => setTouched((prev) => ({ ...prev, [f.key]: true })),
    };
    return (
      <div key={f.key} className={`${css.field} ${f.type === "address" ? css.fieldWide : ""}`}>
        <label htmlFor={id} className={css.label}>
          {f.label}
          {f.required && <span className={css.required}>*</span>}
          {isDirty && <span className={css.changed}>แก้ไขแล้ว</span>}
        </label>
        {f.type === "address" ? (
          <textarea
            {...common}
            rows={4}
            className={`${css.input} ${css.textarea} ${error ? css.inputError : ""}`}
            onChange={(e) => setValue(f.key, e.target.value)}
          />
        ) : (
          <input
            {...common}
            type={f.type === "time" ? "time" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
            className={`${css.input} ${error ? css.inputError : ""} ${f.key === "mainPhone" ? css.inputMain : ""}`}
            onChange={(e) => setValue(f.key, e.target.value)}
          />
        )}
        {error ? (
          <span id={`${id}-error`} className={css.error}>
            <AlertCircle size={13} /> {error}
          </span>
        ) : (
          f.hint && (
            <span id={`${id}-hint`} className={css.hint}>
              {f.hint}
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}>
            <PhoneCall size={24} />
          </span>
          <div>
            <h1 className={css.title}>ข้อมูลติดต่อสหกรณ์</h1>
            <p className={css.subtitle}>
              เวลาทำการ เบอร์โทร ช่องทางออนไลน์ และที่อยู่ ที่แสดงในหน้า “ติดต่อเรา” และ “แผนที่”
            </p>
            {lastUpdate && (
              <p className={css.updated}>
                แก้ไขล่าสุด {thaiDateTime(lastUpdate.at)}
                {lastUpdate.by && ` โดย ${lastUpdate.by}`}
              </p>
            )}
          </div>
        </div>
        <div className={css.headLinks}>
          <a href="/contact" target="_blank" rel="noopener noreferrer" className={css.headLink}>
            <ExternalLink size={15} /> ดูหน้าติดต่อเรา
          </a>
        </div>
      </header>

      <div className={css.layout}>
        {/* ── ฟอร์ม ── */}
        <div className={css.sections}>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const sectionDirty = s.fields.some((f) => dirtyKeys.includes(f.key));
            return (
              <section key={s.id} className={`${css.card} ${sectionDirty ? css.cardDirty : ""}`}>
                <div className={css.cardHead}>
                  <span className={css.cardIcon}>
                    <Icon size={19} />
                  </span>
                  <div>
                    <h2 className={css.cardTitle}>{s.title}</h2>
                    <p className={css.cardDesc}>{s.desc}</p>
                  </div>
                </div>
                {original ? (
                  <div className={`${css.grid} ${s.id === "fax" ? css.gridPairs : ""} ${s.id === "hours" ? css.gridThree : ""}`}>
                    {s.fields.map(renderField)}
                  </div>
                ) : (
                  <div className={css.skeleton} />
                )}
              </section>
            );
          })}

          {/* ข้อมูลที่จัดการที่หน้าอื่น */}
          <section className={css.related}>
            <h2 className={css.relatedTitle}>ข้อมูลติดต่ออื่นที่จัดการแยก</h2>
            <div className={css.relatedLinks}>
              <Link href="/admin/departments" className={css.relatedLink}>
                <Users size={17} /> ฝ่ายงานและเบอร์ภายใน
              </Link>
              <Link href="/admin/line-contacts" className={css.relatedLink}>
                <MessageCircle size={17} /> LINE ของแต่ละฝ่าย
              </Link>
              <Link href="/admin/bank-accounts" className={css.relatedLink}>
                <Globe size={17} /> บัญชีธนาคาร
              </Link>
            </div>
          </section>
        </div>

        {/* ── ตัวอย่าง ── */}
        <aside className={css.previewCol}>
          <div className={css.preview}>
            <h2 className={css.previewTitle}>
              <Eye size={16} /> ตัวอย่างที่สมาชิกเห็น
            </h2>
            <div className={css.previewBody}>
              <div className={css.pvHours}>
                <span className={css.pvOpenDot} />
                <div>
                  <strong>
                    จันทร์–ศุกร์ {preview.open}–{preview.close} น.
                  </strong>
                  {preview.financeClose && <span>การเงินปิดรับรายการ {preview.financeClose} น.</span>}
                </div>
              </div>

              <div className={css.pvCall}>
                <PhoneCall size={17} /> โทร {preview.mainPhone || "—"}
              </div>

              {preview.otherPhones.length > 0 && (
                <div className={css.pvRow}>
                  <Phone size={15} />
                  <span>{preview.otherPhones.join(" · ")}</span>
                </div>
              )}
              {preview.email && (
                <div className={css.pvRow}>
                  <Mail size={15} />
                  <span>{preview.email}</span>
                </div>
              )}
              {preview.line && (
                <div className={css.pvRow}>
                  <MessageCircle size={15} />
                  <span>LINE {preview.line}</span>
                </div>
              )}
              {preview.faxes.map((f) => (
                <div key={f.number} className={css.pvRow}>
                  <Printer size={15} />
                  <span>
                    แฟกซ์ {f.number}
                    {f.note && <small>{f.note}</small>}
                  </span>
                </div>
              ))}
              {preview.address && (
                <div className={`${css.pvRow} ${css.pvAddress}`}>
                  <MapPin size={15} />
                  <span>{preview.address}</span>
                </div>
              )}
            </div>
            <p className={css.previewNote}>ช่องที่เว้นว่างจะแสดงค่าเริ่มต้นของระบบแทน</p>
          </div>
        </aside>
      </div>

      {/* ── แถบบันทึก (โผล่เมื่อมีการแก้ไข) ── */}
      <div className={`${css.saveBar} ${dirty ? css.saveBarShow : ""}`} aria-hidden={!dirty}>
        <span className={css.saveText}>
          แก้ไข {dirtyKeys.length} รายการ ยังไม่ได้บันทึก
          {errorCount > 0 && <em> · มีช่องที่ต้องแก้ {errorCount} ช่อง</em>}
        </span>
        <div className={css.saveActions}>
          <button type="button" className={css.discardBtn} onClick={discard} disabled={saving} tabIndex={dirty ? 0 : -1}>
            <RotateCcw size={15} /> ยกเลิกการแก้ไข
          </button>
          <button type="button" className={css.saveBtn} onClick={save} disabled={saving} tabIndex={dirty ? 0 : -1}>
            {saving ? <Loader2 size={16} className={css.spin} /> : <Save size={16} />}
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`${css.toast} ${toast.ok ? css.toastOk : css.toastError}`} role="status">
          {toast.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
