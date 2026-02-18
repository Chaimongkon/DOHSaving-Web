"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CloseOutlined } from "@ant-design/icons";
import css from "./CookieConsent.module.css";

interface CookieCategories {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const defaultCategories: CookieCategories = {
  necessary: true, // จำเป็น — ปิดไม่ได้
  analytics: false,
  marketing: false,
  preferences: false,
};

const COOKIE_KEY = "cookie_consent";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<CookieCategories>(defaultCategories);

  useEffect(() => {
    // ถ้ามี cookie_consent แล้ว ไม่ต้องแสดง banner
    const consent = getCookie(COOKIE_KEY);
    if (!consent) {
      // delay เล็กน้อยเพื่อไม่ให้ซ้อนกับ PromoDialog
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = useCallback(
    async (accepted: boolean, cats: CookieCategories) => {
      try {
        await fetch("/api/cookie-consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consentStatus: accepted,
            cookieCategories: cats,
          }),
        });
      } catch {
        // Silent fail — ไม่กระทบ UX
      }
      setVisible(false);
      setSettingsOpen(false);
    },
    []
  );

  const handleAcceptAll = useCallback(() => {
    const allAccepted: CookieCategories = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(true, allAccepted);
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    saveConsent(false, defaultCategories);
  }, [saveConsent]);

  const handleSaveSettings = useCallback(() => {
    const accepted = categories.analytics || categories.marketing || categories.preferences;
    saveConsent(accepted, categories);
  }, [categories, saveConsent]);

  if (!visible) return null;

  return (
    <>
      {/* Banner — Floating card */}
      {!settingsOpen && (
        <div className={css.banner}>
          <div className={css.bannerHeader}>
            <span className={css.bannerCookie}>🍪</span>
            <div className={css.bannerHeaderText}>
              <p className={css.bannerTitle}>เว็บไซต์นี้ใช้คุกกี้</p>
              <p className={css.bannerSubtitle}>เพื่อประสบการณ์ที่ดีที่สุดสำหรับคุณ</p>
            </div>
          </div>
          <div className={css.bannerInner}>
            <div className={css.bannerContent}>
              <p className={css.bannerText}>
                เราใช้คุกกี้เพื่อปรับปรุงการใช้งาน วิเคราะห์การเข้าชม
                และนำเสนอเนื้อหาที่เหมาะสม{" "}
                <Link href="/cookie-policy" className={css.bannerLink}>
                  อ่านนโยบายคุกกี้
                </Link>
              </p>
            </div>
            <div className={css.bannerActions}>
              <button className={css.btnAccept} onClick={handleAcceptAll}>
                ยอมรับทั้งหมด
              </button>
              <div className={css.bannerSecondary}>
                <button className={css.btnReject} onClick={handleRejectAll}>
                  ไม่ยอมรับ
                </button>
                <button className={css.btnSettings} onClick={() => setSettingsOpen(true)}>
                  ตั้งค่าคุกกี้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className={css.modalOverlay} onClick={() => setSettingsOpen(false)}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>ตั้งค่าคุกกี้</h3>
              <button className={css.modalClose} onClick={() => setSettingsOpen(false)}>
                <CloseOutlined />
              </button>
            </div>

            <div className={css.modalBody}>
              <p className={css.modalDesc}>
                คุณสามารถเลือกประเภทคุกกี้ที่ต้องการอนุญาตได้ โดยคุกกี้ที่จำเป็นจะเปิดใช้งานอยู่เสมอ
                เพื่อให้เว็บไซต์ทำงานได้อย่างถูกต้อง
              </p>

              {/* Necessary */}
              <div className={`${css.categoryCard} ${css.categoryCardActive}`}>
                <div className={css.categoryHeader}>
                  <div className={css.categoryInfo}>
                    <span className={css.categoryName}>คุกกี้ที่จำเป็น</span>
                    <span className={css.categoryDesc}>
                      จำเป็นสำหรับการทำงานของเว็บไซต์ เช่น ระบบล็อกอิน การจำสถานะเซสชัน
                    </span>
                  </div>
                  <div>
                    <span className={css.categoryRequired}>เปิดเสมอ</span>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className={`${css.categoryCard} ${categories.analytics ? css.categoryCardActive : ""}`}>
                <div className={css.categoryHeader}>
                  <div className={css.categoryInfo}>
                    <span className={css.categoryName}>คุกกี้วิเคราะห์</span>
                    <span className={css.categoryDesc}>
                      ใช้เก็บข้อมูลการเข้าชมเว็บไซต์ เพื่อวิเคราะห์และปรับปรุงการให้บริการ
                    </span>
                  </div>
                  <label className={css.toggle}>
                    <input
                      type="checkbox"
                      className={css.toggleInput}
                      checked={categories.analytics}
                      onChange={(e) =>
                        setCategories((prev) => ({ ...prev, analytics: e.target.checked }))
                      }
                    />
                    <span className={css.toggleSlider} />
                  </label>
                </div>
              </div>

              {/* Marketing */}
              <div className={`${css.categoryCard} ${categories.marketing ? css.categoryCardActive : ""}`}>
                <div className={css.categoryHeader}>
                  <div className={css.categoryInfo}>
                    <span className={css.categoryName}>คุกกี้การตลาด</span>
                    <span className={css.categoryDesc}>
                      ใช้ติดตามพฤติกรรมเพื่อนำเสนอโฆษณาและเนื้อหาที่เหมาะสมกับคุณ
                    </span>
                  </div>
                  <label className={css.toggle}>
                    <input
                      type="checkbox"
                      className={css.toggleInput}
                      checked={categories.marketing}
                      onChange={(e) =>
                        setCategories((prev) => ({ ...prev, marketing: e.target.checked }))
                      }
                    />
                    <span className={css.toggleSlider} />
                  </label>
                </div>
              </div>

              {/* Preferences */}
              <div className={`${css.categoryCard} ${categories.preferences ? css.categoryCardActive : ""}`}>
                <div className={css.categoryHeader}>
                  <div className={css.categoryInfo}>
                    <span className={css.categoryName}>คุกกี้การตั้งค่า</span>
                    <span className={css.categoryDesc}>
                      จดจำการตั้งค่าของคุณ เช่น ภาษา ขนาดตัวอักษร ธีมสี
                    </span>
                  </div>
                  <label className={css.toggle}>
                    <input
                      type="checkbox"
                      className={css.toggleInput}
                      checked={categories.preferences}
                      onChange={(e) =>
                        setCategories((prev) => ({ ...prev, preferences: e.target.checked }))
                      }
                    />
                    <span className={css.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>

            <div className={css.modalFooter}>
              <button className={css.btnReject} onClick={handleRejectAll}>
                ปฏิเสธทั้งหมด
              </button>
              <button className={css.btnAccept} onClick={handleSaveSettings}>
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
