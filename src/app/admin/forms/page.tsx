/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import css from "./page.module.css";

const CATEGORY_ALL = "ทั้งหมด";
const GROUP_ALL = "ทุกหมวด";

const CATEGORIES = [
  "สมาชิกสามัญ ก",
  "สมาชิกสามัญ ข",
  "สมาชิกสมทบ",
  "สมาชิกทุกประเภท",
];

const GROUPS = [
  "แบบฟอร์มสมัครสมาชิก",
  "แบบฟอร์มเงินฝาก-ถอน",
  "แบบฟอร์มเกี่ยวกับเงินกู้",
  "แบบฟอร์มขอสวัสดิการ",
  "แบบฟอร์มหนังสือร้องทุกข์",
  "หนังสือแต่งตั้งผู้รับโอนประโยชน์",
  "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์",
  "แบบฟอร์มอื่นๆ",
];

type FormItem = {
  id?: number;
  category: string;
  group: string;
  title: string;
  fileUrl: string;
  legacyPath: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormItem = {
  category: CATEGORIES[0],
  group: GROUPS[0],
  title: "",
  fileUrl: "",
  legacyPath: "",
  sortOrder: 0,
  isActive: true,
};

function getCategoryTone(category: string) {
  switch (category) {
    case "สมาชิกสามัญ ก":
      return css.toneBlue;
    case "สมาชิกสามัญ ข":
      return css.toneAmber;
    case "สมาชิกสมทบ":
      return css.toneRose;
    case "สมาชิกทุกประเภท":
      return css.toneInk;
    default:
      return "";
  }
}

export default function AdminFormsPage() {
  const [items, setItems] = useState<FormItem[]>([]);
  const [draft, setDraft] = useState<FormItem | null>(null);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState(CATEGORY_ALL);
  const [filterGroup, setFilterGroup] = useState(GROUP_ALL);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout((window as Window & { __formsToast?: number }).__formsToast);
    (window as Window & { __formsToast?: number }).__formsToast = window.setTimeout(() => {
      setToast("");
    }, 2800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forms", { credentials: "include" });
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setItems(data);
    } catch {
      setItems([]);
      showToast("โหลดรายการแบบฟอร์มไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterCat !== CATEGORY_ALL && item.category !== filterCat) return false;
      if (filterGroup !== GROUP_ALL && item.group !== filterGroup) return false;
      if (!keyword) return true;
      return [item.title, item.group, item.category, item.legacyPath]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [filterCat, filterGroup, items, search]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, FormItem[]>();
    for (const item of filteredItems) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)?.push(item);
    }
    return GROUPS.filter((group) => groups.has(group)).map((group) => ({
      group,
      items: groups.get(group) ?? [],
    }));
  }, [filteredItems]);

  useEffect(() => {
    if (draft && isNew) return;
    if (selectedId && selectedId !== "new") {
      const selectedItem = items.find((item) => item.id === selectedId);
      if (selectedItem) {
        setDraft({ ...selectedItem });
      } else {
        setDraft(null);
        setSelectedId(null);
      }
    }
  }, [draft, isNew, items, selectedId]);

  const activeCount = items.filter((item) => item.isActive).length;
  const withFileCount = items.filter((item) => Boolean(item.fileUrl)).length;
  const legacyCount = items.filter((item) => Boolean(item.legacyPath)).length;

  const startCreate = () => {
    setIsNew(true);
    setSelectedId("new");
    setDraft({
      ...emptyForm,
      category: filterCat !== CATEGORY_ALL ? filterCat : CATEGORIES[0],
      group: filterGroup !== GROUP_ALL ? filterGroup : GROUPS[0],
    });
  };

  const startEdit = (item: FormItem) => {
    setIsNew(false);
    setSelectedId(item.id ?? null);
    setDraft({ ...item });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !draft) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      showToast("รองรับเฉพาะ PDF หรือรูปภาพ");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "forms");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "อัปโหลดไม่สำเร็จ");
      }

      const data = await res.json();
      setDraft({ ...draft, fileUrl: data.url });
      showToast("อัปโหลดไฟล์เรียบร้อย");
    } catch (error) {
      showToast(String(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      showToast("กรุณาระบุชื่อแบบฟอร์ม");
      return;
    }

    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const payload: Record<string, unknown> = {
        category: draft.category,
        group: draft.group,
        title: draft.title.trim(),
        fileUrl: draft.fileUrl || null,
        legacyPath: draft.legacyPath || null,
        sortOrder: draft.sortOrder,
        isActive: draft.isActive,
      };

      if (!isNew && draft.id) payload.id = draft.id;

      const res = await fetch("/api/admin/forms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "บันทึกไม่สำเร็จ");
      }

      const saved = await res.json();
      showToast(isNew ? "เพิ่มแบบฟอร์มเรียบร้อย" : "อัปเดตแบบฟอร์มเรียบร้อย");
      await load();
      setIsNew(false);
      if (saved?.id) {
        setSelectedId(saved.id);
        setDraft({ ...saved });
      }
    } catch (error) {
      showToast(String(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!window.confirm("ต้องการลบแบบฟอร์มนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/forms?id=${draft.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      showToast("ลบแบบฟอร์มเรียบร้อย");
      setDraft(null);
      setSelectedId(null);
      setIsNew(false);
      await load();
    } catch {
      showToast("ลบแบบฟอร์มไม่สำเร็จ");
    }
  };

  const cancelEditing = () => {
    setIsNew(false);
    setSelectedId(null);
    setDraft(null);
  };

  return (
    <div className={css.page}>
      <header className={css.topbar}>
        <div>
          <div className={css.eyebrow}>Forms Studio</div>
          <h1 className={css.title}>จัดการแบบฟอร์มแบบแยกหมวด เห็นภาพรวมง่าย และแก้ไขได้เร็ว</h1>
          <p className={css.subtitle}>
            หน้าแบบใหม่สำหรับเอกสารโดยเฉพาะ เน้นคลังแบบฟอร์มที่สแกนเร็ว และแผงแก้ไขที่ชัดเจนกว่าเดิม
          </p>
        </div>
        <button className={css.createBtn} onClick={startCreate}>
          <Plus size={16} />
          เพิ่มแบบฟอร์ม
        </button>
      </header>

      <section className={css.layout}>
        <aside className={css.navigator}>
          <div className={css.navTitleRow}>
            <div>
              <h2 className={css.panelTitle}>ตัวกรองข้อมูล</h2>
              <p className={css.panelText}>ค้นหาและจัดเรียงแบบฟอร์ม</p>
            </div>
            <div className={css.metrics}>
              <div className={css.metricCard}>
                <span className={css.metricLabel}>พบบนเว็บ</span>
                <strong className={css.metricValue}>{activeCount}</strong>
              </div>
              <div className={css.metricCard}>
                <span className={css.metricLabel}>มีไฟล์แล้ว</span>
                <strong className={css.metricValue}>{withFileCount}</strong>
              </div>
              <div className={css.metricCard}>
                <span className={css.metricLabel}>ทั้งหมด</span>
                <strong className={css.metricValue}>{items.length}</strong>
              </div>
            </div>
          </div>
          <div className={css.filterPanel}>
            <label className={css.searchField}>
              <Search size={16} />
              <input
                className={css.searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาชื่อเอกสารหรือ legacy path"
              />
            </label>
            <div className={css.selectRow}>
              <div className={css.filterBadge}><Filter size={14} /></div>
              <select className={css.select} value={filterCat} onChange={(event) => setFilterCat(event.target.value)}>
                <option value={CATEGORY_ALL}>{CATEGORY_ALL}</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className={css.selectRow}>
              <div className={css.filterBadge}><SlidersHorizontal size={14} /></div>
              <select className={css.select} value={filterGroup} onChange={(event) => setFilterGroup(event.target.value)}>
                <option value={GROUP_ALL}>{GROUP_ALL}</option>
                {GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {draft && (
          <aside className={css.editorRow}>
            <div className={css.panelHeader}>
              <div>
                <h2 className={css.panelTitle}>{isNew ? "เพิ่มแบบฟอร์มใหม่" : "แก้ไขแบบฟอร์ม"}</h2>
                <p className={css.panelText}>{isNew ? "กรุณากรอกข้อมูลเพื่อเพิ่มฟอร์มเข้าสู่ระบบ" : "แก้รายละเอียดและคลิกบันทึกเพื่ออัปเดต"}</p>
              </div>
              <div className={css.editorTools}>
                <button className={css.ghostBtn} onClick={cancelEditing}>
                  <X size={16} /> ยกเลิก
                </button>
                {!isNew && draft.id && (
                  <button className={css.dangerBtn} onClick={remove}>
                    <Trash2 size={16} /> ลบ
                  </button>
                )}
                <button className={css.primaryBtn} onClick={save} disabled={saving}>
                  {saving ? <Loader2 className={css.spin} size={16} /> : (isNew ? <Plus size={16} /> : <Save size={16} />)}
                  {saving ? "กำลังบันทึก..." : (isNew ? "เพิ่มฟอร์ม" : "บันทึกการแก้ไข")}
                </button>
              </div>
            </div>

            <div className={css.editorBodyWrapper}>
              <div className={css.editorFormGrid}>
                <label className={css.field}>
                  <span>ชื่อแบบฟอร์ม</span>
                  <input className={css.input} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="เช่น แบบฟอร์มสมัครสมาชิก" />
                </label>

                <label className={css.field}>
                  <span>ประเภทสมาชิก</span>
                  <select className={css.input} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>

                <label className={css.field}>
                  <span>หมวดแบบฟอร์ม</span>
                  <select className={css.input} value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })}>
                    {GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </label>

                <label className={css.field}>
                  <span>Legacy path</span>
                  <input className={css.input} value={draft.legacyPath} onChange={(event) => setDraft({ ...draft, legacyPath: event.target.value })} placeholder="เช่น 123.pdf" />
                </label>

                <div className={css.inlineFields}>
                  <label className={css.field}>
                    <span>ลำดับจัดเรียง</span>
                    <input className={css.input} type="number" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: parseInt(event.target.value, 10) || 0 })} />
                  </label>

                  <label className={css.switchField}>
                    <span>สถานะบนแอป</span>
                    <label className={css.switch}>
                      <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
                      <span>{draft.isActive ? "แสดงอยู่" : "ซ่อนไว้"}</span>
                    </label>
                  </label>
                </div>
              </div>

              <div className={css.filePanel}>
                <div className={css.filePanelTop}>
                  <div>
                    <strong>{draft.fileUrl ? "ไฟล์พร้อมใช้งาน" : "ยังไม่มีไฟล์แนบ"}</strong>
                    <p className={css.hint}>รองรับ PDF ข่าวสาร หรือรูปภาพ ขนาดไม่เกิน 10MB</p>
                  </div>
                  {draft.fileUrl && (
                    <a href={draft.fileUrl} target="_blank" rel="noopener noreferrer" className={css.previewLink}>
                      ดูไฟล์ <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleUpload} className={css.hiddenInput} />
                <button className={css.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className={css.spin} size={16} /> : <Upload size={16} />} 
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์ (พับลิชพับไฟ)"}
                </button>

                {draft.fileUrl && (
                  <div className={css.filePreview}>
                    <FileText size={18} /><span>{draft.fileUrl.split("/").pop()}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        <section className={css.library}>
          <div className={css.panelHeader}>
            <div>
              <h2 className={css.panelTitle}>คลังแบบฟอร์ม</h2>
              <p className={css.panelText}>{filteredItems.length} รายการในฐานข้อมูล</p>
            </div>
          </div>

          {loading ? (
            <div className={css.stateBox}>
              <Loader2 className={css.spin} size={20} />
              <span>กำลังดึงข้อมูล...</span>
            </div>
          ) : groupedItems.length === 0 ? (
            <div className={css.stateBox}>
              <FolderOpen size={28} />
              <span>ไม่พบแบบฟอร์มที่ตรงกับเงื่อนไข</span>
            </div>
          ) : (
            <div className={css.groupList}>
              {groupedItems.map(({ group, items: groupItems }) => (
                <section key={group} className={css.groupSection}>
                  <div className={css.groupHeader}>
                    <div>
                      <h3 className={css.groupTitle}>{group}</h3>
                      <p className={css.groupCount}>{groupItems.length} รายการ</p>
                    </div>
                  </div>
                  <div className={css.listLayout}>
                    {groupItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${css.listRow} ${selectedId === item.id ? css.listRowActive : ""}`}
                        onClick={() => startEdit(item)}
                      >
                        <div className={css.rowMain}>
                          <span className={css.rowOrder} title="ลำดับ">#{item.sortOrder}</span>
                          <h4 className={css.rowTitle}>{item.title}</h4>
                        </div>
                        <div className={css.rowMeta}>
                          <span className={`${css.categoryTag} ${getCategoryTone(item.category)}`}>{item.category}</span>
                          {item.fileUrl ? (
                            <span className={css.iconActive} title="มีไฟล์แนบ"><FileText size={14} /></span>
                          ) : (
                            <span className={css.iconInactive} title="ไม่มีไฟล์แนบ"><FileText size={14} /></span>
                          )}
                          <span className={`${css.statusDot} ${item.isActive ? css.statusOn : css.statusOff}`} title={item.isActive ? "แสดงอยู่" : "ซ่อนอยู่"} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </section>

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
