"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  AlertCircle,
  LogIn
} from "lucide-react";
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
      {/* Brand Section - Hidden on Mobile */}
      <div className={css.brandSection}>
        <div className={css.floatingShapes}>
          <div className={`${css.shape} ${css.shape1}`}></div>
          <div className={`${css.shape} ${css.shape2}`}></div>
          <div className={`${css.shape} ${css.shape3}`}></div>
        </div>
        <div className={css.brandContent}>
          <div className={css.brandLogo}>
                      <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={120}
            height={120}
          />
          </div>
          <h1 className={css.brandTitle}>ระบบจัดการเว็บไซต์<br/>สหกรณ์ออมทรัพย์กรมทางหลวง</h1>
          <p className={css.brandSubtitle}>
            ยินดีต้อนรับเข้าสู่ระบบจัดการเนื้อหาสำหรับผู้ดูแลระบบ จัดการข้อมูลข่าวสาร และบริการต่างๆ ของสหกรณ์ได้อย่างมีประสิทธิภาพ
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className={css.formSection}>
        <div className={css.formWrapper}>
          {/* Mobile Header */}
          <div className={css.mobileHeader}>
            <div className={css.mobileLogo}>
              
                        <img
            src="/images/logo/logo.png"
            alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
            width={64}
            height={64}
          />
            </div>
            <h1 className={css.mobileTitle}>สหกรณ์ออมทรัพย์กรมทางหลวง</h1>
            <p className={css.mobileSubtitle}>ระบบจัดการเว็บไซต์</p>
          </div>

          <div className={css.formHeader}>
            <h2 className={css.formTitle}>เข้าสู่ระบบ</h2>
            <p className={css.formSubtitle}>กรุณากรอกข้อมูลประจำตัวของคุณเพื่อดำเนินการต่อ</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={css.error}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className={css.inputGroup}>
              <label className={css.label}>ชื่อผู้ใช้งาน</label>
              <div className={css.inputWrap}>
                <User className={css.inputIcon} size={20} />
                <input
                  type="text"
                  className={css.input}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className={css.inputGroup}>
              <label className={css.label}>รหัสผ่าน</label>
              <div className={css.inputWrap}>
                <Lock className={css.inputIcon} size={20} />
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
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className={css.submitBtn} disabled={loading}>
              {loading ? (
                <span className={css.spinner} />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบจัดการ</span>
                </>
              )}
            </button>
          </form>

          <div className={css.footer}>
            <Link href="/" className={css.backLink}>
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าหลักเว็บไซต์</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
