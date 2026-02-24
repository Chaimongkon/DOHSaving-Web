"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined,
  UploadOutlined, LoadingOutlined, PictureOutlined, CameraOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from "@ant-design/icons";
import { ImagePlus, Trash2 } from "lucide-react";

/* ── Types ── */
interface Album {
  id?: number;
  title: string;
  description: string;
  coverUrl: string;
  eventDate: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { photos: number };
}

interface Photo {
  id: number;
  albumId: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

const empty: Album = { title: "", description: "", coverUrl: "", eventDate: "", sortOrder: 0, isActive: true };

export default function AdminActivityAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [editing, setEditing] = useState<Album | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Photo management
  const [photoAlbumId, setPhotoAlbumId] = useState<number | null>(null);
  const [photoAlbumTitle, setPhotoAlbumTitle] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  /* ── Load albums ── */
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/activity-albums", { credentials: "include" });
    if (res.ok) setAlbums(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Load photos for album ── */
  const loadPhotos = useCallback(async (albumId: number) => {
    const res = await fetch(`/api/admin/activity-photos?albumId=${albumId}`, { credentials: "include" });
    if (res.ok) setPhotos(await res.json());
  }, []);

  /* ── Save album ── */
  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("กรุณาระบุชื่ออัลบั้ม");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      title: editing.title.trim(),
      description: editing.description?.trim() || null,
      coverUrl: editing.coverUrl || null,
      eventDate: editing.eventDate || null,
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;

    const res = await fetch("/api/admin/activity-albums", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.ok) { setEditing(null); setIsNew(false); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  /* ── Delete album ── */
  const removeAlbum = async (id: number) => {
    if (!confirm("ลบอัลบั้มนี้พร้อมรูปภาพทั้งหมด?")) return;
    await fetch(`/api/admin/activity-albums?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  /* ── Upload cover ── */
  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "activity-albums");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (editing) setEditing({ ...editing, coverUrl: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploading(false);
  };

  /* ── Upload multiple photos ── */
  const uploadPhotosHandler = async (files: FileList) => {
    if (!photoAlbumId) return;
    setUploadingPhotos(true);
    try {
      const urls: { imageUrl: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("folder", "activity-photos");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          urls.push({ imageUrl: data.url });
        }
      }
      if (urls.length > 0) {
        await fetch("/api/admin/activity-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: photoAlbumId, photos: urls }),
          credentials: "include",
        });
        loadPhotos(photoAlbumId);
        load(); // refresh count
      }
    } catch { alert("อัปโหลดรูปไม่สำเร็จ"); }
    setUploadingPhotos(false);
  };

  /* ── Delete photo ── */
  const removePhoto = async (photoId: number) => {
    if (!confirm("ลบรูปนี้?")) return;
    await fetch(`/api/admin/activity-photos?id=${photoId}`, { method: "DELETE", credentials: "include" });
    if (photoAlbumId) { loadPhotos(photoAlbumId); load(); }
  };

  /* ── Set as cover ── */
  const setAsCover = async (albumId: number, imageUrl: string) => {
    await fetch("/api/admin/activity-albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId, coverUrl: imageUrl }),
      credentials: "include",
    });
    load();
  };

  const inputStyle: React.CSSProperties = { display: "block", width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginTop: 4, fontSize: 13, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280" };
  const btnSm: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 11 };

  /* ── Photo manager overlay ── */
  if (photoAlbumId) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <CameraOutlined /> จัดการรูปภาพ: {photoAlbumTitle}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={photosInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.length) uploadPhotosHandler(e.target.files); }}
            />
            <button onClick={() => photosInputRef.current?.click()} disabled={uploadingPhotos}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              {uploadingPhotos ? <LoadingOutlined spin /> : <ImagePlus size={16} />}
              {uploadingPhotos ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ"}
            </button>
            <button onClick={() => { setPhotoAlbumId(null); setPhotos([]); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              <CloseOutlined /> กลับ
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <PictureOutlined style={{ fontSize: 48, marginBottom: 12 }} />
            <p style={{ margin: 0 }}>ยังไม่มีรูปภาพในอัลบั้มนี้</p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>คลิก &quot;เพิ่มรูปภาพ&quot; เพื่ออัปโหลดรูปหลายรูปพร้อมกัน</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {photos.map((p) => (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                <img src={p.imageUrl} alt={p.caption || ""} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "8px 10px", display: "flex", gap: 4, justifyContent: "space-between" }}>
                  <button onClick={() => setAsCover(photoAlbumId, p.imageUrl)} style={{ ...btnSm, fontSize: 10, color: "#0369a1" }} title="ตั้งเป็นภาพปก">
                    <PictureOutlined /> ปก
                  </button>
                  <button onClick={() => removePhoto(p.id)} style={{ ...btnSm, fontSize: 10, color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }} title="ลบรูป">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Main album list ── */
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <CameraOutlined /> ภาพกิจกรรมสหกรณ์
        </h2>
        <button onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
          <PlusOutlined /> สร้างอัลบั้ม
        </button>
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isNew ? "สร้างอัลบั้มใหม่" : "แก้ไขอัลบั้ม"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ชื่ออัลบั้ม *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={inputStyle} placeholder="เช่น ประชุมใหญ่สามัญประจำปี 2568" />
            </div>
            <div>
              <label style={labelStyle}>วันที่จัดกิจกรรม</label>
              <input type="date" value={editing.eventDate ? editing.eventDate.split("T")[0] : ""} onChange={(e) => setEditing({ ...editing, eventDate: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>คำอธิบาย</label>
            <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="รายละเอียดกิจกรรม..." />
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>ภาพปก</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) uploadCover(e.target.files[0]); }} />
                <button onClick={() => coverInputRef.current?.click()} disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f9fafb", cursor: "pointer", fontSize: 12 }}
                >
                  {uploading ? <LoadingOutlined spin /> : <UploadOutlined />}
                  {uploading ? "กำลังอัปโหลด..." : "เลือกภาพปก"}
                </button>
                {editing.coverUrl && <img src={editing.coverUrl} alt="cover" style={{ height: 40, borderRadius: 6, border: "1px solid #e5e7eb" }} />}
              </div>
            </div>
            <div>
              <label style={labelStyle}>ลำดับการแสดง</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            <label style={{ fontSize: 13 }}>เผยแพร่</label>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <SaveOutlined /> บันทึก
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <CloseOutlined /> ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Album list ── */}
      {albums.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <CameraOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p>ยังไม่มีอัลบั้มภาพกิจกรรม</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {albums.map((album) => (
            <div key={album.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", opacity: album.isActive ? 1 : 0.5, transition: "all 0.2s" }}>
              {/* Cover */}
              <div style={{ height: 160, background: album.coverUrl ? `url(${album.coverUrl}) center/cover` : "linear-gradient(135deg, #e0e7ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {!album.coverUrl && <CameraOutlined style={{ fontSize: 36, color: "#93c5fd" }} />}
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                  {album.isActive ? (
                    <span style={{ background: "rgba(22,163,74,0.9)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                      <EyeOutlined /> เผยแพร่
                    </span>
                  ) : (
                    <span style={{ background: "rgba(220,38,38,0.9)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                      <EyeInvisibleOutlined /> ซ่อน
                    </span>
                  )}
                </div>
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  {album._count?.photos || 0} รูป
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "14px 16px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{album.title}</h3>
                {album.eventDate && (
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                    {new Date(album.eventDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
                {album.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0", lineHeight: 1.4 }}>{album.description}</p>}
              </div>

              {/* Actions */}
              <div style={{ padding: "0 16px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => { setPhotoAlbumId(album.id!); setPhotoAlbumTitle(album.title); loadPhotos(album.id!); }}
                  style={{ ...btnSm, flex: 1, justifyContent: "center", background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
                >
                  <PictureOutlined /> จัดการรูป
                </button>
                <button onClick={() => { setEditing({ ...album, eventDate: album.eventDate ? new Date(album.eventDate).toISOString() : "" }); setIsNew(false); }}
                  style={{ ...btnSm }}
                >
                  <EditOutlined /> แก้ไข
                </button>
                <button onClick={() => album.id && removeAlbum(album.id)}
                  style={{ ...btnSm, borderColor: "#fecaca", background: "#fef2f2", color: "#dc2626" }}
                >
                  <DeleteOutlined /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
