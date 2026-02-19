"use client";

import React, { useState, useEffect } from "react";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
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
      .catch(() => {})
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
      <div className={css.header}>
        <h1 className={css.title}>จัดการอัตราดอกเบี้ย</h1>
        <div className={css.headerActions}>
          <button className={css.addBtn} onClick={() => handleAdd(activeTab === "loan" ? "loan" : "deposit")}>
            <PlusOutlined /> เพิ่มรายการ
          </button>
          <button className={css.saveBtn} onClick={handleSave} disabled={saving}>
            <SaveOutlined /> {saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
          </button>
        </div>
      </div>

      {/* Global date */}
      <div className={css.dateRow}>
        <CalendarOutlined />
        <span className={css.dateLabel}>วันที่มีผล:</span>
        <input
          type="date"
          className={css.dateInput}
          value={globalDate}
          onChange={(e) => setGlobalDate(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className={css.tabs}>
        {([
          { key: "all", label: "ทั้งหมด" },
          { key: "deposit", label: "เงินฝาก" },
          { key: "loan", label: "เงินกู้" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            className={`${css.tab} ${activeTab === t.key ? css.tabActive : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} ({rates.filter((r) => t.key === "all" || r.interestType === t.key).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={css.rateTable}>
        <div className={css.rateTableHead}>
          <span>ชื่อ / เงื่อนไข</span>
          <span>ประเภท</span>
          <span>ดอกเบี้ย %</span>
          <span>เรท 2 %</span>
          <span>สถานะ</span>
          <span></span>
        </div>

        {filtered.length === 0 ? (
          <div className={css.empty}>ยังไม่มีข้อมูล — กดปุ่ม &quot;เพิ่มรายการ&quot;</div>
        ) : (
          filtered.map((rate, _fi) => {
            const realIndex = rates.indexOf(rate);
            return (
              <div key={rate.id || `new-${_fi}`} className={css.rateRow}>
                {/* Name + Conditions */}
                <div>
                  <input
                    className={css.rateInput}
                    placeholder="ชื่อ เช่น ออมทรัพย์, เงินกู้สามัญ"
                    value={rate.name}
                    onChange={(e) => update(realIndex, "name", e.target.value)}
                  />
                  <input
                    className={css.rateInput}
                    placeholder="เงื่อนไข (ถ้ามี)"
                    value={rate.conditions}
                    onChange={(e) => update(realIndex, "conditions", e.target.value)}
                    style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}
                  />
                </div>

                {/* Type */}
                <select
                  className={css.rateInput}
                  value={rate.interestType}
                  onChange={(e) => update(realIndex, "interestType", e.target.value)}
                >
                  <option value="deposit">เงินฝาก</option>
                  <option value="loan">เงินกู้</option>
                </select>

                {/* Rate 1 */}
                <div>
                  <input
                    className={css.rateInputSmall}
                    placeholder="0.00"
                    value={rate.interestRate}
                    onChange={(e) => update(realIndex, "interestRate", e.target.value)}
                  />
                  {rate.interestRateDual && (
                    <div className={css.dualLabel}>ปีแรก</div>
                  )}
                </div>

                {/* Rate 2 (dual) */}
                <div>
                  <input
                    className={css.rateInputSmall}
                    placeholder="—"
                    value={rate.interestRateDual}
                    onChange={(e) => update(realIndex, "interestRateDual", e.target.value)}
                  />
                  {rate.interestRateDual && (
                    <div className={css.dualLabel}>ตั้งแต่ปีที่ 3</div>
                  )}
                </div>

                {/* Active toggle */}
                <button
                  className={`${css.toggleBtn} ${rate.isActive ? css.toggleOn : css.toggleOff}`}
                  onClick={() => update(realIndex, "isActive", !rate.isActive)}
                />

                {/* Delete */}
                <button className={css.deleteBtn} onClick={() => handleDelete(realIndex)}>
                  <DeleteOutlined />
                </button>
              </div>
            );
          })
        )}
      </div>

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
