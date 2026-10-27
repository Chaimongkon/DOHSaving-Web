"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ExternalLink, ImageOff, ImagePlus, Info, LayoutPanelLeft, Loader2, RotateCcw, Upload } from "lucide-react";
import css from "./page.module.css";

/* ═════════ เมนูหลักที่มีแผงเมนูย่อย — ตรงกับ components/layout/Navbar.tsx ═════════ */
interface Slot {
  key: string;
  label: string;
  tagline: string;
  /** รูปที่ใช้เมื่อยังไม่ได้อัปโหลด · null = ไม่มี (ช่องรูปไม่แสดง) */
  fallback: string | null;
  /** ขนาดรูปบนหน้าเว็บ: แผงกว้าง 220px · ปกติ 180px · ลิงก์น้อย 110px */
  size: "wide" | "normal" | "compact";
  links: number;
}

const SLOTS: Slot[] = [
  { key: "mega-about", label: "เกี่ยวกับสหกรณ์ฯ", tagline: "ทำความรู้จักสหกรณ์ ผู้บริหาร และฝ่ายงานต่าง ๆ", fallback: "/mega-about.svg", size: "normal", links: 12 },
  { key: "mega-services", label: "บริการ", tagline: "สมัครสมาชิก เงินฝาก เงินกู้ และสวัสดิการสำหรับสมาชิก", fallback: "/mega-services.svg", size: "wide", links: 18 },
  { key: "mega-news", label: "ข่าวสาร", tagline: "ข่าวประชาสัมพันธ์และกิจกรรมของสหกรณ์", fallback: null, size: "compact", links: 4 },
  { key: "mega-documents", label: "เอกสาร", tagline: "รายงานการเงิน ข้อบังคับ ระเบียบ และแบบฟอร์ม", fallback: "/mega-reports.svg", size: "wide", links: 16 },
  { key: "mega-contact", label: "ติดต่อเรา", tagline: "ช่องทางติดต่อ สอบถาม และร้องเรียน", fallback: null, size: "compact", links: 4 },
];

const SIZE_PX: Record<Slot["size"], number> = { wide: 220, normal: 180, compact: 110 };
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_MB = 10;

interface Setting {
  key: string;
  value: string | null;
  updatedAt: string;
}

const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });

/* ═════════ ตัวอย่างแผงเมนูย่อย (หน้าตาเดียวกับหน้าเว็บ ย่อส่วน) ═════════ */
function PanelPreview({ slot, src }: { slot: Slot; src: string | null }) {
  const cols = slot.size === "wide" ? 3 : slot.size === "normal" ? 2 : 1;
  return (
    <div className={css.panel} aria-hidden>
      {src && (
        <div className={`${css.panelSide} ${css[`side_${slot.size}`]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" />
          <strong>{slot.label}</strong>
          <span>{slot.tagline}</span>
        </div>
      )}
      <div className={css.panelCols} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }, (_, c) => (
          <div key={c} className={css.panelCol}>
            <i className={css.colTitle} />
            {Array.from({ length: Math.min(5, Math.ceil(slot.links / cols)) }, (_, r) => (
              <i key={r} style={{ width: `${55 + ((r * 17 + c * 11) % 40)}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════ การ์ดหนึ่งเมนู ═════════ */
function SlotCard({
  slot,
  setting,
  busy,
  justSaved,
  onFile,
  onReset,
}: {
  slot: Slot;
  setting: Setting | undefined;
  busy: boolean;
  justSaved: boolean;
  onFile: (slot: Slot, file: File) => void;
  onReset: (slot: Slot) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const custom = setting?.value || null;
  const shown = custom ?? slot.fallback;

  return (
    <article
      className={`${css.card} ${drag ? css.cardDrag : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(slot, file);
      }}
    >
      <header className={css.cardHead}>
        <div>
          <h2 className={css.cardTitle}>{slot.label}</h2>
          <p className={css.cardMeta}>
            รูปบนหน้าเว็บกว้างสุด {SIZE_PX[slot.size]}px
            {custom && setting?.updatedAt && <> · เปลี่ยนเมื่อ {thaiDate(setting.updatedAt)}</>}
          </p>
        </div>
        {justSaved ? (
          <span className={css.badgeSaved}><Check size={13} /> บันทึกแล้ว</span>
        ) : custom ? (
          <span className={css.badgeCustom}>รูปที่อัปโหลด</span>
        ) : slot.fallback ? (
          <span className={css.badgeDefault}>รูปเริ่มต้น</span>
        ) : (
          <span className={css.badgeNone}>ไม่มีรูป</span>
        )}
      </header>

      <div className={css.stage}>
        <div className={css.thumb}>
          {shown ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shown} alt={`รูปเมนู${slot.label}`} />
          ) : (
            <span className={css.thumbEmpty}><ImageOff size={26} /> ยังไม่มีรูป</span>
          )}
          {busy && <span className={css.thumbBusy}><Loader2 size={24} className={css.spin} /> กำลังอัปโหลด…</span>}
          {drag && <span className={css.thumbDrop}><Upload size={22} /> วางไฟล์เพื่ออัปโหลด</span>}
        </div>
        <div className={css.previewWrap}>
          <span className={css.previewLabel}><LayoutPanelLeft size={13} /> ตัวอย่างเมื่อชี้ที่เมนู “{slot.label}”</span>
          <PanelPreview slot={slot} src={shown} />
          {!shown && <p className={css.previewNote}>ไม่มีรูป — แผงเมนูแสดงเฉพาะรายการลิงก์</p>}
        </div>
      </div>

      <footer className={css.cardFoot}>
        <button type="button" className={css.btnPrimary} onClick={() => input.current?.click()} disabled={busy}>
          <ImagePlus size={15} /> {custom ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </button>
        {custom && (
          <button type="button" className={css.btnGhost} onClick={() => onReset(slot)} disabled={busy}>
            <RotateCcw size={15} /> {slot.fallback ? "ใช้รูปเริ่มต้น" : "ลบรูป"}
          </button>
        )}
        <span className={css.dropHint}>หรือลากไฟล์มาวางที่การ์ดนี้</span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT.join(",")}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(slot, file);
          }}
        />
      </footer>
    </article>
  );
}

/* ═════════ หน้า ═════════ */
export default function MegaImagesPage() {
  const [settings, setSettings] = useState<Record<string, Setting> | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/site-images");
        if (!res.ok) throw new Error();
        const items: Setting[] = await res.json();
        setSettings(Object.fromEntries(items.map((s) => [s.key, s])));
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const store = async (slot: Slot, value: string) => {
    const res = await fetch("/api/admin/site-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: slot.key, value, remark: slot.label }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "บันทึกไม่สำเร็จ");
    const item: Setting = await res.json();
    setSettings((prev) => ({ ...prev, [slot.key]: item }));
    setSaved(slot.key);
    setTimeout(() => setSaved((k) => (k === slot.key ? null : k)), 2500);
  };

  const upload = async (slot: Slot, file: File) => {
    if (!ACCEPT.includes(file.type)) {
      setToast({ text: "รองรับเฉพาะไฟล์ PNG, JPG, WebP, GIF หรือ SVG", error: true });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setToast({ text: `ไฟล์ใหญ่เกิน ${MAX_MB}MB`, error: true });
      return;
    }
    setBusy(slot.key);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "mega-images");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "อัปโหลดไม่สำเร็จ");
      await store(slot, json.url);
      setToast({ text: `เปลี่ยนรูปเมนู${slot.label}แล้ว หน้าเว็บจะอัปเดตภายในราว 5 นาที` });
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ", error: true });
    } finally {
      setBusy(null);
    }
  };

  const reset = async (slot: Slot) => {
    const msg = slot.fallback
      ? `กลับไปใช้รูปเริ่มต้นของเมนู “${slot.label}”?`
      : `ลบรูปของเมนู “${slot.label}”?\nเมนูนี้ไม่มีรูปเริ่มต้น แผงเมนูจะแสดงเฉพาะรายการลิงก์`;
    if (!window.confirm(msg)) return;
    setBusy(slot.key);
    try {
      await store(slot, "");
      setToast({ text: slot.fallback ? `เมนู${slot.label}กลับไปใช้รูปเริ่มต้นแล้ว` : `ลบรูปเมนู${slot.label}แล้ว` });
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ", error: true });
    } finally {
      setBusy(null);
    }
  };

  if (failed) {
    return <div className={css.page}><div className={css.state}><AlertTriangle size={24} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div></div>;
  }
  if (!settings) {
    return <div className={css.page}><div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลด…</div></div>;
  }

  const customCount = SLOTS.filter((s) => settings[s.key]?.value).length;

  return (
    <div className={css.page}>
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><LayoutPanelLeft size={22} /></span>
          <div>
            <h1 className={css.title}>รูปเมนูหลัก</h1>
            <p className={css.subtitle}>รูปในช่องซ้ายของแผงเมนูย่อย ที่ขึ้นเมื่อชี้เมาส์ที่เมนูด้านบนของเว็บ · อัปโหลดแล้ว {customCount} จาก {SLOTS.length} เมนู</p>
          </div>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={css.headLink}>
          <ExternalLink size={15} /> ดูหน้าเว็บ
        </a>
      </header>

      <section className={css.tips}>
        <Info size={18} />
        <ul>
          <li><b>รูปแนะนำ:</b> PNG พื้นโปร่งใส หรือ SVG สัดส่วนจัตุรัส ขนาดประมาณ 440×440px (คมชัดบนจอความละเอียดสูง)</li>
          <li><b>พื้นหลังช่องรูปเป็นสีครีม</b> — รูปที่มีพื้นขาวทึบจะเห็นเป็นกรอบสี่เหลี่ยม</li>
          <li>เปลี่ยนรูปแล้ว หน้าเว็บจะแสดงรูปใหม่ภายในราว 5 นาที</li>
        </ul>
      </section>

      <div className={css.grid}>
        {SLOTS.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            setting={settings[slot.key]}
            busy={busy === slot.key}
            justSaved={saved === slot.key}
            onFile={upload}
            onReset={reset}
          />
        ))}
      </div>

      {toast && <div className={`${css.toast} ${toast.error ? css.toastErr : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}
