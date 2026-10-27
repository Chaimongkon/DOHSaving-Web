/**
 * กติกาบัญชีผู้ใช้หลังบ้าน — ใช้ร่วมกันระหว่าง API สร้าง/แก้ไขผู้ใช้
 */
import prisma from "@/lib/prisma";

export const PASSWORD_MIN = 8;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,50}$/;
/** admin = ทุกเมนู รวมจัดการผู้ใช้ · editor = เฉพาะเมนูที่ติ๊ก (viewer เดิมทำงานเหมือน editor) */
export const ROLES = ["admin", "editor", "viewer"] as const;

export const userSelect = {
  id: true,
  fullName: true,
  userName: true,
  userRole: true,
  department: true,
  phone: true,
  isActive: true,
  menuPermissions: true,
  lastLoginAt: true,
  loginCount: true,
  lockedUntil: true,
  failedLoginAttempts: true,
  mustChangePassword: true,
  lastPasswordChange: true,
  createdAt: true,
} as const;

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN) return `รหัสผ่านต้องยาวอย่างน้อย ${PASSWORD_MIN} ตัวอักษร`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข";
  return null;
}

export const cleanPermissions = (raw: unknown): string[] =>
  Array.isArray(raw) ? [...new Set(raw.filter((p): p is string => typeof p === "string" && p.startsWith("/admin/")))] : [];

/** ผู้ดูแลระบบที่ใช้งานได้ ไม่นับคนที่ระบุ — ใช้กันไม่ให้ระบบเหลือผู้ดูแลระบบ 0 คน */
export const otherActiveAdmins = (excludeId: number) =>
  prisma.user.count({ where: { userRole: "admin", isActive: true, id: { not: excludeId } } });
