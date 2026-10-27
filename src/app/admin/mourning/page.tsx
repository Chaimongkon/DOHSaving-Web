"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Eye, Loader2, Moon, Power, RotateCcw, Save, SunMedium } from "lucide-react";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
interface Saved {
  active: boolean;
  intensity: number;
  bannerText: string;
  endsAt: string | null;
  since: string | null;
  updatedBy: string | null;
  live: boolean;
  updatedAt: string | null;
}

interface Draft {
  intensity: number;
  bannerText: string;
  /** วันปิดอัตโนมัติ YYYY-MM-DD (สิ้นวันตามเวลาไทย) · "" = ไม่กำหนด */
  endDate: string;
}

const TEXT_MAX = 500;
const ORG = "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด";

/** ข้อความสำเร็จรูป — “…” คือส่วนที่ต้องแก้เอง */
const PRESETS: { label: string; text: string }[] = [
  {
    label: "ถวายความอาลัย",
    text: `ข้าพระพุทธเจ้า คณะกรรมการ เจ้าหน้าที่ และสมาชิก ${ORG} น้อมรำลึกในพระมหากรุณาธิคุณอันหาที่สุดมิได้`,
  },
  {
    label: "ไว้อาลัยบุคคล",
    text: `${ORG} ขอแสดงความเสียใจอย่างสุดซึ้ง และร่วมไว้อาลัยแด่ …`,
  },
  {
    label: "เหตุการณ์ / ภัยพิบัติ",
    text: `${ORG} ขอแสดงความเสียใจและร่วมไว้อาลัยต่อผู้สูญเสียจากเหตุการณ์ …`,
  },
];

const INTENSITY: { value: number; label: string }[] = [
  { value: 50, label: "อ่อน" },
  { value: 80, label: "กลาง" },
  { value: 100, label: "ขาว-ดำ" },
];

/* ═════════ วันที่ (เวลาไทย) ═════════ */
const TH = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const todayTh = () => new Date(Date.now() + TH).toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + TH + n * DAY).toISOString().slice(0, 10);
const dateOfIso = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + TH).toISOString().slice(0, 10) : "");
/** สิ้นวันที่เลือก ตามเวลาไทย */
const endOfDayIso = (d: string) => (d ? new Date(`${d}T23:59:59+07:00`).toISOString() : null);
const thaiDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));

const draftOf = (s: Saved): Draft => ({ intensity: s.intensity, bannerText: s.bannerText, endDate: dateOfIso(s.endsAt) });

/* ═════════ ตัวอย่างหน้าเว็บ ═════════ */
function SitePreview({ draft, colorful }: { draft: Draft; colorful: boolean }) {
  return (
    <div className={css.browser} aria-label="ตัวอย่างหน้าเว็บเมื่อเปิดโหมดไว้อาลัย">
      <div className={css.browserBar}>
        <i /><i /><i />
        <span>dohsaving.com</span>
      </div>
      <div className={css.site} style={{ filter: colorful ? "none" : `grayscale(${draft.intensity}%)` }}>
        {draft.bannerText.trim() && <div className={css.siteBanner}>{draft.bannerText.trim()}</div>}
        <div className={css.siteHeader}>
          <span className={css.siteLogo} />
          <span className={css.siteName} />
          <span className={css.siteMenu}><i /><i /><i /><i /></span>
        </div>
        <div className={css.siteHero}>
          <div className={css.siteHeroText}>
            <span className={css.lineLg} />
            <span className={css.lineMd} />
            <span className={css.siteBtn}>สมัครสมาชิก</span>
          </div>
          <span className={css.siteHeroArt} />
        </div>
        <div className={css.siteCards}>
          <span className={css.cardBlue} />
          <span className={css.cardGold} />
          <span className={css.cardGreen} />
        </div>
      </div>
    </div>
  );
}

/* ═════════ หน้า ═════════ */
export default function AdminMourningPage() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [draft, setDraft] = useState<Draft>({ intensity: 100, bannerText: "", endDate: "" });
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<"save" | "toggle" | null>(null);
  const [colorful, setColorful] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/mourning-mode", { credentials: "include" });
        if (!res.ok) throw new Error();
        const s: Saved = await res.json();
        setSaved(s);
        setDraft(draftOf(s));
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const dirty = useMemo(() => {
    if (!saved) return false;
    const base = draftOf(saved);
    return base.intensity !== draft.intensity || base.bannerText !== draft.bannerText.trim() || base.endDate !== draft.endDate;
  }, [saved, draft]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async (active: boolean, kind: "save" | "toggle") => {
    setBusy(kind);
    try {
      const res = await fetch("/api/admin/mourning-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active, intensity: draft.intensity, bannerText: draft.bannerText, endsAt: endOfDayIso(draft.endDate) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ text: json.error || "บันทึกไม่สำเร็จ", error: true });
        return;
      }
      setSaved(json);
      setDraft(draftOf(json));
      setToast({
        text: kind === "toggle" ? (active ? "เปิดโหมดไว้อาลัยแล้ว หน้าเว็บจะเปลี่ยนภายในราว 1 นาที" : "ปิดโหมดไว้อาลัยแล้ว") : "บันทึกแล้ว",
      });
    } catch {
      setToast({ text: "เชื่อมต่อไม่สำเร็จ", error: true });
    } finally {
      setBusy(null);
    }
  };

  const toggle = () => {
    if (!saved) return;
    const turnOn = !saved.live;
    const msg = turnOn
      ? `เปิดโหมดไว้อาลัยบนหน้าเว็บตอนนี้?\n\n• หน้าเว็บเป็นโทนขาว-ดำ ${draft.intensity}%${draft.intensity < 30 ? " (ต่ำมาก แทบไม่เปลี่ยนสี)" : ""}\n• ${draft.bannerText.trim() ? "แสดงแถบข้อความด้านบน" : "ไม่มีแถบข้อความ (ยังไม่ได้ใส่ข้อความ)"}\n• ${draft.endDate ? `ปิดอัตโนมัติ ${thaiDate(endOfDayIso(draft.endDate)!)}` : "ไม่มีวันปิดอัตโนมัติ ต้องกลับมาปิดเอง"}\n• ธีมเทศกาลจะถูกซ่อนระหว่างนี้`
      : "ปิดโหมดไว้อาลัย ให้หน้าเว็บกลับเป็นสีปกติ?";
    if (window.confirm(msg)) submit(turnOn, "toggle");
  };

  if (failed) {
    return (
      <div className={css.page}>
        <div className={css.state}><AlertTriangle size={26} /> โหลดค่าไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div>
      </div>
    );
  }
  if (!saved) {
    return (
      <div className={css.page}>
        <div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลด…</div>
      </div>
    );
  }

  const expired = saved.active && !saved.live && !!saved.endsAt;
  const hasEllipsis = draft.bannerText.includes("…");

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Moon size={22} /></span>
          <div>
            <h1 className={css.title}>โหมดไว้อาลัย</h1>
            <p className={css.subtitle}>ปรับหน้าเว็บสาธารณะเป็นโทนขาว-ดำ พร้อมแถบข้อความด้านบนสุด · ไม่มีผลกับหน้า admin</p>
          </div>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={css.headLink}>
          <Eye size={15} /> ดูหน้าเว็บ
        </a>
      </header>

      {/* ── สถานะตอนนี้ ── */}
      <section className={`${css.status} ${saved.live ? css.statusLive : ""}`}>
        <div className={css.statusMain}>
          <span className={css.statusDot} aria-hidden />
          <div>
            <h2 className={css.statusTitle}>{saved.live ? "กำลังแสดงบนหน้าเว็บ" : "ปิดอยู่ · หน้าเว็บแสดงสีปกติ"}</h2>
            <p className={css.statusMeta}>
              {saved.live ? (
                <>
                  {saved.since && <>เปิดตั้งแต่ {thaiDate(saved.since, true)}</>}
                  {saved.updatedBy && <> · โดย {saved.updatedBy}</>}
                </>
              ) : expired ? (
                <>ปิดอัตโนมัติแล้วเมื่อ {thaiDate(saved.endsAt!, true)}</>
              ) : (
                <>เปิดเมื่อมีเหตุการณ์ที่ต้องแสดงความไว้อาลัย ตั้งข้อความและวันปิดอัตโนมัติด้านล่างก่อนเปิด</>
              )}
            </p>
            {saved.live && (
              <p className={saved.endsAt ? css.statusEnd : css.statusWarn}>
                <CalendarClock size={14} />
                {saved.endsAt
                  ? `ปิดอัตโนมัติ ${thaiDate(saved.endsAt)} (อีก ${daysLeft(saved.endsAt)} วัน)`
                  : "ยังไม่กำหนดวันปิด — ต้องกลับมาปิดเอง"}
              </p>
            )}
          </div>
        </div>
        <button type="button" className={saved.live ? css.offBtn : css.onBtn} onClick={toggle} disabled={busy !== null}>
          {busy === "toggle" ? <Loader2 size={17} className={css.spin} /> : <Power size={17} />}
          {saved.live ? "ปิดโหมดไว้อาลัย" : "เปิดโหมดไว้อาลัย"}
        </button>
      </section>
      {saved.live && <p className={css.note}>ระหว่างเปิด ธีมเทศกาลทั้งหมดจะถูกซ่อน · การเปลี่ยนแปลงมีผลกับหน้าเว็บภายในราว 1 นาที</p>}

      <div className={css.grid}>
        {/* ── ตั้งค่า ── */}
        <section className={css.card}>
          <div className={css.block}>
            <div className={css.blockHead}>
              <h3 className={css.blockTitle}>ข้อความแถบไว้อาลัย</h3>
              <span className={css.counter}>{draft.bannerText.length} / {TEXT_MAX}</span>
            </div>
            <div className={css.presets}>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className={css.preset} onClick={() => set("bannerText", p.text)}>
                  {p.label}
                </button>
              ))}
              {draft.bannerText && (
                <button type="button" className={css.presetGhost} onClick={() => set("bannerText", "")}>ล้างข้อความ</button>
              )}
            </div>
            <textarea
              className={css.textarea}
              rows={3}
              maxLength={TEXT_MAX}
              value={draft.bannerText}
              onChange={(e) => set("bannerText", e.target.value)}
              placeholder="เลือกข้อความสำเร็จรูปด้านบน หรือพิมพ์เอง · เว้นว่าง = ไม่แสดงแถบ"
              aria-label="ข้อความแถบไว้อาลัย"
            />
            {hasEllipsis && <p className={css.warnLine}><AlertTriangle size={14} /> แทน “…” ด้วยชื่อบุคคลหรือเหตุการณ์ก่อนบันทึก</p>}
            <p className={css.hint}>ข้อความถวายความอาลัยควรตรวจถ้อยคำกับประกาศทางการก่อนใช้</p>
          </div>

          <div className={css.block}>
            <div className={css.blockHead}>
              <h3 className={css.blockTitle}>ความเข้มขาว-ดำ</h3>
              <span className={css.value}>{draft.intensity}%</span>
            </div>
            <div className={css.seg} role="group" aria-label="ความเข้มขาว-ดำ">
              {INTENSITY.map((o) => (
                <button key={o.value} type="button" aria-pressed={draft.intensity === o.value} className={draft.intensity === o.value ? css.segOn : ""} onClick={() => set("intensity", o.value)}>
                  {o.label} <small>{o.value}%</small>
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.intensity}
              onChange={(e) => set("intensity", parseInt(e.target.value, 10) || 0)}
              className={css.slider}
              aria-label="ปรับความเข้มขาว-ดำ"
            />
            {draft.intensity < 30 && (
              <p className={css.warnLine}><AlertTriangle size={14} /> ความเข้มต่ำมาก หน้าเว็บแทบไม่เปลี่ยนสี แนะนำ 100%</p>
            )}
          </div>

          <div className={css.block}>
            <div className={css.blockHead}>
              <h3 className={css.blockTitle}>ปิดอัตโนมัติ</h3>
              {draft.endDate && <span className={css.value}>{thaiDate(endOfDayIso(draft.endDate)!)}</span>}
            </div>
            <div className={css.seg} role="group" aria-label="ปิดอัตโนมัติ">
              <button type="button" aria-pressed={!draft.endDate} className={!draft.endDate ? css.segOn : ""} onClick={() => set("endDate", "")}>ไม่กำหนด</button>
              {[7, 15, 30].map((n) => {
                const d = plusDays(n);
                return (
                  <button key={n} type="button" aria-pressed={draft.endDate === d} className={draft.endDate === d ? css.segOn : ""} onClick={() => set("endDate", d)}>
                    {n} วัน
                  </button>
                );
              })}
            </div>
            <label className={css.dateRow}>
              <span>หรือเลือกวัน</span>
              <input type="date" min={todayTh()} value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} className={css.date} />
            </label>
            <p className={css.hint}>ปิดเมื่อสิ้นวันที่เลือก (เวลาไทย) กันลืมปิด แนะนำให้กำหนดทุกครั้ง</p>
          </div>
        </section>

        {/* ── ตัวอย่าง ── */}
        <section className={css.card}>
          <div className={css.blockHead}>
            <h3 className={css.blockTitle}>ตัวอย่างหน้าเว็บ {dirty && <span className={css.draftTag}>ยังไม่บันทึก</span>}</h3>
            <button
              type="button"
              className={css.compare}
              onPointerDown={() => setColorful(true)}
              onPointerUp={() => setColorful(false)}
              onPointerLeave={() => setColorful(false)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setColorful(true)}
              onKeyUp={() => setColorful(false)}
            >
              <SunMedium size={14} /> กดค้างเพื่อเทียบสีปกติ
            </button>
          </div>
          <SitePreview draft={draft} colorful={colorful} />
          {!draft.bannerText.trim() && <p className={css.hint}>ยังไม่มีข้อความ — หน้าเว็บจะเป็นขาว-ดำอย่างเดียว ไม่มีแถบ</p>}
        </section>
      </div>

      {/* ── แถบบันทึก ── */}
      {dirty && (
        <div className={css.saveBar} role="region" aria-label="บันทึกการแก้ไข">
          <span>
            มีการแก้ไขที่ยังไม่บันทึก
            {saved.live && <small> · บันทึกแล้วหน้าเว็บจะเปลี่ยนตาม</small>}
          </span>
          <div className={css.saveActions}>
            <button type="button" className={css.ghostBtn} onClick={() => setDraft(draftOf(saved))} disabled={busy !== null}>
              <RotateCcw size={15} /> ยกเลิก
            </button>
            <button type="button" className={css.saveBtn} onClick={() => submit(saved.live, "save")} disabled={busy !== null}>
              {busy === "save" ? <Loader2 size={15} className={css.spin} /> : <Save size={15} />} บันทึก
            </button>
          </div>
        </div>
      )}

      {toast && <div className={`${css.toast} ${toast.error ? css.toastErr : ""} ${dirty ? css.toastUp : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}
