"use client";

import React, { useState } from "react";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoginOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import css from "./page.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }

      // Login สำเร็จ — redirect ไป admin dashboard
      router.push("/admin");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      setLoading(false);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.card}>
        {/* Header */}
        <div className={css.header}>
          <div className={css.logo}>
            <Image src="/logo.svg" alt="Logo" width={56} height={56} />
          </div>
          <h1 className={css.title}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</h1>
          <p className={css.subtitle}>ระบบจัดการเว็บไซต์</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={css.body}>
            <h2 className={css.formTitle}>เข้าสู่ระบบ</h2>
            <p className={css.formSubtitle}>กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>

            {error && (
              <div className={css.error}>
                <ExclamationCircleOutlined /> {error}
              </div>
            )}

            {/* Username */}
            <div className={css.inputGroup}>
              <label className={css.label}>ชื่อผู้ใช้</label>
              <div className={css.inputWrap}>
                <UserOutlined className={css.inputIcon} />
                <input
                  type="text"
                  className={css.input}
                  placeholder="กรอกชื่อผู้ใช้"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={css.inputGroup}>
              <label className={css.label}>รหัสผ่าน</label>
              <div className={css.inputWrap}>
                <LockOutlined className={css.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  className={css.input}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={css.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={css.submitBtn} disabled={loading}>
              {loading ? (
                <span className={css.spinner} />
              ) : (
                <>
                  <LoginOutlined /> เข้าสู่ระบบ
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className={css.footer}>
          <Link href="/" className={css.backLink}>
            <ArrowLeftOutlined /> กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
