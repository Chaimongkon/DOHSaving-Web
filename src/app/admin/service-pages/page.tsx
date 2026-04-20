/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Edit2, Trash2, X, UploadCloud, Link as LinkIcon,
  Image as ImageIcon, Filter, LayoutGrid, FileText, Search, ChevronDown
} from "lucide-react";
import css from "./page.module.css";

/* ── Searchable Form Picker (Select2-style) ────────────────── */
function FormPicker({
  forms,
  value,
  onChange,
}: {
  forms: FormItem[];
  value: number;
  onChange: (formId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = forms.filter((f) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.group.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

  const selected = forms.find((f) => f.id === value);

  return (
    <div ref={wrapRef} className={css.formPicker}>
      <button
        type="button"
        className={css.formPickerTrigger}
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        {selected ? (
          <span className={css.formPickerSelected}>
            <FileText size={13} color="#16a34a" />
            <span style={{ flex: 1, textAlign: 'left' }}>{selected.title}</span>
            <span className={css.formPickerBadge}>{selected.group}</span>
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>— เลือกแบบฟอร์ม —</span>
        )}
        <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : undefined }} />
      </button>

      {open && (
        <div className={css.formPickerDropdown}>
          <div className={css.formPickerSearch}>
            <Search size={14} color="#94a3b8" />
            <input
              ref={inputRef}
              className={css.formPickerSearchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์ค้นหาแบบฟอร์ม..."
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className={css.formPickerList}>
            {filtered.length === 0 ? (
              <div className={css.formPickerEmpty}>ไม่พบแบบฟอร์มที่ค้นหา</div>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`${css.formPickerOption} ${f.id === value ? css.formPickerOptionActive : ""}`}
                  onClick={() => { onChange(f.id); setOpen(false); setQuery(""); }}
                >
                  <div className={css.formPickerOptionTitle}>{f.title}</div>
                  <div className={css.formPickerOptionMeta}>
                    <span>{f.group}</span>
                    <span className={css.formPickerDot} />
                    <span>{f.category}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  "สมัครสมาชิก",
  "สวัสดิการ",
  "เงินฝาก",
  "เงินกู้",
  "บริการอื่นๆ",
  "บริการอิเล็กทรอนิกส์",
];

const FORM_GROUPS = [
  "แบบฟอร์มสมัครสมาชิก",
  "แบบฟอร์มเงินฝาก-ถอน",
  "แบบฟอร์มเกี่ยวกับเงินกู้",
  "แบบฟอร์มขอสวัสดิการ",
  "แบบฟอร์มหนังสือร้องทุกข์",
  "หนังสือแต่งตั้งผู้รับโอนประโยชน์",
  "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์",
  "แบบฟอร์มอื่นๆ",
];

interface DownloadLink {
  label: string;
  url: string;
  formId?: number; // ถ้ามี formId จะ resolve URL จากตาราง forms อัตโนมัติ
}

interface FormItem {
  id: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string | null;
  isActive: boolean;
}

interface ServicePageItem {
  id?: number;
  slug: string;
  title: string;
  category: string;
  infographicUrl: string;
  downloadLinks: string; // JSON string
  formGroup: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: ServicePageItem = {
  slug: "",
  title: "",
  category: CATEGORIES[0],
  infographicUrl: "",
  downloadLinks: "[]",
  formGroup: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminServicePagesPage() {
  const [items, setItems] = useState<ServicePageItem[]>([]);
  const [editing, setEditing] = useState<ServicePageItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCat, setFilterCat] = useState("ทั้งหมด");
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const [allForms, setAllForms] = useState<FormItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/service-pages", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }, []);

  const loadForms = useCallback(async () => {
    const res = await fetch("/api/admin/forms", { credentials: "include" });
    if (res.ok) setAllForms(await res.json());
  }, []);

  useEffect(() => { load(); loadForms(); }, [load, loadForms]);

  const filtered = items.filter((i) => {
    if (filterCat !== "ทั้งหมด" && i.category !== filterCat) return false;
    return true;
  });

  const openEdit = (item: ServicePageItem) => {
    setEditing({ ...item });
    setIsNew(false);
    try {
      setLinks(JSON.parse(item.downloadLinks || "[]"));
    } catch {
      setLinks([]);
    }
  };

  const openNew = () => {
    setEditing({ ...empty });
    setIsNew(true);
    setLinks([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์รูปภาพ"); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB"); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "service-pages");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, infographicUrl: data.url });
      } else alert("อัปโหลดไม่สำเร็จ");
    } catch { alert("อัปโหลดไม่สำเร็จ"); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const addFormLink = () => setLinks([...links, { label: "", url: "", formId: 0 }]);
  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));
  const updateLink = (idx: number, field: "label" | "url", value: string) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [field]: value };
    setLinks(updated);
  };
  const selectFormForLink = (idx: number, formId: number) => {
    const form = allForms.find((f) => f.id === formId);
    if (!form) return;
    const updated = [...links];
    // ถ้ายังไม่มี label ให้ใช้ชื่อแบบฟอร์ม, ถ้ามีแล้วให้ใช้ค่าที่ตั้งไว้
    const label = updated[idx].label.trim() ? updated[idx].label : form.title;
    updated[idx] = { label, url: form.fileUrl || "", formId: form.id };
    setLinks(updated);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.slug.trim()) return alert("กรุณาระบุ slug");
    if (!editing.title.trim()) return alert("กรุณาระบุชื่อหน้า");

    const method = isNew ? "POST" : "PATCH";
    const payload: Record<string, unknown> = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      category: editing.category,
      infographicUrl: editing.infographicUrl || null,
      downloadLinks: JSON.stringify(links.filter((l) => l.label.trim() && (l.url.trim() || l.formId)).map((l) => l.formId ? { label: l.label, url: l.url, formId: l.formId } : { label: l.label, url: l.url })),
      formGroup: editing.formGroup || null,
      sortOrder: editing.sortOrder,
      isActive: editing.isActive,
    };
    if (!isNew && editing.id) payload.id = editing.id;
    const res = await fetch("/api/admin/service-pages", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.ok) {
      setEditing(null);
      setIsNew(false);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "บันทึกไม่สำเร็จ");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบหน้าบริการนี้?")) return;
    await fetch(`/api/admin/service-pages?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className={css.container}>
      {/* Header */}
      <div className={css.header}>
        <div className={css.headerTitleWrap}>
          <div className={css.headerIcon}>
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className={css.title}>จัดการหน้าบริการ</h1>
            <p className={css.subtitle}>จัดการหน้าบริการ Infographic และเอกสารดาวน์โหลดต่างๆ ในระบบ</p>
          </div>
        </div>
        <button onClick={openNew} className={css.addBtn}>
          <Plus size={18} /> เพิ่มหน้าบริการ
        </button>
      </div>

      {/* Filters */}
      <div className={css.filters}>
        <Filter size={18} color="#94a3b8" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={css.filterSelect}>
          <option>ทั้งหมด</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className={css.filterCount}>({filtered.length} รายการ)</span>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className={css.modalOverlay} onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className={css.modal} onClick={(e) => e.stopPropagation()}>
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>
                {isNew ? "เพิ่มหน้าบริการใหม่" : "แก้ไขหน้าบริการ"}
              </h3>
              <button className={css.modalClose} onClick={() => { setEditing(null); setIsNew(false); }}>
                <X size={20} />
              </button>
            </div>

            <div className={css.modalBody}>
              {/* Left Column: Image Upload */}
              <div className={css.leftCol}>
                <div className={css.formGroup}>
                  <label className={css.formLabel}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={16} color="#0369a1" /> รูป Infographic</span>
                  </label>
                  <p className={css.formHint} style={{ marginBottom: '8px', marginTop: 0 }}>
                    อัปโหลดรูปภาพแนวตั้งเพื่อใช้แสดงผลบนหน้าบริการ (รองรับ JPG, PNG, WebP ขนาดไม่เกิน 10MB)
                  </p>

                  {editing.infographicUrl ? (
                    <div className={css.uploadPreview}>
                      <img
                        src={editing.infographicUrl}
                        alt="preview"
                        className={css.uploadPreviewImg}
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholders/empty_service.png";
                          e.currentTarget.style.opacity = "0.8";
                          e.currentTarget.style.filter = "grayscale(0.2)";
                        }}
                      />
                      <button
                        className={css.uploadRemove}
                        onClick={() => setEditing({ ...editing, infographicUrl: "" })}
                        title="ลบรูปภาพ"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className={css.uploadArea} onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud className={css.uploadIcon} />
                      <p className={css.uploadText}>
                        {uploading ? "กำลังอัพโหลด..." : "คลิกเพื่อเลือกรูปภาพ"}
                      </p>
                      <p className={css.uploadHint}>แนะนำ: 800 x 1200 px</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              {/* Right Column: Settings */}
              <div className={css.rightCol}>
                <div className={css.formRow}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ชื่อหน้า <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      className={css.formInput}
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      placeholder="เช่น เงินฝากออมทรัพย์"
                    />
                  </div>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>Slug (URL path) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      className={css.formInput}
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      placeholder="เช่น savings"
                    />
                    <p className={css.formHint}>/services/<strong>{editing.slug || "xxx"}</strong></p>
                  </div>
                </div>

                <div className={css.formRow}>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>หมวดหมู่</label>
                    <select
                      className={css.formSelect}
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>ลำดับ</label>
                    <input
                      type="number"
                      className={css.formInput}
                      value={editing.sortOrder}
                      onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className={css.formGroup} style={{ marginTop: '8px' }}>
                  <label className={css.formLabel}>เลือกแบบฟอร์มที่แสดงแนบด้านข้าง</label>
                  <select
                    className={css.formSelect}
                    value={editing.formGroup}
                    onChange={(e) => setEditing({ ...editing, formGroup: e.target.value })}
                  >
                    <option value="">— ไม่แสดงแบบฟอร์ม —</option>
                    {FORM_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className={css.formGroup} style={{ marginTop: '16px' }}>
                  <div className={css.dynamicLinksHeader}>
                    <label className={css.formLabel} style={{ marginBottom: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><LinkIcon size={16} color="#f97316" /> ลิงก์ดาวน์โหลดเอกสารเสริม</span>
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={addFormLink} className={css.addLinkBtn} style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                        <FileText size={14} /> เลือกจากแบบฟอร์ม
                      </button>
                      <button onClick={addLink} className={css.addLinkBtn}>
                        <Plus size={14} /> เพิ่มลิงก์เอง
                      </button>
                    </div>
                  </div>

                  {links.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      <p className={css.formHint}>ยังไม่มีลิงก์ดาวน์โหลดเสริม — เลือกจากแบบฟอร์มเพื่อให้ลิงก์อัปเดตอัตโนมัติ</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '8px' }}>
                      {links.map((link, idx) => (
                        <div key={idx} className={css.linkRow} style={link.formId ? { borderColor: '#bbf7d0', background: '#f0fdf4' } : undefined}>
                          <span className={css.linkIndex}>{idx + 1}</span>
                          <div className={css.linkInputGroup}>
                            {link.formId !== undefined ? (
                              <>
                                <FormPicker
                                  forms={allForms.filter((f) => f.isActive)}
                                  value={link.formId || 0}
                                  onChange={(fid) => selectFormForLink(idx, fid)}
                                />
                                <input
                                  className={css.formInput}
                                  value={link.label}
                                  onChange={(e) => updateLink(idx, "label", e.target.value)}
                                  placeholder="ตั้งชื่อแสดง (ว่างจะใช้ชื่อแบบฟอร์ม)"
                                  style={{ padding: '8px 12px' }}
                                />
                                {link.formId > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', padding: '2px 0' }}>
                                    <FileText size={12} />
                                    <span>ลิงก์จะอัปเดตอัตโนมัติเมื่อแบบฟอร์มถูกแก้ไข</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <input
                                  className={css.formInput}
                                  value={link.label}
                                  onChange={(e) => updateLink(idx, "label", e.target.value)}
                                  placeholder="ชื่อเอกสาร (เช่น แบบฟอร์มเงินฝาก)"
                                  style={{ padding: '8px 12px' }}
                                />
                                <input
                                  className={css.formInput}
                                  value={link.url}
                                  onChange={(e) => updateLink(idx, "url", e.target.value)}
                                  placeholder="URL (เช่น /uploads/doc.pdf)"
                                  style={{ padding: '8px 12px' }}
                                />
                              </>
                            )}
                          </div>
                          <button onClick={() => removeLink(idx)} className={css.removeLinkBtn}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={css.formGroup}>
                  <label className={css.formLabel}>การเผยแพร่</label>
                  <div className={css.toggle} onClick={() => setEditing({ ...editing, isActive: !editing.isActive })}>
                    <button
                      type="button"
                      className={`${css.toggleSwitch} ${editing.isActive ? css.toggleOn : css.toggleOff}`}
                    />
                    <span className={css.toggleLabel}>
                      {editing.isActive ? "เผยแพร่แล้ว (เปิดใช้งาน)" : "ซ่อนไว้ก่อน (Draft)"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className={css.modalFooter}>
              <button
                className={css.cancelBtn}
                onClick={() => { setEditing(null); setIsNew(false); }}
              >
                ยกเลิก
              </button>
              <button className={css.saveBtn} onClick={save}>
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={css.empty}>
          <div className={css.emptyIcon}><LayoutGrid size={48} /></div>
          <p className={css.emptyText}>ยังไม่มีหน้าบริการในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className={css.grid}>
          {filtered.map((item) => {
            let linkCount = 0;
            try { linkCount = JSON.parse(item.downloadLinks || "[]").length; } catch { /* */ }
            return (
              <div key={item.id} className={css.card}>
                <div className={css.imageWrap}>
                  {item.infographicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.infographicUrl}
                      alt={item.title}
                      className={css.cardImage}
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholders/empty_service.png";
                        e.currentTarget.style.opacity = "0.8";
                        e.currentTarget.style.filter = "grayscale(0.2)";
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/images/placeholders/empty_service.png" alt="No Image" className={css.cardImage} style={{ opacity: 0.8, filter: 'grayscale(0.2)' }} />
                  )}
                  <div className={css.badgesWrap}>
                    <span className={css.categoryBadge}>{item.category}</span>
                    <span className={`${css.badge} ${item.isActive ? css.badgeActive : css.badgeInactive}`}>
                      {item.isActive ? "เผยแพร่" : "ซ่อน"}
                    </span>
                  </div>
                </div>

                <div className={css.cardBody}>
                  <div className={css.cardContent}>
                    <h3 className={css.cardName}>{item.title}</h3>
                    <p className={css.cardInfo} style={{ fontFamily: 'monospace' }}>
                      <LinkIcon size={14} /> /services/{item.slug}
                    </p>
                    <p className={css.cardInfo}>
                      <LayoutGrid size={14} /> {item.formGroup || "ไม่แสดงแบบฟอร์ม"}
                    </p>
                  </div>

                  <div className={css.cardStats}>
                    <a href={`/services/${item.slug}`} target="_blank" rel="noopener noreferrer" className={css.cardLink}>
                      <LinkIcon size={14} /> ดูหน้าเว็บ
                    </a>
                    <span className={css.cardInfo} style={{ margin: 0, fontWeight: 600, color: '#f97316' }}>
                      {linkCount} ลิงก์ดาวน์โหลด
                    </span>
                  </div>
                </div>

                <div className={css.actions}>
                  <button className={css.actionBtn} onClick={() => openEdit(item)}>
                    <Edit2 size={16} /> แก้ไข
                  </button>
                  <button className={`${css.actionBtn} ${css.deleteBtn}`} onClick={() => item.id && remove(item.id)}>
                    <Trash2 size={16} /> ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
