"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    CalculatorOutlined,
    TableOutlined,
    InfoCircleOutlined,
    DollarOutlined,
    PieChartOutlined,
} from "@ant-design/icons";
import { HomeLoan3D } from "@/components/icons/ThreeDIcons";
import css from "./page.module.css";

/* ────────── Types ────────── */
interface LoanTypeOption {
    id: number;
    name: string;
    code: string;
    interestRate: number; // % per year
    maxAmount: number | null;
    maxTerm: number;
    defaultTerm: number;
    description: string | null;
}

type PaymentType = "annuity" | "equal-principal";

interface ScheduleRow {
    installment: number;
    principal: number;
    interest: number;
    total: number;
    remaining: number;
}

/* ────────── Calculation helpers ────────── */
function calculateAnnuity(
    loanAmount: number,
    annualRate: number,
    totalTerms: number
): { schedule: ScheduleRow[]; pmt: number } {
    const r = annualRate / 12 / 100;
    const schedule: ScheduleRow[] = [];

    if (r === 0) {
        // 0% interest edge case
        const pmt = Math.ceil(loanAmount / totalTerms);
        let remaining = loanAmount;
        for (let i = 1; i <= totalTerms; i++) {
            const principal = i === totalTerms ? remaining : pmt;
            remaining = Math.round((remaining - principal) * 100) / 100;
            schedule.push({
                installment: i,
                principal,
                interest: 0,
                total: principal,
                remaining: Math.max(remaining, 0),
            });
        }
        return { schedule, pmt };
    }

    // PMT formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const factor = Math.pow(1 + r, totalTerms);
    const pmtRaw = loanAmount * r * factor / (factor - 1);
    const pmt = Math.round(pmtRaw);

    let remaining = loanAmount;
    for (let i = 1; i <= totalTerms; i++) {
        const interestRaw = remaining * r;
        const interest = Math.round(interestRaw);

        let principal: number;
        let totalPayment: number;

        if (i === totalTerms) {
            // Last installment: pay off remaining
            principal = Math.round(remaining);
            totalPayment = principal + interest;
        } else {
            totalPayment = pmt;
            principal = totalPayment - interest;
        }

        remaining = remaining - principal;
        remaining = Math.round(remaining * 100) / 100;

        schedule.push({
            installment: i,
            principal,
            interest,
            total: totalPayment,
            remaining: Math.max(remaining, 0),
        });
    }

    return { schedule, pmt };
}

function calculateEqualPrincipal(
    loanAmount: number,
    annualRate: number,
    totalTerms: number
): { schedule: ScheduleRow[] } {
    const r = annualRate / 12 / 100;
    const principalPerTerm = Math.ceil(loanAmount / totalTerms / 100) * 100;
    const schedule: ScheduleRow[] = [];
    let remaining = loanAmount;

    for (let i = 1; i <= totalTerms; i++) {
        const interest = Math.round(remaining * r);
        const principal = i === totalTerms ? Math.round(remaining) : principalPerTerm;
        const total = principal + interest;
        remaining = remaining - principal;
        remaining = Math.round(remaining * 100) / 100;

        schedule.push({
            installment: i,
            principal,
            interest,
            total,
            remaining: Math.max(remaining, 0),
        });
    }

    return { schedule };
}

/* ────────── Number Formatting ────────── */
function fmt(n: number): string {
    return n.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtInt(n: number): string {
    return n.toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function formatWithCommas(raw: string): string {
    const cleaned = raw.replace(/,/g, "");
    const parts = cleaned.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function stripCommas(s: string): string {
    return s.replace(/,/g, "");
}

/* ────────── Component ────────── */
export default function LoanCalculatorPage() {
    const [loanTypes, setLoanTypes] = useState<LoanTypeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // Form state
    const [selectedType, setSelectedType] = useState<number | "">("");
    const [loanAmount, setLoanAmount] = useState<string>("");
    const [salary, setSalary] = useState<string>("");
    const [existingDebt, setExistingDebt] = useState<string>("");
    const [terms, setTerms] = useState<string>("");
    const [paymentType, setPaymentType] = useState<PaymentType>("annuity");

    const fetchLoanTypes = useCallback(async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const res = await fetch("/api/loan-types");
            if (!res.ok) throw new Error("fetch failed");
            const json = await res.json();
            const types = (json.loanTypes || []).map((t: Record<string, unknown>) => ({
                ...t,
                interestRate: Number(t.interestRate),
                maxAmount: t.maxAmount ? Number(t.maxAmount) : null,
            }));
            setLoanTypes(types);
            if (types.length > 0) {
                setSelectedType(types[0].id);
                setTerms(String(types[0].defaultTerm));
            }
        } catch {
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLoanTypes();
    }, [fetchLoanTypes]);

    const currentLoanType = loanTypes.find((t) => t.id === selectedType);
    const isEmergency = currentLoanType?.code?.toLowerCase() === "emergency";
    const isOrdinary = currentLoanType?.code?.toLowerCase() === "ordinary";

    // For emergency loan: loan amount = salary × 2, rounded down to nearest 100
    const computedEmergencyAmount = (() => {
        const sal = parseFloat(stripCommas(salary));
        if (!sal || sal <= 0) return 0;
        return Math.floor((sal * 2) / 100) * 100;
    })();

    // ── Derived values for validation ──
    const parsedAmount = isEmergency
        ? computedEmergencyAmount
        : parseFloat(stripCommas(loanAmount)) || 0;
    const parsedTerms = parseInt(terms) || 0;
    const maxTerm = currentLoanType?.maxTerm ?? 999;
    const maxAmount = currentLoanType?.maxAmount ?? null;

    // ── Validation errors ──
    const termsError = parsedTerms > maxTerm
        ? `จำนวนงวดเกินที่กำหนด (สูงสุด ${maxTerm} งวด)`
        : null;
    const amountError = maxAmount && parsedAmount > maxAmount
        ? `ยอดเงินกู้เกินวงเงินสูงสุด (${fmt(maxAmount)} บาท)`
        : null;
    const hasValidInput =
        parsedAmount > 0 &&
        parsedTerms > 0 &&
        !termsError &&
        !amountError;

    // ── Manual calculate (triggered by button) ──
    const [calcResult, setCalcResult] = useState<{
        schedule: { installment: number; principal: number; interest: number; total: number; remaining: number }[];
        summary: {
            monthlyPayment: number;
            totalInterest: number;
            totalPayment: number;
            loanAmount: number;
            period1Count: number;
            period1Amount: number;
            period2Count: number;
            period2Amount: number;
        };
    } | null>(null);

    const handleCalculate = useCallback(() => {
        if (!currentLoanType || !hasValidInput) return;

        const amount = parsedAmount;
        const numTerms = parsedTerms;

        if (paymentType === "annuity") {
            const { schedule: sched, pmt } = calculateAnnuity(
                amount,
                currentLoanType.interestRate,
                numTerms
            );
            const totalInterest = sched.reduce((s, r) => s + r.interest, 0);
            const totalPayment = sched.reduce((s, r) => s + r.total, 0);
            const lastRow = sched[sched.length - 1];

            setCalcResult({
                schedule: sched,
                summary: {
                    monthlyPayment: pmt,
                    totalInterest,
                    totalPayment,
                    loanAmount: amount,
                    period1Count: sched.length > 1 ? sched.length - 1 : 1,
                    period1Amount: pmt,
                    period2Count: sched.length > 1 ? 1 : 0,
                    period2Amount: lastRow.total,
                },
            });
        } else {
            const { schedule: sched } = calculateEqualPrincipal(
                amount,
                currentLoanType.interestRate,
                numTerms
            );
            const totalInterest = sched.reduce((s, r) => s + r.interest, 0);
            const totalPayment = sched.reduce((s, r) => s + r.total, 0);
            const higherPrincipal = Math.ceil(amount / numTerms / 100) * 100;
            const lowerPrincipal = Math.floor(amount / numTerms / 100) * 100;
            let period1Count: number;
            let period2Count: number;
            if (higherPrincipal === lowerPrincipal) {
                period1Count = numTerms;
                period2Count = 0;
            } else {
                period1Count = (amount - lowerPrincipal * numTerms) / (higherPrincipal - lowerPrincipal);
                period2Count = numTerms - period1Count;
            }

            setCalcResult({
                schedule: sched,
                summary: {
                    monthlyPayment: higherPrincipal,
                    totalInterest,
                    totalPayment,
                    loanAmount: amount,
                    period1Count,
                    period1Amount: higherPrincipal,
                    period2Count,
                    period2Amount: lowerPrincipal,
                },
            });
        }
    }, [currentLoanType, hasValidInput, parsedAmount, parsedTerms, paymentType]);

    const schedule = calcResult?.schedule ?? null;
    const summaryData = calcResult?.summary ?? null;

    // ── Pie chart data ──
    const principalPct = summaryData
        ? Math.round((summaryData.loanAmount / summaryData.totalPayment) * 100)
        : 0;
    const interestPct = summaryData ? 100 - principalPct : 0;

    // ── Handlers ──
    const handleTypeChange = (id: number) => {
        setSelectedType(id);
        const lt = loanTypes.find((t) => t.id === id);
        if (lt) setTerms(String(lt.defaultTerm));
        setSalary("");
        setLoanAmount("");
        setExistingDebt("");
        setCalcResult(null);
    };

    const handleDebtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        setExistingDebt(formatWithCommas(raw));
        setCalcResult(null);
    };

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        setSalary(formatWithCommas(raw));
        setCalcResult(null);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        setLoanAmount(formatWithCommas(raw));
        setCalcResult(null);
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        setTerms(raw);
        setCalcResult(null);
    };

    return (
        <>
            {/* ── Hero Section ── */}
            <div className={css.hero}>
                <div className={css.heroOuterBackground}>
                    <div className={css.heroBlob1} />
                    <div className={css.heroBlob2} />
                </div>
                <div className={css.heroInner}>
                    <div className={css.heroIconHeader}>
                        <HomeLoan3D size={40} />
                    </div>
                    <h1 className={css.heroTitle}>คำนวณเงินกู้โดยประมาณ</h1>
                    <p className={css.heroSubtitle}>
                        ประมาณการผ่อนชำระเงินกู้ พร้อมตารางชำระรายงวดแบบละเอียด
                    </p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className={css.content}>
                {loading ? (
                    <div className={css.loading}>
                        <div className={css.spinner} />
                        <span>กำลังโหลดข้อมูลประเภทเงินกู้...</span>
                    </div>
                ) : fetchError ? (
                    <div className={css.loading}>
                        <span>ไม่สามารถโหลดข้อมูลประเภทเงินกู้ได้</span>
                        <button type="button" className={css.calcBtn} onClick={fetchLoanTypes} style={{ marginTop: 8 }}>
                            ลองใหม่
                        </button>
                    </div>
                ) : loanTypes.length === 0 ? (
                    <div className={css.loading}>
                        <span>ยังไม่มีข้อมูลประเภทเงินกู้ในขณะนี้</span>
                    </div>
                ) : (
                    <>
                        {/* ── Calculator Form ── */}
                        <div className={css.calcCard}>
                            <h2 className={css.calcTitle}>
                                <span className={css.calcTitleIcon}>
                                    <CalculatorOutlined />
                                </span>
                                กรอกข้อมูลเงินกู้
                            </h2>

                            <div className={css.formGrid}>
                                {/* Loan Type */}
                                <div className={css.formGroup}>
                                    <label htmlFor="loan-type" className={`${css.formLabel} ${css.formLabelRequired}`}>
                                        ประเภทเงินกู้
                                    </label>
                                    <select
                                        id="loan-type"
                                        className={css.formSelect}
                                        value={selectedType}
                                        onChange={(e) => handleTypeChange(Number(e.target.value))}
                                    >
                                        {loanTypes.map((lt) => (
                                            <option key={lt.id} value={lt.id}>
                                                {lt.name} — ดอกเบี้ย {lt.interestRate.toFixed(2)}%/ปี
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Salary (emergency) or Loan Amount */}
                                {isEmergency ? (
                                    <>
                                        <div className={css.formGroup}>
                                            <label htmlFor="salary" className={`${css.formLabel} ${css.formLabelRequired}`}>
                                                เงินเดือน (บาท)
                                            </label>
                                            <input
                                                id="salary"
                                                className={css.formInput}
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="เช่น 33,190"
                                                value={salary}
                                                onChange={handleSalaryChange}
                                            />
                                            <span className={css.formHint}>
                                                กู้ฉุกเฉินได้ 2 เท่าของเงินเดือน (ปัดลงหลักร้อย)
                                            </span>
                                        </div>
                                        <div className={css.formGroup}>
                                            <label htmlFor="emergency-amount" className={css.formLabel}>
                                                ยอดเงินกู้ที่สามารถกู้ได้ (บาท)
                                            </label>
                                            <input
                                                id="emergency-amount"
                                                className={css.formInput}
                                                type="text"
                                                readOnly
                                                value={computedEmergencyAmount > 0 ? fmt(computedEmergencyAmount) : ""}
                                                placeholder="กรอกเงินเดือนเพื่อคำนวณ"
                                                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                                            />
                                            {amountError ? (
                                                <span className={css.formError}>{amountError}</span>
                                            ) : currentLoanType?.maxAmount ? (
                                                <span className={css.formHint}>
                                                    วงเงินสูงสุด: {fmt(currentLoanType.maxAmount)} บาท
                                                </span>
                                            ) : null}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={css.formGroup}>
                                            <label htmlFor="loan-amount" className={`${css.formLabel} ${css.formLabelRequired}`}>
                                                ยอดเงินกู้ (บาท)
                                            </label>
                                            <input
                                                id="loan-amount"
                                                className={`${css.formInput} ${amountError ? css.formInputError : ""}`}
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="เช่น 66,300"
                                                value={loanAmount}
                                                onChange={handleAmountChange}
                                            />
                                            {amountError ? (
                                                <span className={css.formError}>{amountError}</span>
                                            ) : currentLoanType?.maxAmount ? (
                                                <span className={css.formHint}>
                                                    วงเงินสูงสุด: {fmt(currentLoanType.maxAmount)} บาท
                                                </span>
                                            ) : null}
                                        </div>
                                        {isOrdinary && (
                                            <>
                                                <div className={css.formGroup}>
                                                    <label htmlFor="existing-debt" className={css.formLabel}>
                                                        หนี้เดิมคงเหลือ (บาท)
                                                    </label>
                                                    <input
                                                        id="existing-debt"
                                                        className={css.formInput}
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="เช่น 100,000 (ไม่บังคับ)"
                                                        value={existingDebt}
                                                        onChange={handleDebtChange}
                                                    />
                                                    <span className={css.formHint}>
                                                        กรอกยอดหนี้เงินกู้เดิมที่ยังค้างชำระ (ถ้ามี)
                                                    </span>
                                                </div>
                                                {parsedAmount > 0 && parseFloat(stripCommas(existingDebt)) > 0 && (
                                                    <div className={css.formGroup}>
                                                        <label htmlFor="net-amount" className={css.formLabel}>
                                                            ยอดสุทธิที่จะได้รับ (บาท)
                                                        </label>
                                                        <input
                                                            id="net-amount"
                                                            className={css.formInput}
                                                            type="text"
                                                            readOnly
                                                            value={(() => {
                                                                const net = parsedAmount - (parseFloat(stripCommas(existingDebt)) || 0);
                                                                return net > 0 ? fmt(net) : "0.00";
                                                            })()}
                                                            style={{
                                                                backgroundColor: "#f0fdf4",
                                                                cursor: "not-allowed",
                                                                color: parsedAmount - (parseFloat(stripCommas(existingDebt)) || 0) > 0 ? "#16a34a" : "#dc2626",
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                        {parsedAmount - (parseFloat(stripCommas(existingDebt)) || 0) <= 0 && (
                                                            <span className={css.formError}>
                                                                หนี้เดิมมากกว่าหรือเท่ากับยอดเงินกู้ ไม่มียอดสุทธิที่จะได้รับ
                                                            </span>
                                                        )}
                                                        <span className={css.formHintWarning}>
                                                            * ยอดสุทธิที่จะได้รับจริงอาจน้อยกว่านี้ เนื่องจากต้องหักค่าเบี้ยประกัน และเงินค้ำประกันกองทุนเงินกู้อีกด้วย
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Terms */}
                                <div className={css.formGroup}>
                                    <label htmlFor="terms" className={css.formLabel}>จำนวนงวด</label>
                                    <input
                                        id="terms"
                                        className={`${css.formInput} ${termsError ? css.formInputError : ""}`}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={`สูงสุด ${currentLoanType?.maxTerm || 12} งวด`}
                                        value={terms}
                                        onChange={handleTermsChange}
                                    />
                                    {termsError ? (
                                        <span className={css.formError}>{termsError}</span>
                                    ) : currentLoanType ? (
                                        <span className={css.formHint}>
                                            สูงสุด {currentLoanType.maxTerm} งวด
                                        </span>
                                    ) : null}
                                </div>

                                {/* Payment Type */}
                                <div className={css.formGroup}>
                                    <label htmlFor="payment-type" className={`${css.formLabel} ${css.formLabelRequired}`}>
                                        ประเภทการชำระ
                                    </label>
                                    <div className={css.radioGroup}>
                                        <button
                                            type="button"
                                            className={`${css.radioOption} ${paymentType === "annuity" ? css.radioOptionActive : ""}`}
                                            onClick={() => { setPaymentType("annuity"); setCalcResult(null); }}
                                        >
                                            <DollarOutlined />
                                            ต้น+ดอกเท่ากัน
                                        </button>
                                        <button
                                            type="button"
                                            className={`${css.radioOption} ${paymentType === "equal-principal" ? css.radioOptionActive : ""}`}
                                            onClick={() => { setPaymentType("equal-principal"); setCalcResult(null); }}
                                        >
                                            <DollarOutlined />
                                            ต้นเท่ากัน
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Calculate Button */}
                            <div className={css.calcBtnWrapper}>
                                <button
                                    type="button"
                                    className={css.calcBtn}
                                    disabled={!hasValidInput}
                                    onClick={handleCalculate}
                                >
                                    <CalculatorOutlined />
                                    คำนวณ
                                </button>
                            </div>
                        </div>

                        {/* ── Results ── */}
                        {schedule && summaryData && (
                            <div className={css.resultSection}>
                                {/* Hero Card - Monthly Payment */}
                                <div className={css.heroCard}>
                                    <div className={css.heroCardLabel}>
                                        {paymentType === "annuity"
                                            ? "ยอดผ่อนชำระต่องวด (ประมาณ)"
                                            : "เงินต้นชำระต่องวด (ประมาณ)"}
                                    </div>
                                    <div className={css.heroCardAmount}>
                                        {fmt(summaryData.monthlyPayment)}
                                        <span className={css.heroCardUnit}>บาท</span>
                                    </div>
                                </div>

                                {/* 3 Stat Cards */}
                                <div className={css.statsGrid}>
                                    <div className={css.miniCard}>
                                        <div className={css.miniCardIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                                            <DollarOutlined />
                                        </div>
                                        <div className={css.miniCardBody}>
                                            <div className={css.miniCardLabel}>อัตราดอกเบี้ย</div>
                                            <div className={css.miniCardValue}>
                                                {currentLoanType?.interestRate.toFixed(2)}%<span className={css.miniCardSuffix}>/ปี</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={css.miniCard}>
                                        <div className={css.miniCardIcon} style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                                            <DollarOutlined />
                                        </div>
                                        <div className={css.miniCardBody}>
                                            <div className={css.miniCardLabel}>ดอกเบี้ยรวม</div>
                                            <div className={css.miniCardValue}>{fmtInt(summaryData.totalInterest)} <span className={css.miniCardSuffix}>บาท</span></div>
                                        </div>
                                    </div>
                                    <div className={css.miniCard}>
                                        <div className={css.miniCardIcon} style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                                            <DollarOutlined />
                                        </div>
                                        <div className={css.miniCardBody}>
                                            <div className={css.miniCardLabel}>ยอดชำระรวมทั้งหมด</div>
                                            <div className={`${css.miniCardValue} ${css.miniCardValueGreen}`}>{fmtInt(summaryData.totalPayment)} <span className={css.miniCardSuffix}>บาท</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Amount Card — only for Ordinary loans with existing debt */}
                                {isOrdinary && parseFloat(stripCommas(existingDebt)) > 0 && (
                                    <div className={css.netAmountCard}>
                                        <div className={css.netAmountRow}>
                                            <div className={css.netAmountItem}>
                                                <span className={css.netAmountLabel}>ยอดเงินกู้</span>
                                                <span className={css.netAmountValue}>{fmtInt(parsedAmount)} บาท</span>
                                            </div>
                                            <span className={css.netAmountOp}>−</span>
                                            <div className={css.netAmountItem}>
                                                <span className={css.netAmountLabel}>หนี้เดิมคงเหลือ</span>
                                                <span className={css.netAmountValueDebt}>{fmtInt(parseFloat(stripCommas(existingDebt)) || 0)} บาท</span>
                                            </div>
                                            <span className={css.netAmountOp}>=</span>
                                            <div className={css.netAmountItem}>
                                                <span className={css.netAmountLabel}>ยอดสุทธิที่จะได้รับ</span>
                                                <span className={css.netAmountValueNet}>
                                                    {(() => {
                                                        const net = parsedAmount - (parseFloat(stripCommas(existingDebt)) || 0);
                                                        return net > 0 ? fmtInt(net) : "0";
                                                    })()} บาท
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Period + Pie Chart row */}
                                <div className={css.middleRow}>
                                    {/* Period Breakdown */}
                                    <div className={css.periodCard}>
                                        <h3 className={css.periodTitle}>
                                            <span className={css.periodBadge}>
                                                <DollarOutlined />
                                            </span>
                                            รายละเอียดการชำระ
                                        </h3>
                                        <table className={css.periodTable}>
                                            <thead>
                                                <tr>
                                                    <th>ช่วง</th>
                                                    <th>จำนวนงวด</th>
                                                    <th>ชำระต่องวด</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <span className={css.periodBadgeSm}>1</span>
                                                        ช่วงที่ 1
                                                    </td>
                                                    <td>{summaryData.period1Count} งวด</td>
                                                    <td>{fmt(summaryData.period1Amount)} บาท</td>
                                                </tr>
                                                {summaryData.period2Count > 0 && (
                                                    <tr>
                                                        <td>
                                                            <span className={css.periodBadgeSm}>2</span>
                                                            ช่วงที่ 2
                                                        </td>
                                                        <td>{summaryData.period2Count} งวด</td>
                                                        <td>{fmt(summaryData.period2Amount)} บาท</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pie Chart Card */}
                                    <div className={css.chartCard}>
                                        <h3 className={css.chartTitle}>
                                            <PieChartOutlined />
                                            สัดส่วนชำระ
                                        </h3>
                                        <div className={css.donutWrapper}>
                                            <div
                                                className={css.donut}
                                                style={{
                                                    background: `conic-gradient(#2563eb 0% ${principalPct}%, #f97316 ${principalPct}% 100%)`,
                                                }}
                                            >
                                                <div className={css.donutHole}>
                                                    <span className={css.donutPct}>{principalPct}%</span>
                                                    <span className={css.donutPctLabel}>เงินต้น</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={css.chartLegend}>
                                            <div className={css.legendItem}>
                                                <span className={css.legendDot} style={{ background: "#2563eb" }} />
                                                <span>เงินต้น {fmtInt(summaryData.loanAmount)} บาท ({principalPct}%)</span>
                                            </div>
                                            <div className={css.legendItem}>
                                                <span className={css.legendDot} style={{ background: "#f97316" }} />
                                                <span>ดอกเบี้ย {fmtInt(summaryData.totalInterest)} บาท ({interestPct}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Table */}
                                <div className={css.tableCard}>
                                    <div className={css.tableHeader}>
                                        <h3 className={css.tableTitle}>
                                            <span className={css.tableTitleIcon}>
                                                <TableOutlined />
                                            </span>
                                            ตารางประมาณการชำระ
                                        </h3>
                                    </div>
                                    <div className={css.tableWrapper}>
                                        <table className={css.scheduleTable}>
                                            <thead>
                                                <tr>
                                                    <th>งวด</th>
                                                    <th>ชำระเงินต้น</th>
                                                    <th>ดอกเบี้ย</th>
                                                    <th>รวมชำระ</th>
                                                    <th>คงเหลือ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {schedule.map((row, idx) => (
                                                    <tr
                                                        key={row.installment}
                                                        className={
                                                            idx === schedule.length - 1 ? css.lastRow : undefined
                                                        }
                                                    >
                                                        <td>{row.installment}</td>
                                                        <td className={css.colPrincipal}>
                                                            {fmt(row.principal)}
                                                        </td>
                                                        <td className={css.colInterest}>
                                                            {fmt(row.interest)}
                                                        </td>
                                                        <td className={css.colTotal}>{fmt(row.total)}</td>
                                                        <td className={css.colRemaining}>
                                                            {fmt(row.remaining)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td>รวม</td>
                                                    <td className={css.colPrincipal}>
                                                        {fmt(
                                                            schedule.reduce((s, r) => s + r.principal, 0)
                                                        )}
                                                    </td>
                                                    <td className={css.colInterest}>
                                                        {fmt(
                                                            schedule.reduce((s, r) => s + r.interest, 0)
                                                        )}
                                                    </td>
                                                    <td className={css.colTotal}>
                                                        {fmt(schedule.reduce((s, r) => s + r.total, 0))}
                                                    </td>
                                                    <td>—</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Notice */}
                                <div className={css.notice}>
                                    <InfoCircleOutlined className={css.noticeIcon} />
                                    <div className={css.noticeContent}>
                                        <p className={css.noticeTitle}>หมายเหตุ</p>
                                        <p className={css.noticeText}>
                                            ผลการคำนวณเป็นเพียงการประมาณการเท่านั้น
                                            ยอดชำระจริงอาจแตกต่างเล็กน้อยขึ้นอยู่กับการปัดเศษและเงื่อนไขของสหกรณ์
                                            กรุณาติดต่อฝ่ายสินเชื่อเพื่อข้อมูลที่ถูกต้องแม่นยำ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
