"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HomeOutlined,
  QrcodeOutlined, DownloadOutlined
} from "@ant-design/icons";
import { Phone3D, ShieldTick3D, CloudBase3D, CheckSquare3D } from "@/components/icons/ThreeDIcons";
import css from "./page.module.css";

interface AppData {
  title: string;
  description: string;
  androidQrUrl: string | null;
  androidStoreUrl: string | null;
  iosQrUrl: string | null;
  iosStoreUrl: string | null;
  huaweiQrUrl: string | null;
  huaweiStoreUrl: string | null;
  infographicUrl: string | null;
  infographic2Url: string | null;
}

const features = [
  { icon: <Phone3D size={48} />, title: "ใช้งานง่าย", desc: "ออกแบบมาเพื่อสมาชิกทุกวัย" },
  { icon: <ShieldTick3D size={48} />, title: "ปลอดภัย", desc: "รักษาความปลอดภัยด้วยระบบ OTP" },
  { icon: <CloudBase3D size={48} />, title: "ทุกที่ทุกเวลา", desc: "ตรวจสอบยอดได้ตลอด 24 ชม." },
  { icon: <CheckSquare3D size={48} />, title: "ทำธุรกรรม", desc: "ฝาก ถอน โอน ผ่านแอปได้เลย" },
];

export default function DownloadAppPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeQr, setActiveQr] = useState<"android" | "ios" | "huawei">("android");

  useEffect(() => {
    fetch("/api/download-app")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => { });
  }, []);

  const platforms = [
    {
      key: "android" as const,
      label: "Android",
      store: "Google Play",
      icon: <img src="/images/logo/GooglePlay.png" alt="Android" style={{ width: 30, height: 30, objectFit: "contain" }} />,
      color: "#5CB975",
      qrUrl: data?.androidQrUrl,
      storeUrl: data?.androidStoreUrl,
      storeLogo: "/images/logo/GooglePlay.png",
    },
    {
      key: "ios" as const,
      label: "iOS",
      store: "App Store",
      icon: <img src="/images/logo/AppStore.png" alt="iOS" style={{ width: 30, height: 30, objectFit: "contain" }} />,
      color: "#4CA1FF",
      qrUrl: data?.iosQrUrl,
      storeUrl: data?.iosStoreUrl,
      storeLogo: "/images/logo/AppStore.png",
    },
    {
      key: "huawei" as const,
      label: "Huawei",
      store: "AppGallery",
      icon: <img src="/images/logo/AppGellery.png" alt="Huawei" style={{ width: 30, height: 30, objectFit: "contain" }} />,
      color: "#D5596C",
      qrUrl: data?.huaweiQrUrl,
      storeUrl: data?.huaweiStoreUrl,
      storeLogo: "/images/logo/AppGellery.png",
    },
  ];

  const activePlatform = platforms.find((p) => p.key === activeQr)!;

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroInner}>
          <div className={css.heroContent}>
            <div className={css.breadcrumb}>
              <Link href="/"><HomeOutlined /></Link>
              <span>/</span>
              <span>ดาวน์โหลดแอป</span>
            </div>
            <h1 className={css.heroTitle}>
              {data?.title || "ดาวน์โหลดแอป DOH Saving"}
            </h1>
            <p className={css.heroDesc}>
              {data?.description || "ดาวน์โหลดแอปพลิเคชัน DOH Saving เพื่อใช้บริการสหกรณ์ออมทรัพย์กรมทางหลวงได้ทุกที่ทุกเวลา"}
            </p>
            {/* Store buttons */}
            <div className={css.storeButtons}>
              {platforms.map((p) => p.storeUrl && (
                <a key={p.key} href={p.storeUrl} target="_blank" rel="noopener noreferrer" className={css.storeBtn}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.storeLogo} alt={p.store} className={css.storeImg} />
                </a>
              ))}
            </div>
          </div>
          <div className={css.heroVisual}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/logoapp.png" alt="DOH Saving" className={css.heroAppIcon} />
          </div>
        </div>
        <div className={css.heroWave}>
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" fill="#f8fafc" /></svg>
        </div>
      </div>

      <div className={css.page}>
        {/* Features */}
        <section className={css.features}>
          {features.map((f, i) => (
            <div key={i} className={css.featureCard}>
              <div className={css.featureIcon}>{f.icon}</div>
              <h3 className={css.featureTitle}>{f.title}</h3>
              <p className={css.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* QR Code Section */}
        <section className={css.qrSection}>
          <div className={css.qrHeader}>
            <QrcodeOutlined className={css.qrHeaderIcon} />
            <div>
              <h2 className={css.qrTitle}>สแกน QR Code ดาวน์โหลด</h2>
              <p className={css.qrSubtitle}>เลือกระบบปฏิบัติการแล้วสแกน QR Code เพื่อดาวน์โหลดแอป</p>
            </div>
          </div>

          <div className={css.qrContent}>
            {/* Platform tabs */}
            <div className={css.platformTabs}>
              {platforms.map((p) => (
                <button
                  key={p.key}
                  className={`${css.platformTab} ${activeQr === p.key ? css.platformTabActive : ""}`}
                  style={{ "--tab-color": p.color } as React.CSSProperties}
                  onClick={() => setActiveQr(p.key)}
                >
                  <span className={css.platformIcon}>{p.icon}</span>
                  <div className={css.platformTextWrapper}>
                    <span className={css.platformLabel}>{p.label}</span>
                    <span className={css.platformStore}>{p.store}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* QR Display */}
            <div className={css.qrDisplay}>
              <div className={css.qrCard} style={{ "--qr-color": activePlatform.color } as React.CSSProperties}>
                {activePlatform.qrUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={activePlatform.qrUrl} alt={`QR ${activePlatform.label}`} className={css.qrImage} />
                ) : (
                  <div className={css.qrPlaceholder}>
                    <QrcodeOutlined style={{ fontSize: 96 }} />
                    <p>ยังไม่มี QR Code</p>
                  </div>
                )}
              </div>
              {activePlatform.storeUrl && (
                <a href={activePlatform.storeUrl} target="_blank" rel="noopener noreferrer" className={css.downloadBtn} style={{ "--btn-color": activePlatform.color } as React.CSSProperties}>
                  <DownloadOutlined /> ดาวน์โหลดจาก {activePlatform.store}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Infographic */}
        {(data?.infographicUrl || data?.infographic2Url) && (
          <section className={css.infographicSection}>
            <h2 className={css.infoTitle}>ทำไมต้อง DOH Saving App?</h2>
            <p className={css.infoSubtitle}>ความสะดวกสบายที่ออกแบบมาเพื่อสมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง</p>
            <div className={css.infoGrid}>
              {data.infographicUrl && (
                <div className={css.infoCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.infographicUrl} alt="Infographic" className={css.infoImage} />
                </div>
              )}
              {data.infographic2Url && (
                <div className={css.infoCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.infographic2Url} alt="Infographic" className={css.infoImage} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* App Guide link */}
        <section className={css.guideSection}>
          <div className={css.guideCard}>
            <div className={css.guideInfo}>
              <h3 className={css.guideTitle}>วิธีใช้งาน Application DOHSaving</h3>
              <p className={css.guideDesc}>ดูคู่มือการใช้งานแอปพลิเคชัน พร้อมภาพประกอบทีละขั้นตอน</p>
            </div>
            <Link href="/services/app-dohsaving" className={css.guideBtn}>
              ดูคู่มือการใช้งาน →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
