"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
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

  const latestDate = rates.find((r) => r.interestDate)?.interestDate;
  const formattedDate = latestDate
    ? new Date(latestDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Find highlight rates
  const maxDepositRate = Math.max(...depositRates.map((r) => parseFloat(r.interestRate || "0")));
  const allLoanValues = loanRates.flatMap((r) => {
    const vals = [parseFloat(r.interestRate || "99")];
    if (r.interestRateDual) vals.push(parseFloat(r.interestRateDual));
    return vals;
  });
  const minLoanRate = Math.min(...allLoanValues);

  const getBadge = (rate: Rate, type: "deposit" | "loan") => {
    const val = parseFloat(rate.interestRate || "0");
    if (type === "deposit" && val === maxDepositRate) return "ดอกเบี้ยสูงสุด";
    if (type === "loan" && val === minLoanRate) return "ดอกเบี้ยต่ำสุด";
    return null;
  };

  const renderRateItem = (rate: Rate, type: "deposit" | "loan", idx: number) => {
    const hasDual = !!rate.interestRateDual;
    const badge = getBadge(rate, type);
    const isHighlight = !!badge;

    return (
      <div
        key={rate.id}
        className={`${css.rateItem} ${type === "deposit" ? css.rateItemDeposit : css.rateItemLoan} ${isHighlight ? css.rateItemHighlight : ""}`}
        style={{ animationDelay: `${idx * 50}ms` }}
      >
        {badge && (
          <span className={`${css.badge} ${type === "deposit" ? css.badgeDeposit : css.badgeLoan}`}>
            {badge}
          </span>
        )}

        <div className={css.rateItemLeft}>
          <span className={css.rateIndex}>{String(idx + 1).padStart(2, "0")}</span>
          <div className={css.rateInfo}>
            <h3 className={css.rateName}>{rate.name}</h3>
            {rate.conditions && <p className={css.rateCondition}>{rate.conditions}</p>}
          </div>
        </div>

        <div className={css.rateItemRight}>
          {hasDual ? (
            <div className={css.dualRate}>
              <span className={css.dualLabel}>คงที่ 2 ปีแรก</span>
              <div className={`${css.ratePill} ${type === "deposit" ? css.ratePillDeposit : css.ratePillLoan}`}>
                <span className={css.ratePillNum}>{rate.interestRate}</span>
                <span className={css.ratePillPct}>%</span>
              </div>
              <ArrowRightOutlined className={css.dualArrow} />
              <span className={css.dualLabel}>ตั้งแต่ปีที่ 3</span>
              <div className={css.ratePillSecond}>
                <span className={css.ratePillNum}>{rate.interestRateDual}</span>
                <span className={css.ratePillPct}>%</span>
              </div>
            </div>
          ) : (
            <div className={`${css.ratePill} ${type === "deposit" ? css.ratePillDeposit : css.ratePillLoan} ${isHighlight ? css.ratePillBig : ""}`}>
              <span className={css.ratePillNum}>{rate.interestRate || "—"}</span>
              <span className={css.ratePillPct}>%</span>
              <span className={css.ratePillUnit}>ต่อปี</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Hero */}
      <div className={css.hero}>
        <div className={css.heroDecor1} />
        <div className={css.heroDecor2} />
        <div className={css.heroDecor3} />
        <div className={css.heroInner}>

          <h1 className={css.heroTitle}>อัตราดอกเบี้ย</h1>
          <p className={css.heroSubtitle}>
            อัตราดอกเบี้ยเงินฝากและเงินกู้สำหรับสมาชิก
          </p>
          {formattedDate && (
            <span className={css.heroDate}>
              <CalendarOutlined className={css.heroDateIcon} />
              มีผลตั้งแต่วันที่ {formattedDate}
            </span>
          )}

          {/* Summary boxes */}
          {!loading && rates.length > 0 && (
            <div className={css.heroStats}>
              <div className={css.heroStat}>
                <span className={css.heroStatLabel}>ดอกเบี้ยเงินฝากสูงสุด</span>
                <span className={css.heroStatValue}>
                  {Math.max(...depositRates.map((r) => parseFloat(r.interestRate || "0"))).toFixed(2)}
                  <small>%</small>
                </span>
              </div>
              <div className={css.heroStatDivider} />
              <div className={css.heroStat}>
                <span className={css.heroStatLabel}>ดอกเบี้ยเงินกู้ต่ำสุด</span>
                <span className={`${css.heroStatValue} ${css.heroStatValueLoan}`}>
                  {Math.min(...loanRates.map((r) => parseFloat(r.interestRate || "99"))).toFixed(2)}
                  <small>%</small>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={css.tabWrapper}>
        <div className={css.tabBar}>
          {([
            { key: "all" as Tab, label: "ทั้งหมด", icon: <BankOutlined /> },
            { key: "deposit" as Tab, label: "เงินฝาก", icon: <SafetyCertificateOutlined /> },
            { key: "loan" as Tab, label: "เงินกู้", icon: <DollarOutlined /> },
          ]).map((t) => (
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

      {/* Content */}
      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>
            <div className={css.spinner} />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : rates.length === 0 ? (
          <div className={css.empty}>ยังไม่มีข้อมูลอัตราดอกเบี้ย</div>
        ) : (
          <>
            {/* Deposit section */}
            {(activeTab === "all" || activeTab === "deposit") && depositRates.length > 0 && (
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIcon} ${css.sectionIconDeposit}`}>
                    <SafetyCertificateOutlined />
                  </div>
                  <div>
                    <h2 className={css.sectionTitle}>อัตราดอกเบี้ยเงินฝาก</h2>
                    <p className={css.sectionSub}>ดอกเบี้ยสูง ปลอดภัย มั่นคง</p>
                  </div>
                  <span className={css.sectionCount}>{depositRates.length} รายการ</span>
                </div>
                <div className={css.rateList}>
                  {depositRates.map((r, i) => renderRateItem(r, "deposit", i))}
                </div>
              </div>
            )}

            {/* Loan section */}
            {(activeTab === "all" || activeTab === "loan") && loanRates.length > 0 && (
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIcon} ${css.sectionIconLoan}`}>
                    <DollarOutlined />
                  </div>
                  <div>
                    <h2 className={css.sectionTitle}>อัตราดอกเบี้ยเงินกู้</h2>
                    <p className={css.sectionSub}>ดอกเบี้ยเป็นธรรม หลากหลายทางเลือก</p>
                  </div>
                  <span className={css.sectionCount}>{loanRates.length} รายการ</span>
                </div>
                <div className={css.rateList}>
                  {loanRates.map((r, i) => renderRateItem(r, "loan", i))}
                </div>
              </div>
            )}

            {/* Notice */}
            <div className={css.notice}>
              <div className={css.noticeLeft}>
                <InfoCircleOutlined className={css.noticeIcon} />
                <div>
                  <strong className={css.noticeTitle}>หมายเหตุ</strong>
                  <p className={css.noticeText}>
                    อัตราดอกเบี้ยอาจมีการเปลี่ยนแปลงตามมติที่ประชุมคณะกรรมการดำเนินการ
                  </p>
                </div>
              </div>
              <a href="tel:026444633" className={css.noticePhone}>
                <PhoneOutlined /> 02-644-4633 ต่อ 205
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
