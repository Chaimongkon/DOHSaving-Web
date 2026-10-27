"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
type Toggles = { complaint: boolean; question: boolean; reply: boolean; digest: boolean };

interface Status {
  telegram: {
    configured: boolean;
    chats: number;
    siteUrl: boolean;
    toggles: Toggles;
    digestHour: number;
    lastDigest: string | null;
    lastDelivery: { at: string; ok: boolean; error: string | null } | null;
  };
  system: {
    db: { ok: boolean; ms: number };
    node: string;
    env: string;
    uptimeSec: number;
    trustProxy: boolean;
    ipUnknownRate: number | null;
    ipSample: number;
  };
  storage: {
    folders: { name: string; bytes: number; files: number }[];
    total: number;
    files: number;
    disk: { free: number; size: number } | null;
  };
  retention: { years: number; lastRun: { at: string; visits: number; consents: number; events: number } | null; stale: boolean };
}

const EVENTS: { key: keyof Toggles; label: string; hint: string }[] = [
  { key: "complaint", label: "เรื่องร้องเรียน/เสนอแนะใหม่", hint: "ส่งทันทีเมื่อสมาชิกส่งเรื่องเข้ามา" },
  { key: "question", label: "คำถามใหม่ในกระดานถาม-ตอบ", hint: "ส่งทันทีเมื่อมีคนตั้งกระทู้" },
  { key: "reply", label: "สมาชิกถามต่อในกระทู้", hint: "ส่งเมื่อสมาชิกตอบกลับในกระทู้เดิม" },
  { key: "digest", label: "สรุปงานค้างประจำวัน", hint: "จันทร์–ศุกร์ หลัง 08:00 น. เฉพาะวันที่มีงานค้าง" },
];

/* ═════════ ตัวช่วย ═════════ */
const fmt = (n: number) => n.toLocaleString("th-TH");
const bytes = (n: number) => {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
};
const thaiDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const thaiDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00+07:00`).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", year: "2-digit" });
function uptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d ? `${d} วัน ${h} ชม.` : h ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}
/** ชื่อโฟลเดอร์ในพื้นที่อัปโหลด → ชื่อที่อ่านเข้าใจ */
const FOLDER_LABELS: Record<string, string> = {
  news: "ข่าว",
  "news-pdf": "ข่าว (PDF)",
  forms: "แบบฟอร์ม",
  regulations: "ข้อบังคับ/ระเบียบ",
  "annual-reports": "รายงานประจำปี",
  "meeting-documents": "เอกสารประชุม",
  "financial-summary": "สินทรัพย์และหนี้สิน",
  slides: "สไลด์",
  notifications: "ป๊อปอัพ",
  "activity-albums": "อัลบั้มกิจกรรม",
  "activity-photos": "ภาพกิจกรรม",
  "service-pages": "หน้าบริการ",
  "app-guide": "วิธีใช้งาน App",
  "download-app": "ดาวน์โหลดแอป",
  "mega-images": "รูปเมนูหลัก",
  "festival-icons": "ไอคอนเทศกาล",
  "festival-logo": "โลโก้เทศกาล",
  "bank-logos": "โลโก้ธนาคาร",
  pages: "หน้าเพจ",
  lottie: "แอนิเมชัน",
  general: "ทั่วไป",
};

function Row({ ok, warn, label, value, hint }: { ok: boolean; warn?: boolean; label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className={css.check}>
      <span className={ok ? (warn ? css.iconWarn : css.iconOk) : css.iconBad}>
        {ok && !warn ? <CheckCircle2 size={18} /> : ok ? <AlertTriangle size={18} /> : <XCircle size={18} />}
      </span>
      <div className={css.checkBody}>
        <div className={css.checkHead}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
        {hint && <p className={css.checkHint}>{hint}</p>}
      </div>
    </div>
  );
}

/* ═════════ หน้า ═════════ */
export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof Toggles | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      setStatus(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดสถานะเมื่อเปิดหน้า
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = async (key: keyof Toggles) => {
    if (!status) return;
    const next = { ...status.telegram.toggles, [key]: !status.telegram.toggles[key] };
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram: next }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setStatus((s) => (s ? { ...s, telegram: { ...s.telegram, toggles: json.toggles } } : s));
      const ev = EVENTS.find((e) => e.key === key)!;
      setToast({ text: `${next[key] ? "เปิด" : "ปิด"}การแจ้งเตือน “${ev.label}” แล้ว` });
    } catch {
      setToast({ text: "บันทึกไม่สำเร็จ", error: true });
    } finally {
      setSavingKey(null);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "telegram-test" }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.lastDelivery) setStatus((s) => (s ? { ...s, telegram: { ...s.telegram, lastDelivery: json.lastDelivery } } : s));
      setToast(
        res.ok
          ? { text: "ส่งข้อความทดสอบแล้ว ตรวจในห้อง Telegram ได้เลย" }
          : { text: json.lastDelivery?.error || json.error || "ส่งไม่สำเร็จ", error: true }
      );
    } catch {
      setToast({ text: "เชื่อมต่อไม่สำเร็จ", error: true });
    } finally {
      setTesting(false);
    }
  };

  if (failed && !status) {
    return <div className={css.page}><div className={css.state}><AlertTriangle size={24} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div></div>;
  }
  if (!status) {
    return <div className={css.page}><div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังตรวจสถานะระบบ…</div></div>;
  }

  const { telegram: tg, system: sys, storage, retention } = status;
  const ipBad = sys.ipUnknownRate !== null && sys.ipUnknownRate > 0.3;
  const diskUsed = storage.disk ? 1 - storage.disk.free / storage.disk.size : null;
  const maxFolder = Math.max(1, ...storage.folders.map((f) => f.bytes));

  return (
    <div className={css.page}>
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Settings size={22} /></span>
          <div>
            <h1 className={css.title}>ตั้งค่าระบบ</h1>
            <p className={css.subtitle}>การแจ้งเตือนเจ้าหน้าที่ทาง Telegram และสถานะการทำงานของเว็บ · เฉพาะผู้ดูแลระบบ</p>
          </div>
        </div>
        <button type="button" className={css.headBtn} onClick={load} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? css.spin : undefined} /> ตรวจใหม่
        </button>
      </header>

      <div className={css.grid}>
        {/* ═══ Telegram ═══ */}
        <section className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}><BellRing size={17} /> การแจ้งเตือน Telegram</h2>
            {tg.configured ? (
              <span className={css.pillOk}>เชื่อมต่อแล้ว · {tg.chats} ห้อง</span>
            ) : (
              <span className={css.pillOff}>ยังไม่ได้ตั้งค่า</span>
            )}
          </div>

          {tg.configured ? (
            <>
              <div className={css.testRow}>
                <div>
                  <strong>ส่งข้อความทดสอบ</strong>
                  <p className={css.muted}>
                    {tg.lastDelivery ? (
                      tg.lastDelivery.ok ? (
                        <>ส่งได้ล่าสุด {thaiDateTime(tg.lastDelivery.at)}</>
                      ) : (
                        <span className={css.bad}>ส่งไม่สำเร็จ {thaiDateTime(tg.lastDelivery.at)} · {tg.lastDelivery.error}</span>
                      )
                    ) : (
                      "ยังไม่มีการส่งตั้งแต่เซิร์ฟเวอร์เริ่มทำงานรอบนี้"
                    )}
                  </p>
                </div>
                <button type="button" className={css.btnPrimary} onClick={test} disabled={testing}>
                  {testing ? <Loader2 size={15} className={css.spin} /> : <Send size={15} />} ส่งทดสอบ
                </button>
              </div>

              <ul className={css.toggles}>
                {EVENTS.map((ev) => (
                  <li key={ev.key}>
                    <label className={css.toggle}>
                      <span className={css.toggleText}>
                        <strong>{ev.label}</strong>
                        <small>
                          {ev.hint}
                          {ev.key === "digest" && tg.lastDigest && <> · ส่งล่าสุด {thaiDay(tg.lastDigest)}</>}
                        </small>
                      </span>
                      <input type="checkbox" checked={tg.toggles[ev.key]} disabled={savingKey !== null} onChange={() => toggle(ev.key)} />
                      <span className={css.switchUi} aria-hidden>{savingKey === ev.key && <Loader2 size={12} className={css.spin} />}</span>
                    </label>
                  </li>
                ))}
              </ul>

              {!tg.siteUrl && (
                <p className={css.warnBox}>
                  <AlertTriangle size={15} /> ยังไม่ได้ตั้ง <code>NEXT_PUBLIC_SITE_URL</code> ข้อความแจ้งเตือนจึงไม่มีลิงก์เข้าหน้าหลังบ้าน
                </p>
              )}
              <p className={css.muted}>ข้อความไม่มีชื่อ เบอร์โทร หรือเลขสมาชิก ส่งเฉพาะหัวข้อพร้อมลิงก์ให้เข้ามาดูในระบบ</p>
            </>
          ) : (
            <div className={css.setup}>
              <p>เมื่อตั้งค่าแล้ว เจ้าหน้าที่จะได้รับข้อความทันทีที่มีเรื่องร้องเรียนหรือคำถามใหม่ และสรุปงานค้างทุกเช้าวันทำการ</p>
              <ol>
                <li>สร้างบอทกับ <b>@BotFather</b> ใน Telegram แล้วคัดลอก Token</li>
                <li>เพิ่มบอทเข้ากลุ่มของเจ้าหน้าที่ แล้วหา Chat ID ของกลุ่ม</li>
                <li>ใส่ <code>TELEGRAM_BOT_TOKEN</code> และ <code>TELEGRAM_CHAT_ID</code> ในไฟล์ <code>.env</code> บนเซิร์ฟเวอร์ แล้วรีสตาร์ตเว็บ</li>
              </ol>
              <p className={css.muted}>รายละเอียดอยู่ในไฟล์ DEPLOY.md · Token เป็นความลับ จึงตั้งที่เซิร์ฟเวอร์เท่านั้น ไม่แก้ผ่านหน้าเว็บ</p>
            </div>
          )}
        </section>

        {/* ═══ สถานะระบบ ═══ */}
        <section className={css.card}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}><Server size={17} /> สถานะระบบ</h2>
            <span className={css.muted}>ทำงานต่อเนื่อง {uptime(sys.uptimeSec)}</span>
          </div>

          <div className={css.checks}>
            <Row
              ok={sys.db.ok}
              warn={sys.db.ok && sys.db.ms > 500}
              label="ฐานข้อมูล"
              value={sys.db.ok ? `ปกติ · ${fmt(sys.db.ms)} ms` : "เชื่อมต่อไม่ได้"}
              hint={sys.db.ok && sys.db.ms > 500 ? "ตอบช้ากว่าปกติ ถ้าเป็นต่อเนื่องให้ตรวจเซิร์ฟเวอร์ฐานข้อมูล" : undefined}
            />
            <Row
              ok
              warn={ipBad || !sys.trustProxy}
              label="การอ่าน IP ผู้เข้าชม"
              value={sys.ipUnknownRate === null ? "ยังไม่มีข้อมูล" : `อ่านไม่ได้ ${Math.round(sys.ipUnknownRate * 100)}%`}
              hint={
                !sys.trustProxy ? (
                  <>ยังไม่ได้ตั้ง <code>TRUST_PROXY_HEADERS=true</code> — ถ้าเว็บอยู่หลัง IIS ให้ตั้งใน .env แล้วรีสตาร์ต (ใช้กับบันทึกความยินยอมและกันการส่งซ้ำ)</>
                ) : ipBad ? (
                  "ตั้งค่าแล้วแต่ยังอ่าน IP ไม่ได้มาก — ตรวจว่า IIS ส่ง X-Forwarded-For มาด้วย"
                ) : (
                  `จากการเข้าชม 7 วันล่าสุด ${fmt(sys.ipSample)} ครั้ง`
                )
              }
            />
            <Row
              ok
              warn={retention.stale}
              label={`ลบข้อมูลเกิน ${retention.years} ปี (PDPA)`}
              value={retention.lastRun ? thaiDateTime(retention.lastRun.at) : "ยังไม่มีบันทึก"}
              hint={
                retention.lastRun ? (
                  <>
                    <Trash2 size={12} /> ครั้งล่าสุดลบ ประวัติเข้าชม {fmt(retention.lastRun.visits)} · ความยินยอม {fmt(retention.lastRun.consents)} ·
                    เหตุการณ์ {fmt(retention.lastRun.events)} รายการ · ทำงานอัตโนมัติวันละครั้ง
                  </>
                ) : (
                  "ระบบจะลบอัตโนมัติวันละครั้งเมื่อมีผู้เข้าชมเว็บ — บันทึกจะขึ้นหลังรอบแรก"
                )
              }
            />
            <Row ok label="เวอร์ชันระบบ" value={`Node ${sys.node}`} hint={sys.env === "production" ? "โหมดใช้งานจริง" : `โหมด ${sys.env}`} />
          </div>
        </section>

        {/* ═══ พื้นที่จัดเก็บไฟล์ ═══ */}
        <section className={`${css.card} ${css.wide}`}>
          <div className={css.cardHead}>
            <h2 className={css.cardTitle}><HardDrive size={17} /> พื้นที่ไฟล์อัปโหลด</h2>
            <span className={css.muted}>{bytes(storage.total)} · {fmt(storage.files)} ไฟล์</span>
          </div>

          {storage.disk && diskUsed !== null && (
            <div className={css.disk}>
              <div className={css.diskHead}>
                <span><Database size={14} /> ดิสก์ของเซิร์ฟเวอร์</span>
                <strong className={diskUsed > 0.9 ? css.bad : undefined}>
                  ว่าง {bytes(storage.disk.free)} จาก {bytes(storage.disk.size)}
                </strong>
              </div>
              <span className={css.meter}><span className={diskUsed > 0.9 ? css.meterBad : diskUsed > 0.75 ? css.meterWarn : ""} style={{ width: `${Math.round(diskUsed * 100)}%` }} /></span>
              {diskUsed > 0.9 && <p className={css.warnBox}><AlertTriangle size={15} /> ดิสก์ใกล้เต็ม อัปโหลดไฟล์ใหม่อาจล้มเหลว</p>}
            </div>
          )}

          {storage.folders.length === 0 ? (
            <p className={css.muted}>ยังไม่มีไฟล์อัปโหลด</p>
          ) : (
            <ul className={css.folders}>
              {storage.folders.map((f) => (
                <li key={f.name}>
                  <span className={css.folderName}>{FOLDER_LABELS[f.name] ?? f.name}</span>
                  <span className={css.folderBar}><span style={{ width: `${Math.max(2, (f.bytes / maxFolder) * 100)}%` }} /></span>
                  <span className={css.folderSize}>{bytes(f.bytes)}</span>
                  <span className={css.folderFiles}>{fmt(f.files)} ไฟล์</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className={css.footNote}><ShieldCheck size={14} /> ค่าที่เป็นความลับ (รหัสฐานข้อมูล Token) ตั้งในไฟล์ .env บนเซิร์ฟเวอร์เท่านั้น หน้านี้แสดงแค่สถานะ</p>

      {toast && <div className={`${css.toast} ${toast.error ? css.toastErr : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}
