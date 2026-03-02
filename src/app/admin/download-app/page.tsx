"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  SaveOutlined, UploadOutlined, LoadingOutlined,
  PictureOutlined, AndroidOutlined, AppleOutlined,
  DeleteOutlined, LinkOutlined, QrcodeOutlined,
} from "@ant-design/icons";

interface DownloadAppData {
  id?: number;
  title: string;
  description: string;
  androidQrUrl: string;
  androidStoreUrl: string;
  iosQrUrl: string;
  iosStoreUrl: string;
  huaweiQrUrl: string;
  huaweiStoreUrl: string;
  infographicUrl: string;
  infographic2Url: string;
}

const defaults: DownloadAppData = {
  title: "", description: "",
  androidQrUrl: "", androidStoreUrl: "",
  iosQrUrl: "", iosStoreUrl: "",
  huaweiQrUrl: "", huaweiStoreUrl: "",
  infographicUrl: "", infographic2Url: "",
};

export default function AdminDownloadAppPage() {
  const [data, setData] = useState<DownloadAppData>({ ...defaults });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetFieldRef = useRef<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/download-app", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setData({
          id: d.id,
          title: d.title || "",
          description: d.description || "",
          androidQrUrl: d.androidQrUrl || "",
          androidStoreUrl: d.androidStoreUrl || "",
          iosQrUrl: d.iosQrUrl || "",
          iosStoreUrl: d.iosStoreUrl || "",
          huaweiQrUrl: d.huaweiQrUrl || "",
          huaweiStoreUrl: d.huaweiStoreUrl || "",
          infographicUrl: d.infographicUrl || "",
          infographic2Url: d.infographic2Url || "",
        });
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = targetFieldRef.current;
    if (!file || !field) return;
    if (!file.type.startsWith("image/")) { alert("รองรับเฉพาะไฟล์รูปภาพ"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("ขนาดไฟล์ต้องไม่เกิน 10MB"); return; }

    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "download-app");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setData((prev) => ({ ...prev, [field]: result.url }));
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploadingField(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerUpload = (field: string) => {
    targetFieldRef.current = field;
    fileInputRef.current?.click();
  };

  const clearField = (field: string) => {
    setData((prev) => ({ ...prev, [field]: "" }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/download-app", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.ok) {
        alert("บันทึกสำเร็จ");
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "บันทึกไม่สำเร็จ");
      }
    } catch { alert("บันทึกไม่สำเร็จ"); }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 };
  const sectionStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 16 };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>
        <LoadingOutlined style={{ fontSize: 24 }} /><br />กำลังโหลดข้อมูล...
      </div>
    );
  }

  const qrPlatforms = [
    { key: "android", label: "Android (Google Play)", icon: <AndroidOutlined style={{ color: "#34a853" }} />, qrField: "androidQrUrl", urlField: "androidStoreUrl", color: "#34a853", bg: "#f0fdf4" },
    { key: "ios", label: "iOS (App Store)", icon: <AppleOutlined style={{ color: "#1d1d1f" }} />, qrField: "iosQrUrl", urlField: "iosStoreUrl", color: "#007aff", bg: "#eff6ff" },
    { key: "huawei", label: "Huawei (AppGallery)", icon: <span style={{ fontSize: 16, fontWeight: 800, color: "#c4122e" }}>H</span>, qrField: "huaweiQrUrl", urlField: "huaweiStoreUrl", color: "#c4122e", bg: "#fef2f2" },
  ] as const;

  return (
    <div style={{ padding: 24 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>หน้าดาวน์โหลดแอป</h1>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>จัดการ QR Code, ลิงก์ดาวน์โหลด และรูปโฆษณาสำหรับหน้า /download-app</p>
        </div>
        <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", background: saving ? "#d1d5db" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}>
          {saving ? <LoadingOutlined /> : <SaveOutlined />} บันทึกทั้งหมด
        </button>
      </div>

      {/* Title & Description */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>ข้อความบนหน้าเพจ</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>หัวข้อหน้า</label>
            <input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} placeholder="เช่น ดาวน์โหลดแอป DOH Saving" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>คำอธิบาย</label>
            <input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} placeholder="เช่น ดาวน์โหลดแอปเพื่อใช้บริการ..." style={inputStyle} />
          </div>
        </div>
      </div>

      {/* QR Codes */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>
          <QrcodeOutlined style={{ color: "#E8652B", marginRight: 6 }} />
          QR Code ดาวน์โหลด
        </h3>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px" }}>อัปโหลด QR Code สำหรับแต่ละ Store พร้อมลิงก์ดาวน์โหลด</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {qrPlatforms.map((p) => {
            const qrUrl = data[p.qrField as keyof DownloadAppData] as string;
            const storeUrl = data[p.urlField as keyof DownloadAppData] as string;
            const isUploading = uploadingField === p.qrField;

            return (
              <div key={p.key} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: p.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb" }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{p.label}</span>
                </div>

                {/* QR Preview */}
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  {qrUrl ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrUrl} alt={`QR ${p.label}`} style={{ width: 140, height: 140, borderRadius: 8, border: "1px solid #e5e7eb", objectFit: "contain", background: "#fff" }} />
                      <button onClick={() => clearField(p.qrField)} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><DeleteOutlined /></button>
                    </div>
                  ) : (
                    <div style={{ width: 140, height: 140, margin: "0 auto", borderRadius: 8, border: "2px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", background: "#fff" }}>
                      <QrcodeOutlined style={{ fontSize: 32 }} />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => triggerUpload(p.qrField)}
                  disabled={isUploading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 12px", background: isUploading ? "#d1d5db" : "#fff", color: isUploading ? "#9ca3af" : p.color, border: `1px solid ${isUploading ? "#d1d5db" : p.color}`, borderRadius: 8, cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 12, marginBottom: 10 }}
                >
                  {isUploading ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> อัปโหลด QR Code</>}
                </button>

                <label style={labelStyle}><LinkOutlined /> ลิงก์ Store</label>
                <input
                  value={storeUrl}
                  onChange={(e) => setData({ ...data, [p.urlField]: e.target.value })}
                  placeholder="https://..."
                  style={{ ...inputStyle, fontSize: 11 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Infographic */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>
          <PictureOutlined style={{ color: "#E8652B", marginRight: 6 }} />
          รูป Infographic โฆษณา
        </h3>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px" }}>รูปโฆษณาแอปที่จะแสดงบนหน้า download (แนะนำขนาดใหญ่ ความกว้าง 800px ขึ้นไป)</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { field: "infographicUrl", label: "รูปโฆษณาหลัก" },
            { field: "infographic2Url", label: "รูปโฆษณาเสริม (ถ้ามี)" },
          ].map((item) => {
            const url = data[item.field as keyof DownloadAppData] as string;
            const isUploading = uploadingField === item.field;
            return (
              <div key={item.field} style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: 16, background: "#f9fafb" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 12px" }}>{item.label}</p>
                {url ? (
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={item.label} style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }} />
                    <button onClick={() => clearField(item.field)} style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}><DeleteOutlined /></button>
                  </div>
                ) : (
                  <div style={{ height: 160, borderRadius: 8, border: "2px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", marginBottom: 12 }}>
                    <PictureOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
                <button
                  onClick={() => triggerUpload(item.field)}
                  disabled={isUploading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 14px", background: isUploading ? "#d1d5db" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  {isUploading ? <><LoadingOutlined /> กำลังอัปโหลด...</> : <><UploadOutlined /> เลือกรูป</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
