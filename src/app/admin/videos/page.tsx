"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined,
  LoadingOutlined, PlayCircleOutlined, YoutubeOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from "@ant-design/icons";

/* ── Types ── */
interface Video {
  id?: number;
  title: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: Video = { title: "", youtubeUrl: "", description: "", sortOrder: 0, isActive: true };

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [editing, setEditing] = useState<Video | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  /* ── Load ── */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/videos", { credentials: "include" });
      if (res.ok) setVideos(await res.json());
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ── Extract YouTube ID for preview ── */
  const extractId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  /* ── Save ── */
  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อวิดีโอ");
    if (!editing.youtubeUrl.trim()) return alert("กรุณาวางลิงก์ YouTube");

    const ytId = extractId(editing.youtubeUrl);
    if (!ytId) return alert("ลิงก์ YouTube ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");

    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? { title: editing.title, youtubeUrl: editing.youtubeUrl, description: editing.description, sortOrder: editing.sortOrder, isActive: editing.isActive }
        : { id: editing.id, title: editing.title, youtubeUrl: editing.youtubeUrl, description: editing.description, sortOrder: editing.sortOrder, isActive: editing.isActive };

      const res = await fetch("/api/admin/videos", {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "บันทึกไม่สำเร็จ");
      } else {
        setEditing(null);
        load();
      }
    } catch { alert("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  /* ── Delete ── */
  const del = async (id: number) => {
    if (!confirm("ลบวิดีโอนี้?")) return;
    await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const livePreviewId = editing ? extractId(editing.youtubeUrl) : null;

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          <YoutubeOutlined style={{ marginRight: 8, color: "#ef4444" }} />
          จัดการวิดีโอสหกรณ์
        </h1>
        {!editing && (
          <button
            onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            <PlusOutlined /> เพิ่มวิดีโอ
          </button>
        )}
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            {isNew ? "เพิ่มวิดีโอใหม่" : "แก้ไขวิดีโอ"}
          </h3>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#374151" }}>ชื่อวิดีโอ *</label>
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="เช่น กิจกรรมวันสถาปนาสหกรณ์ 2567"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#374151" }}>ลิงก์ YouTube *</label>
              <input
                value={editing.youtubeUrl}
                onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "monospace" }}
              />
            </div>

            {/* Live YouTube Preview */}
            {livePreviewId && (
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <div style={{ position: "relative", paddingTop: "56.25%" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${livePreviewId}`}
                    title="Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#374151" }}>คำอธิบาย</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#374151" }}>ลำดับ</label>
                <input
                  type="number"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  เผยแพร่
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <LoadingOutlined /> : <SaveOutlined />} บันทึก
            </button>
            <button
              onClick={() => setEditing(null)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            >
              <CloseOutlined /> ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Video List ── */}
      {videos.length === 0 && !editing ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <YoutubeOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }} />
          <p>ยังไม่มีวิดีโอ</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {videos.map((v) => (
            <div key={v.id} style={{ display: "flex", gap: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, alignItems: "center" }}>
              {/* Thumbnail */}
              <div
                onClick={() => setPreviewId(previewId === v.youtubeId ? null : (v.youtubeId || null))}
                style={{ width: 200, minWidth: 200, height: 112, borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative", background: "#000", flexShrink: 0 }}
              >
                {previewId === v.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt={v.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`;
                      }}
                    />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}>
                      <PlayCircleOutlined style={{ fontSize: 36, color: "#fff" }} />
                    </div>
                  </>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{v.title}</h3>
                  {!v.isActive && (
                    <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>ซ่อน</span>
                  )}
                </div>
                {v.description && (
                  <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>{v.description}</p>
                )}
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{v.youtubeUrl}</p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => { setEditing({ ...v }); setIsNew(false); }}
                  title="แก้ไข"
                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#4b5563" }}
                >
                  <EditOutlined />
                </button>
                <button
                  onClick={() => v.id && del(v.id)}
                  title="ลบ"
                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #fecaca", borderRadius: 8, background: "#fef2f2", cursor: "pointer", color: "#dc2626" }}
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
