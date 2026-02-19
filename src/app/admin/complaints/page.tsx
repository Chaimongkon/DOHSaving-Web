"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloseOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

interface ComplaintRecord {
  id: number;
  trackingCode: string;
  memberId: string | null;
  name: string | null;
  tel: string | null;
  email: string | null;
  category: string;
  subject: string | null;
  complaint: string | null;
  status: string;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  complaint: "ร้องเรียน",
  suggestion: "ข้อเสนอแนะ",
  inquiry: "สอบถาม",
};

const categoryClass: Record<string, string> = {
  complaint: css.catComplaint,
  suggestion: css.catSuggestion,
  inquiry: css.catInquiry,
};

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  reviewing: "กำลังตรวจสอบ",
  resolved: "เสร็จสิ้น",
  rejected: "ไม่รับพิจารณา",
};

const statusClass: Record<string, string> = {
  pending: css.statusPending,
  reviewing: css.statusReviewing,
  resolved: css.statusResolved,
  rejected: css.statusRejected,
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Detail modal
  const [selected, setSelected] = useState<ComplaintRecord | null>(null);
  const [adminNote, setAdminNote] = useState("");

  // Stats
  const [statPending, setStatPending] = useState(0);
  const [statReviewing, setStatReviewing] = useState(0);
  const [statResolved, setStatResolved] = useState(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/complaints?${params}`);
      const data = await res.json();
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // Fetch stats
      const [pRes, rRes, dRes] = await Promise.all([
        fetch("/api/admin/complaints?status=pending&page=1"),
        fetch("/api/admin/complaints?status=reviewing&page=1"),
        fetch("/api/admin/complaints?status=resolved&page=1"),
      ]);
      const [pData, rData, dData] = await Promise.all([pRes.json(), rRes.json(), dRes.json()]);
      setStatPending(pData.total || 0);
      setStatReviewing(rData.total || 0);
      setStatResolved(dData.total || 0);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: number, status: string, note?: string) => {
    try {
      await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNote: note }),
      });
      showToast("อัปเดตสำเร็จ");
      setSelected(null);
      fetchData();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const deleteComplaint = async (id: number) => {
    if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    try {
      await fetch(`/api/admin/complaints?id=${id}`, { method: "DELETE" });
      showToast("ลบสำเร็จ");
      fetchData();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const printPdf = (c: ComplaintRecord) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>เรื่องร้องเรียน ${c.trackingCode}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; font-size: 14px; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
  h2 { text-align: center; font-size: 16px; font-weight: 400; color: #666; margin-top: 0; }
  .line { border-bottom: 2px solid #1e3a5f; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  td { padding: 8px 12px; border: 1px solid #ddd; vertical-align: top; }
  td.label { width: 140px; background: #f5f5f5; font-weight: 700; color: #555; }
  .detail { margin-top: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; line-height: 1.8; white-space: pre-wrap; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
  .sig { margin-top: 60px; display: flex; justify-content: space-between; }
  .sig-box { text-align: center; width: 200px; }
  .sig-line { border-bottom: 1px solid #333; margin-bottom: 4px; height: 40px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</h1>
<h2>แบบฟอร์มรับเรื่องร้องเรียน / ข้อเสนอแนะ</h2>
<div class="line"></div>
<table>
  <tr><td class="label">รหัสติดตาม</td><td>${c.trackingCode}</td></tr>
  <tr><td class="label">ประเภท</td><td>${categoryLabels[c.category] || c.category}</td></tr>
  <tr><td class="label">วันที่รับเรื่อง</td><td>${new Date(c.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td></tr>
  <tr><td class="label">เลขสมาชิก</td><td>${c.memberId || "-"}</td></tr>
  <tr><td class="label">ชื่อ-สกุล</td><td>${c.name || "ผู้ไม่ประสงค์ออกนาม"}</td></tr>
  <tr><td class="label">เบอร์โทร</td><td>${c.tel || "-"}</td></tr>
  <tr><td class="label">อีเมล</td><td>${c.email || "-"}</td></tr>
  <tr><td class="label">เรื่อง</td><td>${c.subject || "-"}</td></tr>
  <tr><td class="label">สถานะ</td><td>${statusLabels[c.status] || c.status}</td></tr>
  ${c.adminNote ? `<tr><td class="label">หมายเหตุเจ้าหน้าที่</td><td>${c.adminNote}</td></tr>` : ""}
  ${c.resolvedAt ? `<tr><td class="label">วันที่เสร็จสิ้น</td><td>${new Date(c.resolvedAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</td></tr>` : ""}
</table>
<div style="margin-top:20px;font-weight:700;">รายละเอียด:</div>
<div class="detail">${c.complaint || "-"}</div>
<div class="sig">
  <div class="sig-box"><div class="sig-line"></div>ผู้รับเรื่อง<br><span style="font-size:12px;color:#999">วันที่ ......./......./..........</span></div>
  <div class="sig-box"><div class="sig-line"></div>ผู้ดำเนินการ<br><span style="font-size:12px;color:#999">วันที่ ......./......./..........</span></div>
  <div class="sig-box"><div class="sig-line"></div>ผู้อนุมัติ<br><span style="font-size:12px;color:#999">วันที่ ......./......./..........</span></div>
</div>
<div class="footer">พิมพ์จากระบบจัดการสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — ${new Date().toLocaleDateString("th-TH")}</div>
</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const exportCsv = () => {
    if (complaints.length === 0) return;
    const BOM = "\uFEFF";
    const header = ["รหัสติดตาม","ประเภท","เรื่อง","ชื่อผู้แจ้ง","เลขสมาชิก","เบอร์โทร","อีเมล","สถานะ","รายละเอียด","หมายเหตุเจ้าหน้าที่","วันที่แจ้ง","วันที่เสร็จ"].join(",");
    const rows = complaints.map(c => [
      c.trackingCode,
      categoryLabels[c.category] || c.category,
      `"${(c.subject || "").replace(/"/g, '""')}"`,
      c.name || "-",
      c.memberId || "-",
      c.tel || "-",
      c.email || "-",
      statusLabels[c.status] || c.status,
      `"${(c.complaint || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(c.adminNote || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      new Date(c.createdAt).toLocaleDateString("th-TH"),
      c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString("th-TH") : "-",
    ].join(","));
    const csv = BOM + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <div className={css.header}>
        <h1 className={css.title}>จัดการเรื่องร้องเรียน / ข้อเสนอแนะ</h1>
        <div className={css.toolbar}>
          <div className={css.searchBox}>
            <SearchOutlined style={{ color: "#9ca3af" }} />
            <input
              className={css.searchInput}
              placeholder="ค้นหารหัส ชื่อ หัวข้อ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className={css.filterSelect}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="reviewing">กำลังตรวจสอบ</option>
            <option value="resolved">เสร็จสิ้น</option>
            <option value="rejected">ไม่รับพิจารณา</option>
          </select>
          <button className={css.actionBtn} onClick={exportCsv} title="ส่งออก CSV">
            <DownloadOutlined /> CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={css.stats}>
        <div className={`${css.statCard} ${css.statTotal}`}>
          <div className={css.statNum}>{total}</div>
          <div className={css.statLabel}>ทั้งหมด</div>
        </div>
        <div className={`${css.statCard} ${css.statPending}`}>
          <div className={css.statNum}>{statPending}</div>
          <div className={css.statLabel}>รอดำเนินการ</div>
        </div>
        <div className={`${css.statCard} ${css.statReviewing}`}>
          <div className={css.statNum}>{statReviewing}</div>
          <div className={css.statLabel}>กำลังตรวจสอบ</div>
        </div>
        <div className={`${css.statCard} ${css.statResolved}`}>
          <div className={css.statNum}>{statResolved}</div>
          <div className={css.statLabel}>เสร็จสิ้น</div>
        </div>
      </div>

      {loading ? (
        <div className={css.loading}>กำลังโหลด...</div>
      ) : complaints.length === 0 ? (
        <div className={css.empty}>ไม่มีรายการ</div>
      ) : (
        <>
          <table className={css.table}>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ประเภท</th>
                <th>เรื่อง</th>
                <th>ผู้แจ้ง</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className={css.codeCell}>{c.trackingCode}</td>
                  <td>
                    <span className={`${css.categoryBadge} ${categoryClass[c.category] || ""}`}>
                      {categoryLabels[c.category] || c.category}
                    </span>
                  </td>
                  <td className={css.subjectCell}>{c.subject || "-"}</td>
                  <td className={css.nameCell}>
                    {c.name || "ไม่ระบุ"}
                    {c.memberId && <div style={{ fontSize: 10, color: "#9ca3af" }}>รหัส {c.memberId}</div>}
                  </td>
                  <td>
                    <span className={`${css.statusBadge} ${statusClass[c.status] || ""}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td className={css.dateCell}>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className={css.actions}>
                      <button className={css.actionBtn} title="ดูรายละเอียด" onClick={() => { setSelected(c); setAdminNote(c.adminNote || ""); }}>
                        <EyeOutlined />
                      </button>
                      <button className={css.actionBtn} title="พิมพ์ PDF" onClick={() => printPdf(c)}>
                        <PrinterOutlined />
                      </button>
                      <button className={`${css.actionBtn} ${css.actionBtnDanger}`} title="ลบ" onClick={() => deleteComplaint(c.id)}>
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={css.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${css.pageBtn} ${p === page ? css.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className={css.modalOverlay} onClick={() => setSelected(null)}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h2 className={css.modalTitle}>รายละเอียดเรื่อง #{selected.trackingCode}</h2>
              <button className={css.modalClose} onClick={() => setSelected(null)}><CloseOutlined /></button>
            </div>
            <div className={css.modalBody}>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>ประเภท</span>
                <span className={css.detailValue}>{categoryLabels[selected.category] || selected.category}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>เรื่อง</span>
                <span className={css.detailValue}>{selected.subject || "-"}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>ผู้แจ้ง</span>
                <span className={css.detailValue}>{selected.name || "ไม่ระบุ"}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>เลขสมาชิก</span>
                <span className={css.detailValue}>{selected.memberId || "-"}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>เบอร์โทร</span>
                <span className={css.detailValue}>{selected.tel || "-"}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>อีเมล</span>
                <span className={css.detailValue}>{selected.email || "-"}</span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>สถานะ</span>
                <span className={`${css.statusBadge} ${statusClass[selected.status] || ""}`}>
                  {statusLabels[selected.status] || selected.status}
                </span>
              </div>
              <div className={css.detailRow}>
                <span className={css.detailLabel}>วันที่แจ้ง</span>
                <span className={css.detailValue}>{formatDate(selected.createdAt)}</span>
              </div>

              <div className={css.detailBody}>{selected.complaint || "ไม่มีรายละเอียด"}</div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>หมายเหตุเจ้าหน้าที่:</label>
                <textarea
                  className={css.noteTextarea}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="บันทึกหมายเหตุ..."
                />
              </div>
            </div>
            <div className={css.modalActions}>
              <button className={css.modalActionBtn} onClick={() => updateStatus(selected.id, "reviewing", adminNote)}>
                กำลังตรวจสอบ
              </button>
              <button className={`${css.modalActionBtn} ${css.modalActionBtnPrimary}`} onClick={() => updateStatus(selected.id, "resolved", adminNote)}>
                ✓ ดำเนินการเสร็จ
              </button>
              <button className={css.modalActionBtn} onClick={() => updateStatus(selected.id, "rejected", adminNote)}>
                ไม่รับพิจารณา
              </button>
              <button className={css.modalActionBtn} onClick={() => printPdf(selected)}>
                <PrinterOutlined /> พิมพ์ PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={css.toast}>{toast}</div>}
    </>
  );
}
