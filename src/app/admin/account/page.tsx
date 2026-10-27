"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Circle, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, UserRound } from "lucide-react";
import css from "./page.module.css";

interface Me {
  id: number;
  userName: string;
  fullName: string | null;
  userRole: string | null;
  department: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  lastPasswordChange: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
}

const thaiDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: boolean;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className={css.field}>
      <span>{label}</span>
      <div className={`${css.pwBox} ${error ? css.pwBoxError : ""}`}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error();
        setMe(await res.json());
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  const rules = [
    { ok: next.length >= 8, text: "อย่างน้อย 8 ตัวอักษร" },
    { ok: /[a-zA-Z]/.test(next) && /\d/.test(next), text: "มีทั้งตัวอักษรและตัวเลข" },
    { ok: !!me && next.length > 0 && !next.toLowerCase().includes(me.userName.toLowerCase()), text: "ไม่มีชื่อผู้ใช้อยู่ในรหัสผ่าน" },
    { ok: next.length > 0 && next === confirm, text: "พิมพ์ยืนยันตรงกัน" },
  ];
  const ready = !!current && rules.every((r) => r.ok);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: json.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ", field: json.field });
        return;
      }
      const wasForced = me?.mustChangePassword;
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      setMe((m) => (m ? { ...m, mustChangePassword: false, lastPasswordChange: new Date().toISOString() } : m));
      // แจ้ง AdminShell ให้โหลดเมนูกลับมา
      window.dispatchEvent(new Event("admin:password-changed"));
      if (wasForced) setTimeout(() => router.push("/admin"), 1200);
    } catch {
      setError({ text: "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };

  if (failed) {
    return <div className={css.page}><div className={css.state}><AlertTriangle size={24} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div></div>;
  }
  if (!me) {
    return <div className={css.page}><div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลด…</div></div>;
  }

  const admin = me.userRole === "admin";

  return (
    <div className={css.page}>
      <header className={css.head}>
        <span className={css.headIcon}><UserRound size={22} /></span>
        <div>
          <h1 className={css.title}>บัญชีของฉัน</h1>
          <p className={css.subtitle}>ข้อมูลบัญชีและการเปลี่ยนรหัสผ่าน</p>
        </div>
      </header>

      {me.mustChangePassword && (
        <div className={css.forced} role="alert">
          <KeyRound size={20} />
          <div>
            <strong>ตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน</strong>
            <p>ตอนนี้คุณใช้รหัสผ่านชั่วคราวที่ผู้ดูแลระบบตั้งให้ ตั้งรหัสผ่านของคุณเองด้านล่าง แล้วจึงใช้เมนูอื่นได้</p>
          </div>
        </div>
      )}

      <div className={css.grid}>
        <section className={css.card}>
          <div className={css.profile}>
            <span className={`${css.avatar} ${admin ? css.avatarAdmin : ""}`}>{(me.fullName || me.userName).slice(0, 1).toUpperCase()}</span>
            <div>
              <strong className={css.name}>{me.fullName || me.userName}</strong>
              <span className={css.meta}>@{me.userName}</span>
            </div>
          </div>
          <dl className={css.info}>
            <dt>บทบาท</dt>
            <dd>{admin ? <span className={css.roleAdmin}><ShieldCheck size={13} /> ผู้ดูแลระบบ</span> : "เจ้าหน้าที่"}</dd>
            {me.department && (<><dt>ฝ่าย/แผนก</dt><dd>{me.department}</dd></>)}
            {me.phone && (<><dt>เบอร์โทร</dt><dd>{me.phone}</dd></>)}
            <dt>เข้าใช้ล่าสุด</dt>
            <dd>{me.lastLoginAt ? thaiDate(me.lastLoginAt, true) : "-"}</dd>
            <dt>เข้าใช้ทั้งหมด</dt>
            <dd>{me.loginCount.toLocaleString("th-TH")} ครั้ง</dd>
            <dt>เปลี่ยนรหัสผ่านล่าสุด</dt>
            <dd>{me.mustChangePassword ? <span className={css.warn}>ยังใช้รหัสชั่วคราว</span> : me.lastPasswordChange ? thaiDate(me.lastPasswordChange) : "-"}</dd>
          </dl>
          <p className={css.hint}>ต้องการแก้ชื่อ ฝ่าย หรือสิทธิ์เมนู ติดต่อผู้ดูแลระบบ</p>
        </section>

        <section className={css.card}>
          <h2 className={css.cardTitle}><KeyRound size={17} /> เปลี่ยนรหัสผ่าน</h2>
          {done && !me.mustChangePassword && (
            <p className={css.success}><Check size={16} /> เปลี่ยนรหัสผ่านแล้ว ครั้งหน้าใช้รหัสใหม่ในการเข้าสู่ระบบ</p>
          )}
          <form className={css.form} onSubmit={submit}>
            <PasswordInput
              label={me.mustChangePassword ? "รหัสผ่านชั่วคราวที่ได้รับ" : "รหัสผ่านปัจจุบัน"}
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
              error={error?.field === "currentPassword"}
              autoFocus={me.mustChangePassword}
            />
            <PasswordInput label="รหัสผ่านใหม่" value={next} onChange={setNext} autoComplete="new-password" error={error?.field === "newPassword"} />
            <PasswordInput label="ยืนยันรหัสผ่านใหม่" value={confirm} onChange={setConfirm} autoComplete="new-password" />

            <ul className={css.rules} aria-label="เงื่อนไขรหัสผ่าน">
              {rules.map((r) => (
                <li key={r.text} className={r.ok ? css.ruleOk : ""}>
                  {r.ok ? <Check size={14} /> : <Circle size={14} />} {r.text}
                </li>
              ))}
            </ul>

            {error && <p className={css.error}><AlertTriangle size={14} /> {error.text}</p>}

            <button type="submit" className={css.btnPrimary} disabled={!ready || saving}>
              {saving ? <Loader2 size={16} className={css.spin} /> : <Check size={16} />} บันทึกรหัสผ่านใหม่
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
