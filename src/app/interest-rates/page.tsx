"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PiggyBank, HandCoins, CalendarDays, Info, Phone, Calculator, ArrowRight } from "lucide-react";
import { type Rate, type RateValue, groupLoans, tidyDeposits, toNumber } from "./rateGroups";
import css from "./page.module.css";

/** ป้ายตัวเลขดอกเบี้ย: พื้นกรมท่า ตัวเลขขาวตัวใหญ่ แบบป้ายบอกระยะทางหลวง — อ่านชัดทุกวัย */
function RateSign({ value, tone = "navy", big = false }: { value: string; tone?: "navy" | "orange"; big?: boolean }) {
  return (
    <span className={`${css.sign} ${tone === "orange" ? css.signOrange : ""} ${big ? css.signBig : ""}`}>
      <span className={css.signNum}>{value || "—"}</span>
      <span className={css.signUnit}>
        <span className={css.signPct}>%</span>
        <span className={css.signYear}>ต่อปี</span>
      </span>
    </span>
  );
}

/** อัตราเดียว หรืออัตราสองช่วง (ดอกเบี้ยจูงใจ: ช่วงแรก → ช่วงหลัง) */
function RateCell({ value, caption }: { value?: RateValue; caption?: string }) {
  if (!value) return <span className={css.none} aria-label="ไม่มีประเภทนี้">—</span>;
  if (!value.laterRate) {
    if (!caption) return <RateSign value={value.rate} />;
    return (
      <span className={css.step}>
        <span className={css.stepLabel}>{caption}</span>
        <RateSign value={value.rate} />
      </span>
    );
  }
  return (
    <span className={css.stepped}>
      <span className={css.step}>
        <span className={css.stepLabel}>{value.firstLabel}</span>
        <RateSign value={value.rate} tone="orange" />
      </span>
      <ArrowRight className={css.stepArrow} size={18} strokeWidth={2.2} aria-hidden="true" />
      <span className={css.step}>
        <span className={css.stepLabel}>{value.laterLabel}</span>
        <RateSign value={value.laterRate} />
      </span>
    </span>
  );
}

export default function InterestRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/interest-rates")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRates(d.rates || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const deposits = useMemo(() => tidyDeposits(rates.filter((r) => r.interestType === "deposit")), [rates]);
  const loans = useMemo(() => groupLoans(rates.filter((r) => r.interestType === "loan")), [rates]);

  // ตัวเลขสรุปใน hero — บอกชื่อผลิตภัณฑ์กำกับเสมอ จะได้ไม่เข้าใจผิด
  const topDeposit = useMemo(() => {
    let best: { rate: number; name: string } | null = null;
    for (const d of deposits.rows) {
      const n = toNumber(d.rate);
      if (n !== null && (!best || n > best.rate)) best = { rate: n, name: d.name };
    }
    return best;
  }, [deposits]);

  const lowLoan = useMemo(() => {
    let best: { rate: number; name: string; note?: string } | null = null;
    for (const row of loans) {
      for (const [v, variant] of [
        [row.withRefund, "มีเฉลี่ยคืน"],
        [row.withoutRefund, "ไม่มีเฉลี่ยคืน"],
        [row.plain, ""],
      ] as const) {
        const n = toNumber(v?.rate);
        if (v && n !== null && (!best || n < best.rate)) {
          // ชื่อดอกเบี้ยจูงใจมี "คงที่ 2 ปีแรก" อยู่แล้ว — ตัดออกเพราะ note จะบอกซ้ำ
          const baseName = v.laterRate ? row.name.replace(/\s*คงที่\s*\d+\s*ปีแรก/, "") : row.name;
          best = {
            rate: n,
            name: variant ? `${baseName} (${variant})` : baseName,
            // อัตราโปรโมชันต้องบอกว่าใช้แค่ช่วงแรก ไม่อย่างนั้นสมาชิกจะเข้าใจผิดว่าเป็นอัตราตลอดสัญญา
            note: v.laterRate ? `อัตรา ${v.firstLabel} จากนั้น ${v.laterRate}%` : undefined,
          };
        }
      }
    }
    return best;
  }, [loans]);

  const effectiveDate = rates.find((r) => r.interestDate)?.interestDate;
  const formattedDate = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <>
      {/* ── Hero: สั้น กระชับ บอกตัวเลขสำคัญทันที ── */}
      <section className={css.hero}>
        <div className={css.heroInner}>
          <div className={css.heroCopy}>
            <p className={css.eyebrow}>
              <span className={css.eyebrowRule} />
              INTEREST RATES
            </p>
            <h1 className={css.heroTitle}>อัตราดอกเบี้ย</h1>
            <p className={css.heroLead}>อัตราดอกเบี้ยเงินฝากและเงินกู้ล่าสุด สำหรับสมาชิกทุกท่าน</p>
            {formattedDate && (
              <span className={css.dateChip}>
                <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
                ข้อมูล ณ วันที่ {formattedDate}
              </span>
            )}
          </div>

          {!loading && (topDeposit || lowLoan) && (
            <div className={css.summary}>
              {topDeposit && (
                <a href="#deposit" className={css.summaryCard}>
                  <span className={css.summaryLabel}>
                    <PiggyBank size={17} strokeWidth={2} aria-hidden="true" /> เงินฝาก สูงสุด
                  </span>
                  <span className={css.summaryValue}>
                    {topDeposit.rate.toFixed(2)}<small>% ต่อปี</small>
                  </span>
                  <span className={css.summaryName}>{topDeposit.name}</span>
                </a>
              )}
              {lowLoan && (
                <a href="#loan" className={`${css.summaryCard} ${css.summaryCardLoan}`}>
                  <span className={css.summaryLabel}>
                    <HandCoins size={17} strokeWidth={2} aria-hidden="true" /> เงินกู้ ต่ำสุด
                  </span>
                  <span className={css.summaryValue}>
                    {lowLoan.rate.toFixed(2)}<small>% ต่อปี</small>
                  </span>
                  <span className={css.summaryName}>{lowLoan.name}</span>
                  {lowLoan.note && <span className={css.summaryNote}>{lowLoan.note}</span>}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className={css.content}>
        {loading ? (
          <div className={css.state}>กำลังโหลดข้อมูลอัตราดอกเบี้ย...</div>
        ) : rates.length === 0 ? (
          <div className={css.state}>ยังไม่มีข้อมูลอัตราดอกเบี้ยในขณะนี้</div>
        ) : (
          <>
            {/* ── เงินฝาก ── */}
            {deposits.rows.length > 0 && (
              <section id="deposit" className={css.section} aria-labelledby="deposit-title">
                <header className={css.sectionHead}>
                  <span className={css.sectionIcon} aria-hidden="true"><PiggyBank size={24} strokeWidth={1.9} /></span>
                  <div className={css.sectionText}>
                    <h2 id="deposit-title" className={css.sectionTitle}>อัตราดอกเบี้ยเงินฝาก</h2>
                    <p className={css.sectionSub}>ดอกเบี้ยที่สมาชิกได้รับจากการออมกับสหกรณ์</p>
                  </div>
                  {deposits.allTaxFree && <span className={css.tag}>ทุกประเภทไม่เสียภาษี</span>}
                </header>

                <table className={css.table}>
                  <thead>
                    <tr>
                      <th scope="col">ประเภทเงินฝาก</th>
                      <th scope="col" className={css.colRate}>อัตราดอกเบี้ย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.rows.map((d) => {
                      const isTop = topDeposit !== null && toNumber(d.rate) === topDeposit.rate;
                      return (
                        <tr key={d.id} className={isTop ? css.rowTop : undefined}>
                          <th scope="row" className={css.nameCell}>
                            <span className={css.name}>{d.name}</span>
                            {isTop && <span className={css.topBadge}>สูงสุด</span>}
                            {d.note && <span className={css.note}>{d.note}</span>}
                          </th>
                          <td className={css.rateCell} data-label="อัตราดอกเบี้ย">
                            <RateSign value={d.rate} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {/* ── เงินกู้ ── */}
            {loans.length > 0 && (
              <section id="loan" className={css.section} aria-labelledby="loan-title">
                <header className={css.sectionHead}>
                  <span className={`${css.sectionIcon} ${css.sectionIconLoan}`} aria-hidden="true"><HandCoins size={24} strokeWidth={1.9} /></span>
                  <div className={css.sectionText}>
                    <h2 id="loan-title" className={css.sectionTitle}>อัตราดอกเบี้ยเงินกู้</h2>
                    <p className={css.sectionSub}>เทียบแบบมีและไม่มีเงินเฉลี่ยคืนได้ในแถวเดียวกัน</p>
                  </div>
                </header>

                <table className={`${css.table} ${css.loanTable}`}>
                  <thead>
                    <tr>
                      <th scope="col">ประเภทเงินกู้</th>
                      <th scope="col" className={css.colRate}>มีเฉลี่ยคืน</th>
                      <th scope="col" className={css.colRate}>ไม่มีเฉลี่ยคืน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" className={css.nameCell}>
                          <span className={css.name}>{row.name}</span>
                        </th>
                        {row.plain && !row.withRefund && !row.withoutRefund ? (
                          /* ข้อมูลไม่ได้ระบุว่ามี/ไม่มีเฉลี่ยคืน — ครอบสองคอลัมน์และบอกให้ชัด
                             ไม่อย่างนั้นตัวเลขกลางแถวจะดูเหมือนอยู่คอลัมน์ใดคอลัมน์หนึ่ง */
                          <td colSpan={2} className={`${css.rateCell} ${css.rateCellSpan}`} data-label="อัตราดอกเบี้ย">
                            <RateCell value={row.plain} caption="ไม่แยกประเภทเฉลี่ยคืน" />
                          </td>
                        ) : (
                          <>
                            {/* ช่องที่ไม่มีข้อมูล ซ่อนบนมือถือ (บนจอใหญ่คงขีดไว้ให้คอลัมน์ตรงกัน) */}
                            <td className={`${css.rateCell} ${row.withRefund ? "" : css.rateCellEmpty}`} data-label="มีเฉลี่ยคืน">
                              <RateCell value={row.withRefund} />
                            </td>
                            <td className={`${css.rateCell} ${row.withoutRefund ? "" : css.rateCellEmpty}`} data-label="ไม่มีเฉลี่ยคืน">
                              <RateCell value={row.withoutRefund} />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* อธิบายคำที่สมาชิกหลายคนไม่แน่ใจ */}
                <div className={css.explain}>
                  <Info className={css.explainIcon} size={22} strokeWidth={2} aria-hidden="true" />
                  <div>
                    <p className={css.explainTitle}>&ldquo;มีเฉลี่ยคืน&rdquo; กับ &ldquo;ไม่มีเฉลี่ยคืน&rdquo; ต่างกันอย่างไร</p>
                    <ul className={css.explainList}>
                      <li><strong>มีเฉลี่ยคืน</strong> — อัตราดอกเบี้ยสูงกว่า แต่เมื่อสิ้นปีบัญชี สมาชิกจะได้รับเงินเฉลี่ยคืนตามสัดส่วนดอกเบี้ยที่จ่ายในปีนั้น (อัตราขึ้นกับผลการดำเนินงานแต่ละปี)</li>
                      <li><strong>ไม่มีเฉลี่ยคืน</strong> — อัตราดอกเบี้ยต่ำกว่าตั้งแต่แรก แต่ไม่ได้รับเงินเฉลี่ยคืนจากเงินกู้ประเภทนี้</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ── ขั้นต่อไป ── */}
            <div className={css.next}>
              <Link href="/services/loan-calculator" className={css.nextCard}>
                <span className={css.nextIcon} aria-hidden="true"><Calculator size={22} strokeWidth={2} /></span>
                <span className={css.nextBody}>
                  <span className={css.nextTitle}>คำนวณค่างวดเงินกู้</span>
                  <span className={css.nextText}>ลองคำนวณยอดผ่อนต่อเดือนจากอัตราดอกเบี้ยข้างต้น</span>
                </span>
                <ArrowRight size={20} strokeWidth={2.2} className={css.nextArrow} aria-hidden="true" />
              </Link>
              <a href="tel:026444633" className={css.nextCard}>
                <span className={css.nextIcon} aria-hidden="true"><Phone size={22} strokeWidth={2} /></span>
                <span className={css.nextBody}>
                  <span className={css.nextTitle}>โทรสอบถาม 02-644-4633 ต่อ 205</span>
                  <span className={css.nextText}>จันทร์ – ศุกร์ 08:30 – 16:15 น.</span>
                </span>
                <ArrowRight size={20} strokeWidth={2.2} className={css.nextArrow} aria-hidden="true" />
              </a>
            </div>

            <p className={css.disclaimer}>
              อัตราดอกเบี้ยเป็นไปตามประกาศของสหกรณ์ และอาจเปลี่ยนแปลงได้ตามมติคณะกรรมการดำเนินการ
              โปรดตรวจสอบกับเจ้าหน้าที่อีกครั้งก่อนตัดสินใจ
            </p>
          </>
        )}
      </div>
    </>
  );
}
