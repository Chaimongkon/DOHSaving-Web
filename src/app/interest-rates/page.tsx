"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  AreaChartOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { PiggyBank3D, HomeLoan3D } from "@/components/icons/ThreeDIcons";
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
      .catch(() => { })
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
    if (type === "deposit" && val === maxDepositRate) return "ให้ผลตอบแทนสูงสุด";
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
          <div className={`${css.rateIconWrapper} ${type === "deposit" ? css.rateIconDeposit : css.rateIconLoan}`}>
            {type === "deposit" ? <PiggyBank3D size={40} /> : <HomeLoan3D size={40} />}
          </div>
          <div className={css.rateInfo}>
            <h3 className={css.rateName}>{rate.name}</h3>
            {rate.conditions && <p className={css.rateCondition}>{rate.conditions}</p>}
          </div>
        </div>

        <div className={css.rateItemRight}>
          {hasDual ? (
            <div className={css.dualRate}>
              <div className={css.dualRateBlock}>
                <span className={css.dualLabel}>คงที่ 2 ปีแรก</span>
                <div className={`${css.ratePill} ${type === "deposit" ? css.ratePillDeposit : css.ratePillLoan}`}>
                  <span className={css.ratePillNum}>{rate.interestRate}</span>
                  <span className={css.ratePillPct}>%</span>
                </div>
              </div>
              <ArrowRightOutlined className={css.dualArrow} />
              <div className={css.dualRateBlock}>
                <span className={css.dualLabel}>ตั้งแต่ปีที่ 3</span>
                <div className={css.ratePillSecond}>
                  <span className={css.ratePillNum}>{rate.interestRateDual}</span>
                  <span className={css.ratePillPct}>%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={css.singleRateBlock}>
              <span className={css.dualLabel}>อัตราดอกเบี้ย</span>
              <div className={`${css.ratePill} ${type === "deposit" ? css.ratePillDeposit : css.ratePillLoan} ${isHighlight ? css.ratePillBig : ""}`}>
                <span className={css.ratePillNum}>{rate.interestRate || "—"}</span>
                <span className={css.ratePillPct}>%</span>
                <span className={css.ratePillUnit}>ต่อปี</span>
              </div>
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
        <div className={css.heroOuterBackground}>
          <div className={css.heroBlob1}></div>
          <div className={css.heroBlob2}></div>
        </div>

        <div className={css.heroInner}>
          <div className={css.heroIconHeader}>
            <PiggyBank3D size={56} />
          </div>
          <h1 className={css.heroTitle}>อัตราดอกเบี้ย</h1>
          <p className={css.heroSubtitle}>
            ตรวจสอบอัตราดอกเบี้ยเงินฝากและเงินกู้ล่าสุด สำหรับสมาชิกทุกคนของเรา
          </p>
          {formattedDate && (
            <span className={css.heroDate}>
              <CalendarOutlined className={css.heroDateIcon} />
              อัปเดตล่าสุดเมื่อวันที่ {formattedDate}
            </span>
          )}

          {/* Summary boxes */}
          {!loading && rates.length > 0 && (
            <div className={css.heroStats}>
              <div className={css.heroStat}>
                <span className={css.heroStatLabel}>เงินฝากสูงสุดถึง</span>
                <span className={css.heroStatValue}>
                  {Math.max(...depositRates.map((r) => parseFloat(r.interestRate || "0"))).toFixed(2)}
                  <small>%</small>
                </span>
                <span className={css.heroStatSubtext}>ต่อปี</span>
              </div>
              <div className={css.heroStatDivider} />
              <div className={css.heroStat}>
                <span className={css.heroStatLabel}>เงินกู้เริ่มต้นเพียง</span>
                <span className={`${css.heroStatValue} ${css.heroStatValueLoan}`}>
                  {Math.min(...loanRates.map((r) => parseFloat(r.interestRate || "99"))).toFixed(2)}
                  <small>%</small>
                </span>
                <span className={css.heroStatSubtext}>ต่อปี</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={css.tabWrapper}>
        <div className={css.tabBar}>
          {([
            { key: "all" as Tab, label: "อัตราทั้งหมด", icon: <AreaChartOutlined /> },
            { key: "deposit" as Tab, label: "ฝากเงิน (ผลตอบแทน)", icon: <SafetyCertificateOutlined /> },
            { key: "loan" as Tab, label: "กู้เงิน (ดอกเบี้ยต่ำ)", icon: <DollarOutlined /> },
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
            <span>กำลังโหลดข้อมูลอัตราดอกเบี้ย...</span>
          </div>
        ) : rates.length === 0 ? (
          <div className={css.empty}>ยังไม่มีข้อมูลอัตราดอกเบี้ยในขณะนี้</div>
        ) : (
          <>
            {/* Deposit section */}
            {(activeTab === "all" || activeTab === "deposit") && depositRates.length > 0 && (
              <div className={css.section}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIcon} ${css.sectionIconDeposit}`}>
                    <PiggyBank3D size={32} />
                  </div>
                  <div>
                    <h2 className={css.sectionTitle}>ผลตอบแทนเงินฝาก (เงินออม)</h2>
                    <p className={css.sectionSub}>รับดอกเบี้ยสูง คุ้มค่า ปลอดภัย มั่นคง 100%</p>
                  </div>
                  <span className={css.sectionCount}>{depositRates.length} ประเภท</span>
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
                    <HomeLoan3D size={32} />
                  </div>
                  <div>
                    <h2 className={css.sectionTitle}>อัตราดอกเบี้ยเงินกู้</h2>
                    <p className={css.sectionSub}>ดอกเบี้ยต่ำ เป็นธรรม มีทางเลือกหลากหลายให้เหมาะสมกับตัวคุณ</p>
                  </div>
                  <span className={css.sectionCount}>{loanRates.length} ประเภท</span>
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
                  <strong className={css.noticeTitle}>หมายเหตุที่ควรทราบ</strong>
                  <p className={css.noticeText}>
                    อัตราดอกเบี้ยอ้างอิงตามประกาศสหกรณ์ฯ และอาจมีการเปลี่ยนแปลงได้ตามมติคณะกรรมการดำเนินการชุดปัจจุบัน โปรดตรวจสอบข้อมูลอีกครั้งก่อนตัดสินใจ
                  </p>
                </div>
              </div>
              <a href="tel:026444633" className={css.noticePhone}>
                <PhoneOutlined /> โทรสอบถาม 02-644-4633 ต่อ 205
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
