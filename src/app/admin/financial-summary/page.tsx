"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, Trash2, X, UploadCloud, Link as LinkIcon, Download, FileText, CheckCircle, XCircle, LayoutGrid, Settings2, ChevronDown } from "lucide-react";
import css from "./page.module.css";

const MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const LAST_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function autoTitle(month: number, year: number): string {
  const lastDay = LAST_DAYS[month - 1] || 31;
  return `รายการย่อแสดงสินทรัพย์และหนี้สิน ณ วันที่ ${lastDay} ${MONTHS_FULL[month - 1]} ${year}`;
}

interface FinItem {
  id?: number;
  year: number;
  month: number;
  title: string;
  fileUrl: string;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  totalMembers: string;
  isActive: boolean;
}

const currentBE = new Date().getFullYear() + 543;
const empty: FinItem = { year: currentBE, month: 1, title: "", fileUrl: "", totalAssets: "", totalLiabilities: "", totalEquity: "", totalMembers: "", isActive: true };


export default function AdminFinancialSummaryPage() {
  const [items, setItems] = useState<FinItem[]>([]);
  const [editing, setEditing] = useState<FinItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(currentBE);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLoaded = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/financial-summary");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      // Auto-select year with data on first load
      if (!initialLoaded.current && data.length > 0) {
        const dataYears = (Array.from(new Set(data.map((i: FinItem) => i.year))) as number[]).sort((a, b) => b - a);
        if (dataYears.length > 0 && !dataYears.includes(filterYear)) {
          setFilterYear(dataYears[0]);
        }
        initialLoaded.current = true;
      }
    }
  }, [filterYear]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => i.year === filterYear);
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
  if (!years.includes(currentBE)) years.unshift(currentBE);

  /* ── Upload PDF ── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์ PDF หรือรูปภาพ");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "financial-summary");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, fileUrl: data.url });
      } else {
        const err = await res.json().catch(() => ({}));
        alert("อัปโหลดไม่สำเร็จ: " + (err.error || res.statusText));
      }
    } catch (err) {
      alert("อัปโหลดไม่สำเร็จ: " + String(err));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    if (!editing) return;
    const method = isNew ? "POST" : "PATCH";
    const generatedTitle = editing.title || autoTitle(editing.month, editing.year);
    const payload: Record<string, unknown> = {
      year: editing.year,
      month: editing.month,
      title: generatedTitle,
      fileUrl: editing.fileUrl || null,
      totalAssets: editing.totalAssets ? parseFloat(editing.totalAssets.replace(/,/g, "")) : null,
      totalLiabilities: editing.totalLiabilities ? parseFloat(editing.totalLiabilities.replace(/,/g, "")) : null,
      totalEquity: editing.totalEquity ? parseFloat(editing.totalEquity.replace(/,/g, "")) : null,
      totalMembers: editing.totalMembers ? parseInt(editing.totalMembers.replace(/,/g, "")) : null,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/financial-summary", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/admin/financial-summary?id=${id}`, { method: "DELETE" });
    load();
  };

  // Helper func to format number with commas
  const formatNumberForInput = (val: string | number | null | undefined) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className={css.container}>
      {/* ── Hero Header ── */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className={css.title}>รายการย่อแสดงสินทรัพย์และหนี้สิน</h1>
            <p className={css.subtitle}>จัดการภาพรวมงบการเงิน อัปโหลดไฟล์ PDF รายเดือน และข้อมูลสรุปตัวเลขสถานะการเงิน</p>
          </div>
        </div>

        <div className={css.headerControls}>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className={css.filterSelect}>
            {years.map((y) => <option key={y} value={y}>ปี พ.ศ. {y}</option>)}
          </select>
          <button onClick={() => { setEditing({ ...empty, year: filterYear }); setIsNew(true); }} className={css.addBtn}>
            <Plus size={18} /> เพิ่มเดือนใหม่
          </button>
        </div>
      </div>

      {/* ── Edit / Create Modal ── */}
      {editing && (
        <div className={css.modalOverlay} onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>{isNew ? "เพิ่มข้อมูลรายการย่อแสดงสินทรัพย์และหนี้สินใหม่" : "แก้ไขข้อมูลรายการย่อแสดงสินทรัพย์และหนี้สิน"}</h3>
              <button className={css.modalClose} onClick={() => { setEditing(null); setIsNew(false); }} title="ปิดหน้าต่าง">
                <X size={20} />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Left Column: PDF Upload */}
              <div className={css.leftCol}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} color="#0369a1" /> ไฟล์ PDF รายงาน</span>
                  </label>
                  <p className={css.formHint} style={{ marginBottom: '8px', marginTop: 0 }}>
                    อัปโหลดไฟล์เอกสาร (PDF) รายการย่อแสดงสินทรัพย์และหนี้สินประจำเดือน
                  </p>

                  {editing.fileUrl ? (
                    <div className={css.uploadedFile}>
                      <img src="/images/pdf-placeholder.png" alt="PDF" className={css.pdfIconLarge} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> อัปโหลดไฟล์เรียบร้อย
                      </span>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <a href={editing.fileUrl} target="_blank" rel="noopener noreferrer" className={css.pdfBtn}>
                          <Download size={14} /> เปิดดูไฟล์
                        </a>
                        <button onClick={() => setEditing({ ...editing, fileUrl: "" })} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trash2 size={14} /> ลบไฟล์ออก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={css.uploadSection} onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={48} className={css.uploadIcon} />
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>
                        {uploading ? "กำลังอัพโหลด..." : "คลิกหรือลากไฟล์ PDF มาวางที่นี่"}
                      </p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>รองรับไฟล์ .PDF หรือภาพ JPG/PNG ขนาดไม่เกิน 10MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleUpload} style={{ display: "none" }} />
                </div>
              </div>

              {/* Right Column: Information & Manual Data Override */}
              <div className={css.rightCol}>
                <div className={css.formRow}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>เลือกเดือน</label>
                    <select className={css.formInput} value={editing.month} onChange={(e) => setEditing({ ...editing, month: parseInt(e.target.value) })}>
                      {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ปี พ.ศ.</label>
                    <input className={css.formInput} type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: parseInt(e.target.value) || currentBE })} />
                  </div>
                </div>

                <div className={css.dateTitleBox}>
                  ระบบจะสร้างชื่อรายการอัตโนมัติ: <br />
                  <strong>{autoTitle(editing.month, editing.year)}</strong>
                </div>

                <details className={css.advancedToggle}>
                  <summary className={css.advancedSummary}>
                    <Settings2 size={16} color="#0284c7" />
                    การตั้งค่าขั้นสูง (Advanced Settings)
                    <ChevronDown size={16} color="#94a3b8" style={{ marginLeft: "auto" }} />
                  </summary>

                  <div className={css.advancedContent}>
                    <div>
                      <div className={css.statHeader}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/financial-icons/assets.png" alt="Assets" />
                        <div>
                          <h4 className={css.statHeaderTitle}>หมวดสินทรัพย์ (Assets)</h4>
                          <p className={css.statHeaderSubtitle}>กรณีต้องการให้แสดงตัวเลขสรุปในหน้าเว็บ (ไม่บังคับ)</p>
                        </div>
                      </div>
                      <div className={css.formGroup}>
                        <label className={css.formLabel}>รวมสินทรัพย์ (บาท)</label>
                        <div className={css.currencyWrap}>
                          <span className={css.currencySymbol}>฿</span>
                          <input className={css.formInputCurrency} placeholder="เช่น 1,234,567.89" type="text" value={editing.totalAssets || ""} onChange={(e) => setEditing({ ...editing, totalAssets: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <div className={css.statHeader}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/financial-icons/liabilities.png" alt="Liabilities" />
                        <div>
                          <h4 className={css.statHeaderTitle}>หมวดหนี้สินและทุน (Liabilities & Equity)</h4>
                          <p className={css.statHeaderSubtitle}>กรณีต้องการให้แสดงตัวเลขสรุปในหน้าเว็บ (ไม่บังคับ)</p>
                        </div>
                      </div>
                      <div className={css.formRow}>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>รวมหนี้สิน</label>
                          <div className={css.currencyWrap}>
                            <span className={css.currencySymbol}>฿</span>
                            <input className={css.formInputCurrency} placeholder="0.00" type="text" value={editing.totalLiabilities || ""} onChange={(e) => setEditing({ ...editing, totalLiabilities: e.target.value })} />
                          </div>
                        </div>
                        <div className={css.formGroup}>
                          <label className={css.formLabel}>รวมทุน</label>
                          <div className={css.currencyWrap}>
                            <span className={css.currencySymbol}>฿</span>
                            <input className={css.formInputCurrency} placeholder="0.00" type="text" value={editing.totalEquity || ""} onChange={(e) => setEditing({ ...editing, totalEquity: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>

              </div>
            </div>

            <div className={css.modalFooter}>
              <button className={css.cancelBtn} onClick={() => { setEditing(null); setIsNew(false); }}>
                ยกเลิกการเปลี่ยนแปลง
              </button>
              <button className={css.saveBtn} onClick={save}>
                บันทึกบัญชีรายการย่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ── */}
      <div className={css.tableContainer}>
        <table className={css.table}>
          <thead>
            <tr>
              <th className={css.th}>เดือน / ปี</th>
              <th className={css.th}>ชื่อรายการ (อ้างอิงรายเดือน)</th>
              <th className={css.th} style={{ textAlign: "center" }}>เอกสารแนบ</th>
              <th className={css.th} style={{ textAlign: "center" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => a.month - b.month).map((item) => (
              <tr key={item.id} className={css.tableRow}>
                <td className={css.td} style={{ width: "15%" }}>
                  <span className={css.monthBadge}>
                    {MONTHS_SHORT[item.month - 1]} {item.year}
                  </span>
                </td>
                <td className={css.td} style={{ width: "45%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: "40px", height: "40px", background: "#f1f5f9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                      <FileText size={20} />
                    </div>
                    <p className={css.itemTitle}>{item.title || autoTitle(item.month, item.year)}</p>
                  </div>
                </td>
                <td className={css.td} style={{ textAlign: "center", width: "20%" }}>
                  {item.fileUrl ? (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={css.pdfBtn}>
                      <FileText size={16} /> โหลด PDF
                    </a>
                  ) : <span className={css.noPdf}><XCircle size={16} /> ไม่มีไฟล์แนบ</span>}
                </td>
                <td className={css.td} style={{ textAlign: "center", width: "20%" }}>
                  <div className={css.actions}>
                    <button className={`${css.actionIconBtn} ${css.editBtn}`} onClick={() => { setEditing({ ...item, totalAssets: item.totalAssets?.toString() || "", totalLiabilities: item.totalLiabilities?.toString() || "", totalEquity: item.totalEquity?.toString() || "", totalMembers: item.totalMembers?.toString() || "" }); setIsNew(false); }} title="แก้ไขข้อมูลตัวเลข/PDF">
                      <Edit2 size={18} />
                    </button>
                    <button className={`${css.actionIconBtn} ${css.deleteBtn}`} onClick={() => item.id && remove(item.id)} title="ลบรายการนี้ทิ้ง">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className={css.emptyState}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                    <LayoutGrid size={48} color="#cbd5e1" />
                    <p style={{ margin: 0, fontSize: "15px", color: "#64748b" }}>ไม่มีรายการย่อแสดงสินทรัพย์และหนี้สิน สำหรับปี พ.ศ. {filterYear}</p>
                    <button onClick={() => { setEditing({ ...empty, year: filterYear }); setIsNew(true); }} className={css.addBtn} style={{ marginTop: "8px" }}>
                      <Plus size={16} /> เพิ่มรายการแรกของปีนี้
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
