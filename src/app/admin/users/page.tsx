"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { permissionGroups } from "../adminNav";
import css from "./page.module.css";

/* ═════════ ชนิดข้อมูล ═════════ */
interface UserRecord {
  id: number;
  fullName: string | null;
  userName: string;
  userRole: string | null;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  menuPermissions: string[] | null;
  lastLoginAt: string | null;
  loginCount: number;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  lastPasswordChange: string | null;
  createdAt: string;
}

type RoleKind = "admin" | "staff";
type Filter = "all" | "admin" | "staff" | "attention";

interface Draft {
  fullName: string;
  userName: string;
  password: string;
  department: string;
  phone: string;
  role: RoleKind;
  isActive: boolean;
  perms: Set<string>;
}

/* ═════════ สิทธิ์สำเร็จรูป ═════════ */
const ROLE_PRESETS: Record<string, string[]> = {
  ฝ่ายสวัสดิการ: [
    "/admin/news", "/admin/videos", "/admin/photo-albums", "/admin/member-media",
    "/admin/slides", "/admin/notifications", "/admin/service-pages", "/admin/app-guide", "/admin/download-app",
    "/admin/forms", "/admin/search-insights",
    "/admin/qna",
  ],
  ฝ่ายบริหาร: [
    "/admin/news", "/admin/videos", "/admin/photo-albums", "/admin/member-media",
    "/admin/slides", "/admin/notifications", "/admin/service-pages", "/admin/app-guide", "/admin/download-app",
    "/admin/regulations", "/admin/forms", "/admin/annual-reports", "/admin/meeting-documents", "/admin/search-insights",
    "/admin/pages/history", "/admin/chairman-message", "/admin/vision-data",
    "/admin/policy-items", "/admin/ethics-board-items", "/admin/ethics-staff-items",
    "/admin/board-members", "/admin/auditors", "/admin/department-staff", "/admin/pages/organization/images",
    "/admin/qna", "/admin/complaints",
    "/admin/contact-info", "/admin/departments", "/admin/line-contacts", "/admin/bank-accounts",
  ],
  ฝ่ายบัญชี: ["/admin/financial-summary"],
  ฝ่ายสินเชื่อ: ["/admin/interest-rates", "/admin/loan-types"],
};

const ALL_PERMS = permissionGroups.flatMap((g) => g.items.map((i) => i.href));
const PERM_LABEL = new Map(permissionGroups.flatMap((g) => g.items.map((i) => [i.href, i.label] as const)));

/* ═════════ ตัวช่วย ═════════ */
const fmt = (n: number) => n.toLocaleString("th-TH");
const nameOf = (u: UserRecord) => u.fullName || u.userName;
const initials = (u: UserRecord) => nameOf(u).trim().slice(0, 1).toUpperCase();
const isLocked = (u: UserRecord, now: number) => !!u.lockedUntil && new Date(u.lockedUntil).getTime() > now;
const roleOf = (u: UserRecord): RoleKind => (u.userRole === "admin" ? "admin" : "staff");
const time = (iso: string) => new Date(iso).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
const date = (iso: string) => new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" });

function lastSeen(iso: string | null, now: number): string {
  if (!iso) return "ยังไม่เคยเข้าใช้";
  const days = Math.floor((now - new Date(iso).getTime()) / 864e5);
  if (days < 1) return `วันนี้ ${time(iso)}`;
  if (days < 2) return "เมื่อวาน";
  if (days < 30) return `${days} วันก่อน`;
  return date(iso);
}

/** ต้องดูแล: ถูกล็อก · ยังไม่เคยเข้าใช้ · ไม่ได้เข้าใช้เกิน 90 วัน */
const needsAttention = (u: UserRecord, now: number) =>
  u.isActive && (isLocked(u, now) || !u.lastLoginAt || now - new Date(u.lastLoginAt).getTime() > 90 * 864e5);

/** รหัสผ่านสุ่ม 10 ตัว (ไม่มีตัวที่สับสนง่าย เช่น 0/O 1/l) มีทั้งตัวอักษรและตัวเลข */
function randomPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + digits;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(letters), pick(digits), ...Array.from({ length: 8 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const emptyDraft = (): Draft => ({
  fullName: "",
  userName: "",
  password: randomPassword(),
  department: "",
  phone: "",
  role: "staff",
  isActive: true,
  perms: new Set(),
});

const draftOf = (u: UserRecord): Draft => ({
  fullName: u.fullName ?? "",
  userName: u.userName,
  password: "",
  department: u.department ?? "",
  phone: u.phone ?? "",
  role: roleOf(u),
  isActive: u.isActive,
  perms: new Set(u.menuPermissions ?? []),
});

/* ═════════ ประวัติล่าสุด (โหลดเมื่อกดเปิด) ═════════ */
interface ActivityItem {
  id: number;
  at: string;
  action: string;
  label: string;
  section: string;
  by: string | null;
  ip: string | null;
  count: number;
  kind: "self" | "account";
}

function Activity({ userId }: { userId: number }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    if (items || failed) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`);
      if (!res.ok) throw new Error();
      setItems((await res.json()).items);
    } catch {
      setFailed(true);
    }
  };

  return (
    <details className={css.section} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && load()}>
      <summary className={css.activitySummary}>
        <History size={16} /> ประวัติล่าสุด
        <small>เข้าสู่ระบบ · แก้ไขข้อมูล · การเปลี่ยนแปลงบัญชีนี้</small>
      </summary>
      {failed ? (
        <p className={css.hint}>โหลดประวัติไม่สำเร็จ</p>
      ) : !items ? (
        <p className={css.hint}><Loader2 size={14} className={css.spin} /> กำลังโหลด…</p>
      ) : items.length === 0 ? (
        <p className={css.hint}>ยังไม่มีประวัติ</p>
      ) : (
        <ol className={css.timeline}>
          {items.map((it) => (
            <li key={it.id} className={`${css.tlItem} ${it.kind === "account" ? css.tlAccount : ""} ${it.action === "login_failed" || it.action === "delete" ? css.tlWarn : ""}`}>
              <span className={css.tlTime}>{date(it.at)} {time(it.at)}</span>
              <span className={css.tlText}>
                <strong>{it.label}</strong>
                {it.section && <> · {it.section}</>}
                {it.count > 1 && <span className={css.tlCount}>×{it.count}</span>}
                {it.by && <span className={css.tlBy}>โดย {it.by}</span>}
                {it.ip && <span className={css.tlIp}>IP {it.ip}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}

/* ═════════ แผงแก้ไข ═════════ */
function Editor({
  user,
  isSelf,
  users,
  onClose,
  onSaved,
}: {
  user: UserRecord | null;
  isSelf: boolean;
  users: UserRecord[];
  onClose: () => void;
  onSaved: (msg: string, password?: { userName: string; password: string }) => void;
}) {
  const [d, setD] = useState<Draft>(() => (user ? draftOf(user) : emptyDraft()));
  const [showPw, setShowPw] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (href: string) =>
    setD((p) => {
      const perms = new Set(p.perms);
      if (perms.has(href)) perms.delete(href);
      else perms.add(href);
      return { ...p, perms };
    });
  const toggleGroup = (hrefs: string[]) =>
    setD((p) => {
      const perms = new Set(p.perms);
      const all = hrefs.every((h) => perms.has(h));
      hrefs.forEach((h) => (all ? perms.delete(h) : perms.add(h)));
      return { ...p, perms };
    });

  const copyFrom = users.filter((u) => u.id !== user?.id && roleOf(u) === "staff" && (u.menuPermissions ?? []).length > 0);
  const selected = ALL_PERMS.filter((h) => d.perms.has(h)).length;

  const save = async () => {
    setError("");
    if (!d.fullName.trim()) return setError("กรุณากรอกชื่อ-นามสกุล");
    if (!user && !/^[a-z0-9._-]{3,50}$/.test(d.userName.trim().toLowerCase())) return setError("ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–50 ตัว");
    if (!user && (d.password.length < 8 || !/[a-zA-Z]/.test(d.password) || !/\d/.test(d.password))) {
      return setError("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรและตัวเลข");
    }
    if (d.role === "staff" && selected === 0 && !window.confirm("ยังไม่ได้ให้สิทธิ์เมนูใดเลย ผู้ใช้จะเห็นแค่แดชบอร์ด บันทึกต่อไหม?")) return;

    // เจ้าหน้าที่เดิมที่เป็น viewer คงบทบาทเดิมไว้ (ทำงานเหมือน editor)
    const userRole = d.role === "admin" ? "admin" : user && user.userRole !== "admin" && user.userRole ? user.userRole : "editor";
    const body: Record<string, unknown> = {
      fullName: d.fullName,
      department: d.department,
      phone: d.phone,
      userRole,
      isActive: d.isActive,
      menuPermissions: d.role === "admin" ? [] : [...d.perms],
    };
    if (!user) {
      body.userName = d.userName.trim().toLowerCase();
      body.password = d.password;
    }

    setSaving(true);
    try {
      const res = await fetch(user ? `/api/admin/users/${user.id}` : "/api/admin/users", {
        method: user ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error || "บันทึกไม่สำเร็จ");
      onSaved(user ? `บันทึก ${d.fullName} แล้ว` : `สร้างบัญชี ${d.fullName} แล้ว`, user ? undefined : { userName: json.userName, password: d.password });
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={css.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={css.drawer} role="dialog" aria-modal="true" aria-label={user ? `แก้ไข ${nameOf(user)}` : "เพิ่มผู้ใช้"}>
        <header className={css.drawerHead}>
          <div>
            <h2 className={css.drawerTitle}>{user ? `แก้ไข ${nameOf(user)}` : "เพิ่มผู้ใช้"}</h2>
            {user && <p className={css.drawerSub}>@{user.userName}{isSelf && " · บัญชีของคุณ"}</p>}
          </div>
          <button type="button" className={css.iconBtn} onClick={onClose} aria-label="ปิด"><X size={18} /></button>
        </header>

        <div className={css.drawerBody}>
          {/* ข้อมูลบัญชี */}
          <section className={css.section}>
            <h3 className={css.sectionTitle}>ข้อมูลบัญชี</h3>
            <div className={css.fields}>
              <label className={css.field}>
                <span>ชื่อ-นามสกุล *</span>
                <input className={css.input} value={d.fullName} onChange={(e) => set("fullName", e.target.value)} autoFocus={!user} />
              </label>
              <label className={css.field}>
                <span>ชื่อผู้ใช้ (ใช้ล็อกอิน) *</span>
                <input
                  className={css.input}
                  value={d.userName}
                  onChange={(e) => set("userName", e.target.value.toLowerCase().replace(/\s/g, ""))}
                  disabled={!!user}
                  placeholder="เช่น welfare01"
                  autoComplete="off"
                />
              </label>
              <label className={css.field}>
                <span>ฝ่าย/แผนก</span>
                <input className={css.input} value={d.department} onChange={(e) => set("department", e.target.value)} placeholder="เช่น ฝ่ายสวัสดิการ" />
              </label>
              <label className={css.field}>
                <span>เบอร์โทร</span>
                <input className={css.input} value={d.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
              </label>
            </div>
            {!user && (
              <label className={css.field}>
                <span>รหัสผ่านชั่วคราว * <small>อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข</small></span>
                <div className={css.pwRow}>
                  <input
                    className={`${css.input} ${css.mono}`}
                    type={showPw ? "text" : "password"}
                    value={d.password}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className={css.iconBtn} onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button type="button" className={css.btnSm} onClick={() => set("password", randomPassword())}>
                    <Wand2 size={14} /> สุ่มใหม่
                  </button>
                </div>
              </label>
            )}
          </section>

          {/* บทบาท */}
          <section className={css.section}>
            <h3 className={css.sectionTitle}>บทบาท</h3>
            <div className={css.roles} role="radiogroup" aria-label="บทบาท">
              {([
                ["staff", "เจ้าหน้าที่", "เข้าได้เฉพาะเมนูที่เลือกด้านล่าง", UserRound],
                ["admin", "ผู้ดูแลระบบ", "เข้าได้ทุกเมนู รวมถึงจัดการผู้ใช้", ShieldCheck],
              ] as const).map(([k, label, hint, Icon]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={d.role === k}
                  className={`${css.role} ${d.role === k ? css.roleOn : ""}`}
                  onClick={() => set("role", k)}
                  disabled={isSelf && user?.userRole === "admin" && k === "staff"}
                >
                  <Icon size={18} />
                  <span><strong>{label}</strong><small>{hint}</small></span>
                </button>
              ))}
            </div>
            {isSelf && user?.userRole === "admin" && <p className={css.hint}>ลดสิทธิ์บัญชีของตัวเองไม่ได้ ให้ผู้ดูแลระบบคนอื่นทำแทน</p>}
          </section>

          {/* สิทธิ์เมนู */}
          {d.role === "staff" && (
            <section className={css.section}>
              <div className={css.sectionHead}>
                <h3 className={css.sectionTitle}>สิทธิ์เข้าถึงเมนู</h3>
                <span className={css.count}>เลือกแล้ว {selected} / {ALL_PERMS.length}</span>
              </div>
              <div className={css.permTools}>
                <span className={css.toolLabel}>สิทธิ์สำเร็จรูป</span>
                {Object.keys(ROLE_PRESETS).map((name) => (
                  <button key={name} type="button" className={css.chip} onClick={() => set("perms", new Set(ROLE_PRESETS[name]))}>
                    {name}
                  </button>
                ))}
                {copyFrom.length > 0 && (
                  <select
                    className={css.select}
                    value=""
                    onChange={(e) => {
                      const src = users.find((u) => u.id === Number(e.target.value));
                      if (src) set("perms", new Set(src.menuPermissions ?? []));
                    }}
                    aria-label="คัดลอกสิทธิ์จากผู้ใช้อื่น"
                  >
                    <option value="">คัดลอกจากผู้ใช้…</option>
                    {copyFrom.map((u) => (
                      <option key={u.id} value={u.id}>{nameOf(u)} ({(u.menuPermissions ?? []).length})</option>
                    ))}
                  </select>
                )}
                <span className={css.toolSpacer} />
                <button type="button" className={css.linkBtn} onClick={() => set("perms", new Set(ALL_PERMS))}>เลือกทั้งหมด</button>
                <button type="button" className={css.linkBtn} onClick={() => set("perms", new Set())}>ล้าง</button>
              </div>
              <div className={css.permGrid}>
                {permissionGroups.map((g) => {
                  const hrefs = g.items.map((i) => i.href);
                  const n = hrefs.filter((h) => d.perms.has(h)).length;
                  return (
                    <div key={g.group} className={`${css.permGroup} ${n ? css.permGroupOn : ""}`}>
                      <label className={css.permGroupHead}>
                        <input
                          type="checkbox"
                          checked={n === hrefs.length}
                          ref={(el) => {
                            if (el) el.indeterminate = n > 0 && n < hrefs.length;
                          }}
                          onChange={() => toggleGroup(hrefs)}
                        />
                        <span>{g.group}</span>
                        <small>{n}/{hrefs.length}</small>
                      </label>
                      {g.items.map((i) => (
                        <label key={i.href} className={css.permItem}>
                          <input type="checkbox" checked={d.perms.has(i.href)} onChange={() => toggle(i.href)} />
                          <span>{i.label}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className={css.hint}>ทุกคนเห็นแดชบอร์ดเสมอ · เมนู “ผู้ใช้งาน” เฉพาะผู้ดูแลระบบ · สิทธิ์ที่เปลี่ยนมีผลทันทีโดยไม่ต้องล็อกอินใหม่</p>
            </section>
          )}

          {user && <Activity userId={user.id} />}
        </div>

        <footer className={css.drawerFoot}>
          {user ? (
            <label className={`${css.switch} ${isSelf ? css.switchDisabled : ""}`} title={isSelf ? "ปิดใช้งานบัญชีตัวเองไม่ได้" : undefined}>
              <input type="checkbox" checked={d.isActive} disabled={isSelf} onChange={(e) => set("isActive", e.target.checked)} />
              <span className={css.switchUi} aria-hidden />
              {d.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </label>
          ) : (
            <span />
          )}
          {error && <span className={css.formError}><AlertTriangle size={14} /> {error}</span>}
          <div className={css.footActions}>
            <button type="button" className={css.btnGhost} onClick={onClose}>ยกเลิก</button>
            <button type="button" className={css.btnPrimary} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={16} className={css.spin} /> : <Check size={16} />} {user ? "บันทึก" : "สร้างบัญชี"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

/* ═════════ หน้า ═════════ */
export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // เวลาที่โหลดข้อมูล — ใช้คำนวณสถานะ (ล็อก/เข้าใช้ล่าสุด) ให้คงที่ระหว่างเรนเดอร์
  const [now, setNow] = useState(0);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<UserRecord | "new" | null>(null);
  const [credential, setCredential] = useState<{ title: string; userName: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) {
          setUsers(json.users);
          setNow(Date.now());
          setCurrentUserId(json.currentUserId);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const list = users ?? [];
    const active = list.filter((u) => u.isActive);
    return {
      total: list.length,
      active: active.length,
      admins: active.filter((u) => u.userRole === "admin").length,
      recent: active.filter((u) => u.lastLoginAt && now - new Date(u.lastLoginAt).getTime() < 30 * 864e5).length,
      attention: list.filter((u) => needsAttention(u, now)).length,
      locked: list.filter((u) => isLocked(u, now)).length,
    };
  }, [users, now]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? [])
      .filter((u) =>
        filter === "admin" ? roleOf(u) === "admin" : filter === "staff" ? roleOf(u) === "staff" : filter === "attention" ? needsAttention(u, now) : true
      )
      .filter((u) => !q || `${u.fullName ?? ""} ${u.userName} ${u.department ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.isActive) - Number(a.isActive) || (roleOf(a) === "admin" ? -1 : 0) - (roleOf(b) === "admin" ? -1 : 0));
  }, [users, query, filter, now]);

  const put = async (u: UserRecord, body: Record<string, unknown>, ok: string) => {
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ text: json.error || "ทำรายการไม่สำเร็จ", error: true });
        return false;
      }
      setToast({ text: ok });
      setTick((n) => n + 1);
      return true;
    } catch {
      setToast({ text: "เชื่อมต่อไม่สำเร็จ", error: true });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (u: UserRecord) => {
    if (!window.confirm(`รีเซ็ตรหัสผ่านของ ${nameOf(u)}?\n\nระบบจะสุ่มรหัสผ่านชั่วคราวใหม่ และออกจากระบบทุกเครื่องที่ใช้บัญชีนี้อยู่`)) return;
    const password = randomPassword();
    if (await put(u, { password }, `รีเซ็ตรหัสผ่านของ ${nameOf(u)} แล้ว`)) {
      setCopied(false);
      setCredential({ title: "รีเซ็ตรหัสผ่านแล้ว", userName: u.userName, password });
    }
  };

  const toggleActive = (u: UserRecord) => {
    if (u.isActive && !window.confirm(`ปิดใช้งานบัญชี ${nameOf(u)}?\nผู้ใช้จะถูกออกจากระบบทันที และล็อกอินไม่ได้จนกว่าจะเปิดใหม่`)) return;
    put(u, { isActive: !u.isActive }, u.isActive ? `ปิดใช้งาน ${nameOf(u)} แล้ว` : `เปิดใช้งาน ${nameOf(u)} แล้ว`);
  };

  const remove = async (u: UserRecord) => {
    if (!window.confirm(`ลบบัญชี ${nameOf(u)} ถาวร?\n\nถ้าแค่ไม่ให้เข้าใช้ชั่วคราว แนะนำ “ปิดใช้งาน” แทน · ประวัติการแก้ไขของผู้ใช้นี้ยังอยู่ แต่จะไม่แสดงชื่อผู้แก้ไข`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusyId(null);
    if (res?.ok) {
      setToast({ text: `ลบบัญชี ${nameOf(u)} แล้ว` });
      setTick((n) => n + 1);
    } else setToast({ text: json.error || "ลบไม่สำเร็จ", error: true });
  };

  if (failed) {
    return <div className={css.page}><div className={css.state}><AlertTriangle size={26} /> โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</div></div>;
  }
  if (!users) {
    return <div className={css.page}><div className={css.state}><Loader2 size={22} className={css.spin} /> กำลังโหลด…</div></div>;
  }

  const FILTERS: [Filter, string, number][] = [
    ["all", "ทั้งหมด", stats.total],
    ["admin", "ผู้ดูแลระบบ", users.filter((u) => roleOf(u) === "admin").length],
    ["staff", "เจ้าหน้าที่", users.filter((u) => roleOf(u) === "staff").length],
    ["attention", "ต้องดูแล", stats.attention],
  ];

  return (
    <div className={css.page}>
      {/* ── หัวหน้า ── */}
      <header className={css.head}>
        <div className={css.headText}>
          <span className={css.headIcon}><Users size={22} /></span>
          <div>
            <h1 className={css.title}>ผู้ใช้งานหลังบ้าน</h1>
            <p className={css.subtitle}>บัญชีเจ้าหน้าที่ บทบาท และสิทธิ์เข้าถึงแต่ละเมนู</p>
          </div>
        </div>
        <button type="button" className={css.headBtn} onClick={() => setEditing("new")}>
          <Plus size={16} /> เพิ่มผู้ใช้
        </button>
      </header>

      {/* ── ตัวเลขหลัก ── */}
      <section className={css.kpis}>
        <div className={css.kpi}>
          <span className={css.kpiLabel}>บัญชีที่ใช้งานได้</span>
          <span className={css.kpiValue}>{fmt(stats.active)}</span>
          <span className={css.kpiFoot}>จากทั้งหมด {fmt(stats.total)} บัญชี</span>
        </div>
        <div className={`${css.kpi} ${stats.admins <= 1 ? css.kpiWarn : ""}`}>
          <span className={css.kpiLabel}>ผู้ดูแลระบบ</span>
          <span className={css.kpiValue}>{fmt(stats.admins)}</span>
          <span className={css.kpiFoot}>{stats.admins <= 1 ? "ควรมีอย่างน้อย 2 คน กันเข้าระบบไม่ได้" : "เข้าได้ทุกเมนู"}</span>
        </div>
        <div className={css.kpi}>
          <span className={css.kpiLabel}>เข้าใช้ใน 30 วัน</span>
          <span className={css.kpiValue}>{fmt(stats.recent)}</span>
          <span className={css.kpiFoot}>บัญชี</span>
        </div>
        <button type="button" className={`${css.kpi} ${css.kpiBtn} ${stats.attention ? css.kpiWarn : ""}`} onClick={() => setFilter("attention")}>
          <span className={css.kpiLabel}>ต้องดูแล</span>
          <span className={css.kpiValue}>{fmt(stats.attention)}</span>
          <span className={css.kpiFoot}>{stats.locked ? `ถูกล็อก ${stats.locked} · ` : ""}ไม่เคยเข้า/ไม่ได้เข้าเกิน 90 วัน</span>
        </button>
      </section>

      {/* ── รายการ ── */}
      <section className={css.card}>
        <div className={css.toolbar}>
          <div className={css.seg} role="group" aria-label="กรองผู้ใช้">
            {FILTERS.map(([k, label, n]) => (
              <button key={k} type="button" aria-pressed={filter === k} className={filter === k ? css.segOn : ""} onClick={() => setFilter(k)}>
                {label} <span className={css.segCount}>{fmt(n)}</span>
              </button>
            ))}
          </div>
          <label className={css.search}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรือฝ่าย" aria-label="ค้นหาผู้ใช้" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="ล้าง"><X size={14} /></button>}
          </label>
        </div>

        {visible.length === 0 ? (
          <div className={css.state}>{filter === "attention" && !query ? <><Check size={20} /> ไม่มีบัญชีที่ต้องดูแล</> : "ไม่พบผู้ใช้"}</div>
        ) : (
          <ul className={css.list}>
            {visible.map((u) => {
              const admin = roleOf(u) === "admin";
              const perms = (u.menuPermissions ?? []).filter((h) => PERM_LABEL.has(h));
              const self = u.id === currentUserId;
              const locked = isLocked(u, now);
              return (
                <li key={u.id} className={`${css.row} ${!u.isActive ? css.rowOff : ""}`}>
                  <span className={`${css.avatar} ${admin ? css.avatarAdmin : ""}`} aria-hidden>{initials(u)}</span>

                  <div className={css.who}>
                    <div className={css.nameLine}>
                      <strong>{nameOf(u)}</strong>
                      {self && <span className={css.youTag}>คุณ</span>}
                    </div>
                    <span className={css.meta}>@{u.userName}{u.department ? ` · ${u.department}` : ""}</span>
                  </div>

                  <div className={css.access}>
                    {admin ? (
                      <span className={css.roleAdmin}><ShieldCheck size={13} /> ผู้ดูแลระบบ · ทุกเมนู</span>
                    ) : (
                      <span className={css.roleStaff} title={perms.map((h) => PERM_LABEL.get(h)).join("\n")}>
                        <UserCog size={13} /> {perms.length ? `${perms.length} เมนู · ${PERM_LABEL.get(perms[0])}${perms.length > 1 ? " …" : ""}` : "ยังไม่มีสิทธิ์เมนู"}
                      </span>
                    )}
                  </div>

                  <div className={css.status}>
                    {!u.isActive ? (
                      <span className={css.badgeOff}>ปิดใช้งาน</span>
                    ) : locked ? (
                      <span className={css.badgeLock}><Lock size={12} /> ล็อกถึง {time(u.lockedUntil!)}</span>
                    ) : (
                      <span className={css.badgeOn}>ใช้งานได้</span>
                    )}
                    <span className={!u.lastLoginAt ? css.seenNever : css.seen}>{lastSeen(u.lastLoginAt, now)}</span>
                  </div>

                  <div className={css.actions}>
                    {busyId === u.id ? (
                      <Loader2 size={18} className={css.spin} />
                    ) : (
                      <>
                        {locked && (
                          <button type="button" className={css.btnWarnSm} onClick={() => put(u, { unlock: true }, `ปลดล็อก ${nameOf(u)} แล้ว`)}>
                            <LockOpen size={14} /> ปลดล็อก
                          </button>
                        )}
                        <button type="button" className={css.btnSm} onClick={() => setEditing(u)}>
                          <Pencil size={14} /> แก้ไข
                        </button>
                        <details className={css.more}>
                          <summary aria-label={`ตัวเลือกเพิ่มเติมของ ${nameOf(u)}`}>⋯</summary>
                          <div className={css.menu} onClick={(e) => ((e.currentTarget.parentElement as HTMLDetailsElement).open = false)}>
                            <button type="button" onClick={() => resetPassword(u)}><KeyRound size={14} /> รีเซ็ตรหัสผ่าน</button>
                            {!self && (
                              <button type="button" onClick={() => toggleActive(u)}>
                                {u.isActive ? <><Lock size={14} /> ปิดใช้งาน</> : <><LockOpen size={14} /> เปิดใช้งาน</>}
                              </button>
                            )}
                            {!self && <button type="button" className={css.danger} onClick={() => remove(u)}><Trash2 size={14} /> ลบบัญชี</button>}
                          </div>
                        </details>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id}
          user={editing === "new" ? null : editing}
          isSelf={editing !== "new" && editing.id === currentUserId}
          users={users}
          onClose={() => setEditing(null)}
          onSaved={(msg, cred) => {
            setEditing(null);
            setToast({ text: msg });
            setTick((n) => n + 1);
            if (cred) {
              setCopied(false);
              setCredential({ title: "สร้างบัญชีแล้ว", ...cred });
            }
          }}
        />
      )}

      {/* ── แสดงรหัสผ่านครั้งเดียว ── */}
      {credential && (
        <div className={css.overlayCenter}>
          <div className={css.dialog} role="dialog" aria-modal="true" aria-label={credential.title}>
            <h2 className={css.dialogTitle}><KeyRound size={18} /> {credential.title}</h2>
            <p className={css.dialogText}>
              ส่งข้อมูลนี้ให้ผู้ใช้ทางช่องทางที่ปลอดภัย รหัสผ่านจะแสดงครั้งเดียว ปิดหน้าต่างนี้แล้วดูอีกไม่ได้
              · ผู้ใช้ต้องตั้งรหัสผ่านของตัวเองเมื่อเข้าใช้ครั้งแรก จึงจะใช้เมนูอื่นได้
            </p>
            <dl className={css.cred}>
              <dt>ชื่อผู้ใช้</dt>
              <dd className={css.mono}>{credential.userName}</dd>
              <dt>รหัสผ่านชั่วคราว</dt>
              <dd className={css.mono}>{credential.password}</dd>
            </dl>
            <div className={css.dialogActions}>
              <button
                type="button"
                className={css.btnGhost}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`ชื่อผู้ใช้: ${credential.userName}\nรหัสผ่าน: ${credential.password}`);
                    setCopied(true);
                  } catch { /* คัดลอกไม่ได้ ผู้ใช้เลือกข้อความเองได้ */ }
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
              <button type="button" className={css.btnPrimary} onClick={() => setCredential(null)}>เสร็จแล้ว</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`${css.toast} ${toast.error ? css.toastErr : ""}`} role="status">{toast.text}</div>}
    </div>
  );
}
