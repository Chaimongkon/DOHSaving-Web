"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  SwapOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface Rate {
  id: number;
  interestType: string | null;
  name: string | null;
  interestDate: string | null;
  conditions: string | null;
  interestRate: string | null;
  interestRateDual: string | null;
}

type Tab = "all" | "deposit" | "loan";

export default function InterestRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/interest-rates")
      .then((r) => r.json())
      .then((d) => setRates(d.rates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const depositRates = rates.filter((r) => r.interestType === "deposit");
  const loanRates = rates.filter((r) => r.interestType === "loan");

  // Get latest date from rates
  const latestDate = rates.find((r) => r.interestDate)?.interestDate;
  const formattedDate = latestDate
    ? new Date(latestDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "ทั้งหมด", icon: <SwapOutlined /> },
    { key: "deposit", label: "เงินฝาก", icon: <BankOutlined /> },
    { key: "loan", label: "เงินกู้", icon: <DollarOutlined /> },
  ];

  const renderCards = (items: Rate[], type: "deposit" | "loan") => (
    <div className={css.rateGrid}>
      {items.map((rate) => (
        <div
          key={rate.id}
          className={`${css.rateCard} ${type === "deposit" ? css.rateCardDeposit : css.rateCardLoan}`}
        >
          <div
            className={`${css.rateCircle} ${type === "deposit" ? css.rateCircleDeposit : css.rateCircleLoan}`}
          >
            <span
              className={`${css.rateNumber} ${type === "deposit" ? css.rateNumberDeposit : css.rateNumberLoan}`}
            >
              {rate.interestRate || "—"}
            </span>
            <span className={css.ratePercent}>% ต่อปี</span>
          </div>

          <h3 className={css.rateCardName}>{rate.name}</h3>
          <p className={css.rateCardCondition}>{rate.conditions || "\u00A0"}</p>

          {rate.interestRateDual && (
            <div className={css.rateDual}>
              <span>อัตราที่ 2:</span>
              <span className={css.rateDualValue}>{rate.interestRateDual}%</span>
            </div>
          )}

          <span
            className={`${css.rateNote} ${type === "deposit" ? css.rateNoteDeposit : css.rateNoteLoan}`}
          >
            {type === "deposit" ? "เงินฝาก" : "เงินกู้"}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroInner}>
          <h1 className={css.heroTitle}>อัตราดอกเบี้ย</h1>
          <p className={css.heroSubtitle}>
            สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — อัตราดอกเบี้ยเงินฝากและเงินกู้ปัจจุบัน
          </p>
          {formattedDate && (
            <span className={css.heroDate}>
              <CalendarOutlined className={css.heroDateIcon} />
              มีผลตั้งแต่ {formattedDate}
            </span>
          )}

          {/* Tabs */}
          <div className={css.tabBar}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`${css.tab} ${activeTab === t.key ? css.tabActive : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className={css.tabIcon}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>กำลังโหลดข้อมูล...</div>
        ) : rates.length === 0 ? (
          <div className={css.empty}>ยังไม่มีข้อมูลอัตราดอกเบี้ย</div>
        ) : (
          <>
            {/* Deposit section */}
            {(activeTab === "all" || activeTab === "deposit") && depositRates.length > 0 && (
              <div>
                {activeTab === "all" && (
                  <div className={css.sectionLabel}>
                    <span className={`${css.sectionLabelIcon} ${css.sectionLabelIconDeposit}`}>
                      <BankOutlined />
                    </span>
                    อัตราดอกเบี้ยเงินฝาก
                  </div>
                )}
                {renderCards(depositRates, "deposit")}
              </div>
            )}

            {/* Loan section */}
            {(activeTab === "all" || activeTab === "loan") && loanRates.length > 0 && (
              <div>
                {activeTab === "all" && (
                  <div className={css.sectionLabel}>
                    <span className={`${css.sectionLabelIcon} ${css.sectionLabelIconLoan}`}>
                      <DollarOutlined />
                    </span>
                    อัตราดอกเบี้ยเงินกู้
                  </div>
                )}
                {renderCards(loanRates, "loan")}
              </div>
            )}

            {/* Notice */}
            <div className={css.notice}>
              <InfoCircleOutlined className={css.noticeIcon} />
              <p className={css.noticeText}>
                อัตราดอกเบี้ยอาจมีการเปลี่ยนแปลงตามมติที่ประชุมคณะกรรมการดำเนินการ
                กรุณาติดต่อสหกรณ์ฯ เพื่อสอบถามรายละเอียดเพิ่มเติม
                โทร. 02-644-4633 ต่อ 205
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
