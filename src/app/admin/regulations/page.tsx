/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  BookOutlined,
  SoundOutlined,
  SortAscendingOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
  message,
  Tooltip,
  Popconfirm,
  Empty,
} from "antd";
import css from "./page.module.css";

const { Title } = Typography;
const { TextArea } = Input;

/* ── Types ── */
interface RegItem {
  id?: number;
  title: string;
  typeForm: string;
  typeMember: string;
  filePath: string;
  imagePath: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const TYPE_OPTIONS = [
  { value: "statute", label: "ข้อบังคับ", icon: <BookOutlined /> },
  { value: "rules", label: "ระเบียบ", icon: <FileTextOutlined /> },
  { value: "announcements", label: "ประกาศ", icon: <SoundOutlined /> },
];

const MEMBER_TYPE_OPTIONS = [
  "สมาชิกสามัญประเภท ก",
  "สมาชิกสามัญประเภท ข",
  "สมาชิกสมทบ",
  "สมาชิกสามัญประเภท ก ข สมทบ",
  "สหกรณ์ฯ",
];

const empty: RegItem = {
  title: "", typeForm: "statute", typeMember: "", filePath: "", imagePath: "",
  description: "", sortOrder: 0, isActive: true,
};

const formInitial: Record<string, unknown> = {
  title: "",
  typeForm: "statute",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminRegulationsPage() {
  const [items, setItems] = useState<RegItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RegItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/regulations", { credentials: "include" });
      if (res.ok) setItems(await res.json());
      else message.error("ไม่สามารถโหลดข้อมูลได้");
    } catch {
      message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    statute: items.filter((i) => i.typeForm === "statute").length,
    rules: items.filter((i) => i.typeForm === "rules").length,
    announcements: items.filter((i) => i.typeForm === "announcements").length,
  }), [items]);

  const filtered = filterType === "all" ? items : items.filter((i) => i.typeForm === filterType);

  // Group by typeForm then typeMember
  const grouped = useMemo(() => {
    const result: { typeForm: string; typeLabel: string; groups: { typeMember: string; items: RegItem[] }[] }[] = [];
    for (const item of filtered) {
      const tf = item.typeForm || "(ไม่ระบุ)";
      const tLabel = TYPE_OPTIONS.find((t) => t.value === tf)?.label || tf;
      let typeGroup = result.find((g) => g.typeForm === tf);
      if (!typeGroup) { typeGroup = { typeForm: tf, typeLabel: tLabel, groups: [] }; result.push(typeGroup); }
      const tm = item.typeMember || "(ไม่ระบุกลุ่ม)";
      let memberGroup = typeGroup.groups.find((g) => g.typeMember === tm);
      if (!memberGroup) { memberGroup = { typeMember: tm, items: [] }; typeGroup.groups.push(memberGroup); }
      memberGroup.items.push(item);
    }
    return result;
  }, [filtered]);

  /* ── Open form ── */
  const openNew = () => {
    setEditing({ ...empty });
    setIsNew(true);
    form.resetFields();
  };

  const openEdit = (item: RegItem) => {
    setEditing({ ...item });
    setIsNew(false);
    form.resetFields();
    form.setFieldsValue({
      ...item,
      typeMember: item.typeMember || undefined,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
    form.resetFields();
  };

  /* ── Upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "regulations");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, filePath: data.url });
        message.success("อัปโหลดไฟล์สำเร็จ");
      } else message.error("อัปโหลดไม่สำเร็จ");
    } catch { message.error("อัปโหลดไม่สำเร็จ"); }
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) { message.error("รองรับเฉพาะไฟล์รูปภาพ"); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "regulations");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, imagePath: data.url });
        message.success("อัปโหลดรูปสำเร็จ");
      } else message.error("อัปโหลดไม่สำเร็จ");
    } catch { message.error("อัปโหลดไม่สำเร็จ"); }
    setUploadingImage(false);
    if (imgRef.current) imgRef.current.value = "";
  };

  /* ── Save ── */
  const handleSave = async (values: any) => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        typeForm: values.typeForm,
        typeMember: values.typeMember?.trim() || null,
        filePath: editing.filePath || null,
        imagePath: editing.imagePath || null,
        description: values.description?.trim() || null,
        sortOrder: values.sortOrder ?? 0,
        isActive: values.isActive ?? true,
      };
      if (!isNew && editing.id) payload.id = editing.id;

      const res = await fetch("/api/admin/regulations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        message.success("บันทึกเรียบร้อย");
        closeForm();
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(err.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/regulations?id=${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        message.success("ลบรายการเรียบร้อย");
        load();
      } else message.error("ลบไม่สำเร็จ");
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // Skeleton
  const renderSkeleton = () => (
    <div className={css.loadingGrid}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={css.skeletonRow}>
          <div className={css.skeletonAvatar} />
          <div className={css.skeletonLines}>
            <div className={css.skeletonLine} />
            <div className={css.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Inline form panel ── */
  const renderFormPanel = () => {
    if (!editing) return null;
    return (
      <div className={css.formPanel}>
        <div className={css.formPanelHeader}>
          <div className={css.formPanelHeaderInfo}>
            <div className={css.formPanelIcon}>
              {isNew ? <FileTextOutlined /> : <EditOutlined />}
            </div>
            <div>
              <h3 className={css.formPanelTitle}>
                {isNew ? "เพิ่มรายการใหม่" : "แก้ไขรายการ"}
              </h3>
              <p className={css.formPanelSub}>
                {isNew ? "กรอกข้อมูลข้อบังคับ ระเบียบ หรือประกาศใหม่" : "แก้ไขรายละเอียดเอกสาร"}
              </p>
            </div>
          </div>
          <div className={css.formPanelActions}>
            <Button onClick={closeForm} className={css.closeFormBtn} size="small">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              className={css.submitBtn}
              size="small"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>

        <div className={css.formPanelBody}>
          <ConfigProvider
            theme={{
              components: {
                Select: {
                  controlHeight: 34,
                  borderRadius: 8,
                  fontSize: 13,
                  colorBorder: "#e2e8f0",
                  colorPrimaryHover: "#3b82f6",
                  controlOutline: "rgba(59,130,246,0.08)",
                  colorTextPlaceholder: "#94a3b8",
                },
                Input: {
                  controlHeight: 34,
                  borderRadius: 8,
                  fontSize: 13,
                  colorBorder: "#e2e8f0",
                  colorPrimaryHover: "#3b82f6",
                  controlOutline: "rgba(59,130,246,0.08)",
                },
                InputNumber: {
                  controlHeight: 34,
                  borderRadius: 8,
                  fontSize: 13,
                  colorBorder: "#e2e8f0",
                  colorPrimaryHover: "#3b82f6",
                  controlOutline: "rgba(59,130,246,0.08)",
                },
              },
            }}
          >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={formInitial}
            className={css.form}
          >
            <div className={css.formBody}>
              {/* Left column */}
              <div>
                {/* Section: Basic info */}
                <div className={css.formSection}>
                  <div className={css.sectionHeader}>
                    <div className={`${css.sectionIconWrap} ${css.sectionIconBlue}`}>
                      <EditOutlined />
                    </div>
                    <div className={css.sectionTitle}>ข้อมูลเอกสาร</div>
                  </div>
                  <div className={css.sectionBody}>
                    <Form.Item
                      name="title"
                      label="ชื่อเรื่อง"
                      rules={[{ required: true, message: "กรุณาระบุชื่อเรื่อง" }]}
                    >
                      <Input placeholder="เช่น ข้อบังคับสหกรณ์ พ.ศ.2562" />
                    </Form.Item>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Form.Item
                        name="typeForm"
                        label="ประเภท"
                        rules={[{ required: true }]}
                      >
                        <Select style={{ width: "100%" }}>
                          {TYPE_OPTIONS.map((t) => (
                            <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="typeMember" label="กลุ่มสมาชิก / หมวดหมู่">
                        <Select
                          allowClear
                          placeholder="เลือกกลุ่มสมาชิก"
                          style={{ width: "100%" }}
                        >
                          {MEMBER_TYPE_OPTIONS.map((m) => (
                            <Select.Option key={m} value={m}>{m}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <Form.Item name="description" label="รายละเอียด (ไม่บังคับ)">
                      <TextArea rows={2} placeholder="คำอธิบายสั้นๆ..." />
                    </Form.Item>
                  </div>
                </div>

                {/* Section: File uploads */}
                <div className={css.formSection}>
                  <div className={css.sectionHeader}>
                    <div className={`${css.sectionIconWrap} ${css.sectionIconOrange}`}>
                      <UploadOutlined />
                    </div>
                    <div className={css.sectionTitle}>ไฟล์แนบ</div>
                  </div>
                  <div className={css.sectionBody}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {/* PDF */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>ไฟล์เอกสาร (PDF)</label>
                        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: "none" }} />
                        <div
                          className={`${css.uploadZone} ${editing.filePath ? css.uploadZoneHasFile : ""}`}
                          onClick={() => !uploadingFile && !editing.filePath && fileRef.current?.click()}
                          style={{ cursor: editing.filePath ? "default" : "pointer" }}
                        >
                          {editing.filePath ? (
                            <div className={css.uploadedFileCard}>
                              <div className={css.uploadedFileIconBg}>
                                <CheckCircleOutlined />
                              </div>
                              <div className={css.uploadedFileInfo}>
                                <span className={css.uploadedFileName}>
                                  {editing.filePath.split("/").pop()}
                                </span>
                                <span className={css.uploadedFileStatus}>อัปโหลดแล้ว</span>
                              </div>
                              <Button
                                size="small"
                                danger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditing({ ...editing, filePath: "" });
                                }}
                                className={css.uploadedFileRemove}
                              >
                                ลบ
                              </Button>
                            </div>
                          ) : (
                            <div className={css.uploadEmpty}>
                              <div className={`${css.uploadEmptyIconBg} ${css.uploadEmptyIconBgBlue}`}>
                                {uploadingFile ? <LoadingOutlined spin /> : <FileTextOutlined />}
                              </div>
                              <p className={css.uploadEmptyTitle}>
                                {uploadingFile ? "กำลังอัปโหลด..." : "คลิกเลือกไฟล์"}
                              </p>
                              <p className={css.uploadEmptyHint}>PDF, DOC</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>รูปประกอบ (ไม่บังคับ)</label>
                        <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                        <div
                          className={`${css.uploadZone} ${editing.imagePath ? css.uploadZoneHasFile : ""}`}
                          onClick={() => !uploadingImage && !editing.imagePath && imgRef.current?.click()}
                          style={{ cursor: editing.imagePath ? "default" : "pointer" }}
                        >
                          {editing.imagePath ? (
                            <div className={css.uploadedFileCard}>
                              <div className={css.uploadedFileIconBg}>
                                <CheckCircleOutlined />
                              </div>
                              <div className={css.uploadedFileInfo}>
                                <span className={css.uploadedFileName}>
                                  {editing.imagePath.split("/").pop()}
                                </span>
                                <span className={css.uploadedFileStatus}>อัปโหลดแล้ว</span>
                              </div>
                              <Button
                                size="small"
                                danger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditing({ ...editing, imagePath: "" });
                                }}
                                className={css.uploadedFileRemove}
                              >
                                ลบ
                              </Button>
                            </div>
                          ) : (
                            <div className={css.uploadEmpty}>
                              <div className={`${css.uploadEmptyIconBg} ${css.uploadEmptyIconBgPurple}`}>
                                {uploadingImage ? <LoadingOutlined spin /> : <PictureOutlined />}
                              </div>
                              <p className={css.uploadEmptyTitle}>
                                {uploadingImage ? "กำลังอัปโหลด..." : "คลิกเลือกรูป"}
                              </p>
                              <p className={css.uploadEmptyHint}>JPG, PNG, WebP</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — settings */}
              <div>
                <div className={css.formSection}>
                  <div className={css.sectionHeader}>
                    <div className={`${css.sectionIconWrap} ${css.sectionIconGreen}`}>
                      <CheckCircleOutlined />
                    </div>
                    <div className={css.sectionTitle}>การตั้งค่า</div>
                  </div>
                  <div className={css.sectionBody}>
                    <div className={css.settingCard} style={{ marginBottom: 10 }}>
                      <div className={`${css.settingCardIcon} ${css.settingCardIconSort}`}>
                        <SortAscendingOutlined />
                      </div>
                      <div className={css.settingCardInfo}>
                        <span className={css.settingCardLabel}>ลำดับการแสดงผล</span>
                        <Form.Item name="sortOrder" noStyle>
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                    </div>
                    <div className={css.settingCard}>
                      <div className={`${css.settingCardIcon} ${css.settingCardIconPublish}`}>
                        <EyeOutlined />
                      </div>
                      <div className={css.settingCardInfo}>
                        <span className={css.settingCardLabel}>สถานะเผยแพร่</span>
                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                          <Switch size="small" />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
          </ConfigProvider>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════
     LIST VIEW
     ══════════════════════════════════════════════ */
  return (
    <div className={css.container}>
      {/* Hero Header */}
      <div className={css.heroHeader}>
        <div className={css.heroTop}>
          <div className={css.heroTitleWrap}>
            <Title level={2} className={css.pageTitle}>
              ข้อบังคับ ระเบียบ ประกาศ
            </Title>
            <p className={css.pageSubtitle}>
              จัดการเอกสารข้อบังคับ ระเบียบ และประกาศของสหกรณ์
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openNew}
            className={css.addBtn}
          >
            เพิ่มรายการ
          </Button>
        </div>

        <div className={css.statsRow}>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAll}`}>
              <FileTextOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.total}</span>
              <span className={css.statLabel}>ทั้งหมด</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconStatute}`}>
              <BookOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.statute}</span>
              <span className={css.statLabel}>ข้อบังคับ</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconRules}`}>
              <FileTextOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.rules}</span>
              <span className={css.statLabel}>ระเบียบ</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAnnounce}`}>
              <SoundOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.announcements}</span>
              <span className={css.statLabel}>ประกาศ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline form panel */}
      {editing && renderFormPanel()}

      {/* Filter tabs */}
      <div className={css.tabsRow}>
        <button
          className={`${css.tabBtn} ${filterType === "all" ? css.tabBtnActive : ""}`}
          onClick={() => setFilterType("all")}
        >
          ทั้งหมด ({items.length})
        </button>
        {TYPE_OPTIONS.map((t) => {
          const count = items.filter((i) => i.typeForm === t.value).length;
          return (
            <button
              key={t.value}
              className={`${css.tabBtn} ${filterType === t.value ? css.tabBtnActive : ""}`}
              onClick={() => setFilterType(t.value)}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : filtered.length === 0 ? (
        <Empty
          image={<FileTextOutlined style={{ fontSize: 56, color: "#cbd5e1" }} />}
          description={<span style={{ color: "#94a3b8" }}>ยังไม่มีรายการ</span>}
          className={css.emptyState}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew} className={css.addBtn}>
            เพิ่มรายการแรก
          </Button>
        </Empty>
      ) : (
        <div>
          {grouped.map((tg, tIdx) => (
            <div key={tIdx} className={css.groupSection}>
              {filterType === "all" && (
                <h2 className={css.groupTitle}>{tg.typeLabel}</h2>
              )}
              {tg.groups.map((mg, mIdx) => (
                <div
                  key={mIdx}
                  className={css.subGroup}
                  style={{ paddingLeft: filterType === "all" ? 16 : 0 }}
                >
                  <h4 className={css.subGroupTitle}>{mg.typeMember}</h4>
                  {mg.items.map((item) => (
                    <div
                      key={item.id}
                      className={`${css.itemCard} ${!item.isActive ? css.itemCardInactive : ""}`}
                    >
                      {item.imagePath ? (
                        <img src={item.imagePath} alt="" className={css.itemThumb} />
                      ) : (
                        <div className={css.itemPlaceholder}>
                          <FileTextOutlined />
                        </div>
                      )}
                      <div className={css.itemInfo}>
                        <p className={css.itemTitle}>{item.title}</p>
                        {item.description && (
                          <p className={css.itemDesc}>{item.description}</p>
                        )}
                        {item.filePath && (
                          <a
                            href={item.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css.itemFileLink}
                          >
                            <LinkOutlined /> ดูไฟล์
                          </a>
                        )}
                      </div>
                      <span className={`${css.itemStatusBadge} ${item.isActive ? css.badgeActive : css.badgeHidden}`}>
                        {item.isActive ? "เผยแพร่" : "ซ่อน"}
                      </span>
                      <div className={css.itemActions}>
                        <Tooltip title="แก้ไข">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            className={`${css.itemActionBtn} ${css.editBtn}`}
                            onClick={() => openEdit(item)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="ลบรายการนี้?"
                          description="คุณแน่ใจว่าต้องการลบ?"
                          onConfirm={() => item.id && handleDelete(item.id)}
                          okText="ลบ"
                          cancelText="ยกเลิก"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="ลบ">
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              className={`${css.itemActionBtn} ${css.deleteBtn}`}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
