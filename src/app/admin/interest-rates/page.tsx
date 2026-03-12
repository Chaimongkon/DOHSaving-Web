"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Calendar, Landmark, Coins } from "lucide-react";
import css from "./page.module.css";

interface Rate {
  id?: number;
  interestType: string;
  name: string;
  interestDate: string;
  conditions: string;
  interestRate: string;
  interestRateDual: string;
  isActive: boolean;
  _new?: boolean;
}

type Tab = "all" | "deposit" | "loan";

export default function AdminInterestRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [globalDate, setGlobalDate] = useState("");

  useEffect(() => {
    fetch("/api/admin/interest-rates")
      .then((r) => r.json())
      .then((d) => {
        const mapped: Rate[] = (d.rates || []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          interestType: (r.interestType as string) || "deposit",
          name: (r.name as string) || "",
          interestDate: r.interestDate
            ? new Date(r.interestDate as string).toISOString().slice(0, 10)
            : "",
          conditions: (r.conditions as string) || "",
          interestRate: (r.interestRate as string) || "",
          interestRateDual: (r.interestRateDual as string) || "",
          isActive: r.isActive !== false,
        }));
        setRates(mapped);
        // Set global date from first rate that has a date
        const firstDate = mapped.find((r) => r.interestDate)?.interestDate;
        if (firstDate) setGlobalDate(firstDate);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const update = (index: number, field: keyof Rate, value: string | boolean) => {
    setRates((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleAdd = (type: string) => {
    setRates((prev) => [
      ...prev,
      {
        interestType: type,
        name: "",
        interestDate: globalDate,
        conditions: "",
        interestRate: "",
        interestRateDual: "",
        isActive: true,
        _new: true,
      },
    ]);
  };

  const handleDelete = async (index: number) => {
    const rate = rates[index];
    if (!confirm(`ลบ "${rate.name || "รายการนี้"}" ?`)) return;

    if (rate.id) {
      await fetch(`/api/admin/interest-rates?id=${rate.id}`, { method: "DELETE" });
    }
    setRates((prev) => prev.filter((_, i) => i !== index));
    showToast("ลบเรียบร้อย");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Apply global date to all rates
      const toSave = rates.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        interestType: r.interestType,
        name: r.name,
        interestDate: globalDate || r.interestDate || null,
        conditions: r.conditions || null,
        interestRate: r.interestRate || null,
        interestRateDual: r.interestRateDual || null,
        isActive: r.isActive,
      }));

      const res = await fetch("/api/admin/interest-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: toSave }),
      });

      if (!res.ok) throw new Error();
      showToast("บันทึกเรียบร้อย");

      // Reload
      const d = await fetch("/api/admin/interest-rates").then((r) => r.json());
      const mapped: Rate[] = (d.rates || []).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        interestType: (r.interestType as string) || "deposit",
        name: (r.name as string) || "",
        interestDate: r.interestDate
          ? new Date(r.interestDate as string).toISOString().slice(0, 10)
          : "",
        conditions: (r.conditions as string) || "",
        interestRate: (r.interestRate as string) || "",
        interestRateDual: (r.interestRateDual as string) || "",
        isActive: r.isActive !== false,
      }));
      setRates(mapped);
    } catch {
      showToast("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const filtered = rates.filter((r) => activeTab === "all" || r.interestType === activeTab);

  if (loading) return <div className={css.loading}>กำลังโหลด...</div>;

  return (
    <div className={css.page}>
      {/* ── Hero Header ── */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            <Landmark size={28} />
          </div>
          <div>
            <h1 className={css.title}>จัดการอัตราดอกเบี้ย</h1>
            <p className={css.subtitle}>กำหนดอัตราดอกเบี้ยเงินฝากและเงินกู้ รวมถึงวันที่เริ่มมีผลบังคับใช้</p>
          </div>
        </div>
        <div className={css.headerActions}>
          <button className={css.addBtn} onClick={() => handleAdd(activeTab === "loan" ? "loan" : "deposit")}>
            <Plus size={18} /> เพิ่มอัตราใหม่
          </button>
          <button className={css.saveBtn} onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>

      {/* ── Settings Bar (Date & Tabs) ── */}
      <div className={css.settingsBar}>
        <div className={css.dateRow}>
          <Calendar size={18} color="#0284c7" />
          <span className={css.dateLabel}>วันที่เริ่มมีผลบังคับใช้:</span>
          <input
            type="date"
            className={css.dateInput}
            value={globalDate}
            onChange={(e) => setGlobalDate(e.target.value)}
          />
        </div>

        <div className={css.tabs}>
          {(
            [
              { key: "all", label: "ทั้งหมด", icon: null },
              { key: "deposit", label: "เงินฝาก", icon: "/images/financial-icons/deposit.png" },
              { key: "loan", label: "เงินกู้", icon: "/images/financial-icons/loan.png" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              className={`${css.tab} ${activeTab === t.key ? css.tabActive : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon && <img src={t.icon} alt={t.label} />}
              {t.label} ({rates.filter((r) => t.key === "all" || r.interestType === t.key).length})
            </button>
          ))}
        </div>
      </div>

      {/* ── Rate Table ── */}
      <div className={css.tableContainer}>
        <table className={css.table}>
          <thead>
            <tr>
              <th className={css.th}>ชื่อรายการ / เงื่อนไข</th>
              <th className={css.th} style={{ width: "15%" }}>ประเภท</th>
              <th className={css.th} style={{ width: "15%", textAlign: "right" }}>ดอกเบี้ย (%)</th>
              <th className={css.th} style={{ width: "15%", textAlign: "right" }}>เรทปี 3 (%)</th>
              <th className={css.th} style={{ width: "10%", textAlign: "center" }}>สถานะ</th>
              <th className={css.th} style={{ width: "8%", textAlign: "center" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={css.emptyState}>
                    <Coins size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <p style={{ margin: 0 }}>ยังไม่มีข้อมูลอัตราดอกเบี้ย — กดปุ่ม "เพิ่มอัตราใหม่"</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((rate, _fi) => {
                const realIndex = rates.indexOf(rate);
                return (
                  <tr key={rate.id || `new-${_fi}`} className={`${css.tableRow} ${rate._new ? css.tableRowNew : ""}`}>
                    {/* Name + Conditions */}
                    <td className={css.td}>
                      <input
                        className={css.rateInput}
                        placeholder="ชื่อรายการ เช่น ออมทรัพย์, เงินกู้สามัญ"
                        value={rate.name}
                        onChange={(e) => update(realIndex, "name", e.target.value)}
                        style={{ fontWeight: 600, color: "#1e293b" }}
                      />
                      <input
                        className={css.rateInput}
                        placeholder="เงื่อนไข (ถ้ามี) เช่น ตั้งแต่บาทแรก"
                        value={rate.conditions}
                        onChange={(e) => update(realIndex, "conditions", e.target.value)}
                        style={{ marginTop: 4, fontSize: 12, color: "#64748b", background: "#f8fafc" }}
                      />
                    </td>

                    {/* Type */}
                    <td className={css.td}>
                      <select
                        className={css.rateInput}
                        value={rate.interestType}
                        onChange={(e) => update(realIndex, "interestType", e.target.value)}
                        style={{ background: "#f8fafc", fontWeight: 600, color: rate.interestType === 'deposit' ? '#059669' : '#0284c7' }}
                      >
                        <option value="deposit">เงินฝาก</option>
                        <option value="loan">เงินกู้</option>
                      </select>
                    </td>

                    {/* Rate 1 */}
                    <td className={css.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <input
                          className={css.rateInputSmall}
                          placeholder="0.00"
                          value={rate.interestRate}
                          onChange={(e) => update(realIndex, "interestRate", e.target.value)}
                        />
                        {rate.interestRateDual && (
                          <span className={css.dualLabel}>ปีแรก</span>
                        )}
                      </div>
                    </td>

                    {/* Rate 2 */}
                    <td className={css.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <input
                          className={css.rateInputSmall}
                          placeholder="—"
                          value={rate.interestRateDual}
                          onChange={(e) => update(realIndex, "interestRateDual", e.target.value)}
                        />
                        {rate.interestRateDual && (
                          <span className={css.dualLabel}>ตั้งแต่ปีที่ 3</span>
                        )}
                      </div>
                    </td>

                    {/* Active Toggle */}
                    <td className={css.td} style={{ textAlign: "center" }}>
                      <div className={css.toggleWrap}>
                        <button
                          className={`${css.toggleBtn} ${rate.isActive ? css.toggleOn : css.toggleOff}`}
                          onClick={() => update(realIndex, "isActive", !rate.isActive)}
                          title={rate.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          type="button"
                        />
                      </div>
                    </td>

                    {/* Delete */}
                    <td className={css.td} style={{ textAlign: "center" }}>
                      <button className={css.deleteBtn} onClick={() => handleDelete(realIndex)} title="ลบรายการ">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
