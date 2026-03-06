"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  LoadingOutlined,
  FileTextOutlined,
  LinkOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  SortAscendingOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Button,
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
interface MediaItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  coverUrl: string | null;
  filePath: string | null;
  fileType: string;
  legacyPath: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface MediaForm {
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  filePath: string;
  fileType: string;
  legacyPath: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: MediaForm = {
  title: "",
  description: "",
  category: "สมาชิกทุกประเภท",
  coverUrl: "",
  filePath: "",
  fileType: "pdf",
  legacyPath: "",
  sortOrder: 0,
  isActive: true,
};

const CATEGORIES = ["ทั้งหมด", "สมาชิกทุกประเภท", "สมาชิกสามัญ ก", "สมาชิกสามัญ ข", "สมาชิกสมทบ"];

const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "วิดีโอ" },
  { value: "image", label: "รูปภาพ" },
  { value: "link", label: "ลิงก์ภายนอก" },
];

const FILE_TYPE_ICON: Record<string, React.ReactNode> = {
  pdf: <FileTextOutlined />,
  video: <VideoCameraOutlined />,
  image: <PictureOutlined />,
  link: <LinkOutlined />,
};

export default function MemberMediaAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<"list" | "form">("list");
  const [formValues, setFormValues] = useState<MediaForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  /* ── Load ── */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/member-media");
      if (res.ok) setItems(await res.json());
      else message.error("ไม่สามารถโหลดข้อมูลได้");
    } catch {
      message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.isActive).length,
    hidden: items.filter((i) => !i.isActive).length,
    pdf: items.filter((i) => i.fileType === "pdf").length,
  }), [items]);

  /* ── Open form ── */
  const openCreate = () => {
    setEditingId(null);
    setFormValues(defaultForm);
    form.setFieldsValue(defaultForm);
    setFormMode("form");
  };

  const openEdit = (item: MediaItem) => {
    setEditingId(item.id);
    const editForm: MediaForm = {
      title: item.title,
      description: item.description || "",
      category: item.category,
      coverUrl: item.coverUrl || "",
      filePath: item.filePath || "",
      fileType: item.fileType,
      legacyPath: item.legacyPath || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    };
    setFormValues(editForm);
    form.setFieldsValue(editForm);
    setFormMode("form");
  };

  const closeForm = () => {
    setFormMode("list");
    setEditingId(null);
    setFormValues(defaultForm);
    form.resetFields();
  };

  /* ── Upload handler ── */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverUrl" | "filePath",
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setFormValues((prev) => ({ ...prev, [field]: url }));
        message.success("อัปโหลดสำเร็จ");
      } else {
        message.error("อัปโหลดไม่สำเร็จ");
      }
    } catch {
      message.error("อัปโหลดไม่สำเร็จ");
    }
    setUploading(false);
    e.target.value = "";
  };

  /* ── Save ── */
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        category: values.category,
        coverUrl: formValues.coverUrl || "",
        filePath: values.fileType === "link" ? values.filePath?.trim() || "" : formValues.filePath || "",
        fileType: values.fileType,
        legacyPath: values.legacyPath?.trim() || "",
        sortOrder: values.sortOrder || 0,
        isActive: values.isActive ?? true,
      };

      const url = editingId
        ? `/api/admin/member-media/${editingId}`
        : "/api/admin/member-media";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("บันทึกข้อมูลเรียบร้อย");
        closeForm();
        fetchItems();
      } else {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "บันทึกไม่สำเร็จ");
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
      const res = await fetch(`/api/admin/member-media/${id}`, { method: "DELETE" });
      if (res.ok) {
        message.success("ลบรายการเรียบร้อย");
        fetchItems();
      } else message.error("ลบไม่สำเร็จ");
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  /* ── Toggle active ── */
  const handleToggle = async (item: MediaItem) => {
    try {
      await fetch(`/api/admin/member-media/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      message.success(item.isActive ? "ปิดการแสดงผลแล้ว" : "เปิดการแสดงผลแล้ว");
      fetchItems();
    } catch { /* ignore */ }
  };

  const filtered = activeTab === "ทั้งหมด"
    ? items
    : items.filter((i) => i.category === activeTab);

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

  // Watch fileType for conditional rendering
  const watchFileType = Form.useWatch("fileType", form) || formValues.fileType;

  /* ══════════════════════════════════════════════
     Inline form panel renderer
     ══════════════════════════════════════════════ */
  const renderFormPanel = () => (
    <div className={css.formPanel}>
      {/* Panel header */}
      <div className={css.formPanelHeader}>
        <div className={css.formPanelHeaderInfo}>
          <div className={css.formPanelIcon}>
            {editingId ? <EditOutlined /> : <BookOutlined />}
          </div>
          <div>
            <h3 className={css.formPanelTitle}>
              {editingId ? "แก้ไขสื่อสมาชิก" : "เพิ่มสื่อใหม่"}
            </h3>
            <p className={css.formPanelSub}>
              {editingId ? "แก้ไขรายละเอียดเอกสารหรือสื่อ" : "กรอกข้อมูลเอกสารหรือสื่อใหม่"}
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
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </div>

      {/* Panel body */}
      <div className={css.formPanelBody}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={defaultForm}
          className={css.form}
        >
          <div className={css.formBody}>
            {/* Left column — main content */}
            <div>
              {/* Section: Basic info */}
              <div className={css.formSection}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIconWrap} ${css.sectionIconBlue}`}>
                    <EditOutlined />
                  </div>
                  <div className={css.sectionTitle}>ข้อมูลสื่อ</div>
                </div>
                <div className={css.sectionBody}>
                  <Form.Item
                    name="title"
                    label="ชื่อสื่อ"
                    rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}
                  >
                    <Input placeholder="เช่น บริการด้านสินเชื่อ" size="small" />
                  </Form.Item>

                  <Form.Item name="description" label="รายละเอียด (ไม่บังคับ)">
                    <TextArea rows={2} placeholder="คำอธิบายสั้นๆ..." />
                  </Form.Item>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Form.Item
                      name="category"
                      label="หมวดหมู่"
                      rules={[{ required: true, message: "กรุณาเลือกหมวดหมู่" }]}
                    >
                      <Select size="small">
                        {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((c) => (
                          <Select.Option key={c} value={c}>{c}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="fileType" label="ประเภทไฟล์">
                      <Select size="small">
                        {FILE_TYPES.map((f) => (
                          <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </div>
              </div>

              {/* Section: File upload */}
              <div className={css.formSection}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIconWrap} ${css.sectionIconOrange}`}>
                    <UploadOutlined />
                  </div>
                  <div className={css.sectionTitle}>
                    {watchFileType === "link" ? "ลิงก์ภายนอก" : "อัปโหลดไฟล์"}
                  </div>
                </div>
                <div className={css.sectionBody}>
                  {watchFileType === "link" ? (
                    <Form.Item name="filePath" label="URL ลิงก์">
                      <Input placeholder="https://..." size="small" />
                    </Form.Item>
                  ) : (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={
                          watchFileType === "pdf" ? ".pdf"
                            : watchFileType === "video" ? "video/*"
                              : "image/*"
                        }
                        style={{ display: "none" }}
                        onChange={(e) => handleUpload(e, "filePath", setUploadingFile)}
                      />
                      <div
                        className={`${css.uploadZone} ${formValues.filePath ? css.uploadZoneHasFile : ""}`}
                        onClick={() => !uploadingFile && !formValues.filePath && fileRef.current?.click()}
                        style={{ cursor: formValues.filePath ? "default" : "pointer" }}
                      >
                        {formValues.filePath ? (
                          <div className={css.uploadedFileCard}>
                            <div className={css.uploadedFileIconBg}>
                              <CheckCircleOutlined />
                            </div>
                            <div className={css.uploadedFileInfo}>
                              <span className={css.uploadedFileName}>
                                {formValues.filePath.split("/").pop()}
                              </span>
                              <span className={css.uploadedFileStatus}>อัปโหลดสำเร็จ</span>
                            </div>
                            <Button
                              size="small"
                              danger
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormValues((p) => ({ ...p, filePath: "" }));
                              }}
                              className={css.uploadedFileRemove}
                            >
                              ลบ
                            </Button>
                          </div>
                        ) : (
                          <div className={css.uploadEmpty}>
                            <div className={`${css.uploadEmptyIconBg} ${css.uploadEmptyIconBgOrange}`}>
                              {uploadingFile ? <LoadingOutlined spin /> : <UploadOutlined />}
                            </div>
                            <p className={css.uploadEmptyTitle}>
                              {uploadingFile ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกไฟล์"}
                            </p>
                            <p className={css.uploadEmptyHint}>
                              {watchFileType === "pdf" ? "รองรับ .PDF" : watchFileType === "video" ? "รองรับไฟล์วิดีโอ" : "รองรับ JPG, PNG, WebP"}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section: Legacy */}
              <div className={css.formSection}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIconWrap} ${css.sectionIconPurple}`}>
                    <FolderOpenOutlined />
                  </div>
                  <div className={css.sectionTitle}>ข้อมูลเพิ่มเติม</div>
                </div>
                <div className={css.sectionBody}>
                  <Form.Item name="legacyPath" label="ชื่อไฟล์เก่า (Legacy Redirect)">
                    <Input
                      placeholder="เช่น d1e18c72-3a85-44c0-8b56-4006d934c177.pdf"
                      size="small"
                    />
                  </Form.Item>
                  <p className={css.legacyHint}>
                    ใส่ชื่อไฟล์เก่าจาก URL เดิม เพื่อให้ลิงก์เก่ายังใช้งานได้ (จาก /MemberMedia/File/xxx.pdf)
                  </p>
                </div>
              </div>
            </div>

            {/* Right column — cover & settings */}
            <div>
              {/* Section: Cover */}
              <div className={css.formSection}>
                <div className={css.sectionHeader}>
                  <div className={`${css.sectionIconWrap} ${css.sectionIconPurple}`}>
                    <PictureOutlined />
                  </div>
                  <div className={css.sectionTitle}>ภาพปก</div>
                </div>
                <div className={css.sectionBody}>
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload(e, "coverUrl", setUploadingCover)}
                  />
                  <div
                    className={`${css.uploadZone} ${formValues.coverUrl ? css.uploadZoneHasFile : ""}`}
                    onClick={() => !uploadingCover && !formValues.coverUrl && coverRef.current?.click()}
                    style={{ cursor: formValues.coverUrl ? "default" : "pointer" }}
                  >
                    {formValues.coverUrl ? (
                      <div className={css.uploadedFileCard}>
                        <div className={css.uploadedFileIconBg}>
                          <CheckCircleOutlined />
                        </div>
                        <div className={css.uploadedFileInfo}>
                          <span className={css.uploadedFileName}>
                            {formValues.coverUrl.split("/").pop()}
                          </span>
                          <span className={css.uploadedFileStatus}>อัปโหลดสำเร็จ</span>
                        </div>
                        <Button
                          size="small"
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormValues((p) => ({ ...p, coverUrl: "" }));
                          }}
                          className={css.uploadedFileRemove}
                        >
                          ลบ
                        </Button>
                      </div>
                    ) : (
                      <div className={css.uploadEmpty}>
                        <div className={css.uploadEmptyIconBg}>
                          {uploadingCover ? <LoadingOutlined spin /> : <PictureOutlined />}
                        </div>
                        <p className={css.uploadEmptyTitle}>
                          {uploadingCover ? "กำลังอัปโหลด..." : "คลิกเลือกภาพปก"}
                        </p>
                        <p className={css.uploadEmptyHint}>ไม่บังคับ — แสดง icon แทน</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Settings */}
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
                        <InputNumber min={0} style={{ width: "100%" }} size="small" />
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
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════
     LIST VIEW (with inline form panel)
     ══════════════════════════════════════════════ */
  return (
    <div className={css.container}>
      {/* Hero Header */}
      <div className={css.heroHeader}>
        <div className={css.heroTop}>
          <div className={css.heroTitleWrap}>
            <Title level={2} className={css.pageTitle}>
              สื่อสำหรับสมาชิก
            </Title>
            <p className={css.pageSubtitle}>
              จัดการเอกสาร วิดีโอ และสื่อต่างๆ สำหรับสมาชิกสหกรณ์
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            className={css.addBtn}
          >
            เพิ่มสื่อใหม่
          </Button>
        </div>

        <div className={css.statsRow}>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAll}`}>
              <BookOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.total}</span>
              <span className={css.statLabel}>ทั้งหมด</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconActive}`}>
              <CheckCircleOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.active}</span>
              <span className={css.statLabel}>กำลังแสดง</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconHidden}`}>
              <EyeInvisibleOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.hidden}</span>
              <span className={css.statLabel}>ซ่อนไว้</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconPdf}`}>
              <FileTextOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.pdf}</span>
              <span className={css.statLabel}>ไฟล์ PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline form panel */}
      {formMode === "form" && renderFormPanel()}

      {/* Category tabs */}
      <div className={css.tabsRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${css.tabBtn} ${activeTab === cat ? css.tabBtnActive : ""}`}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
            {cat === "ทั้งหมด"
              ? ` (${items.length})`
              : ` (${items.filter((i) => i.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={css.toolbar}>
        <div className={css.resultCount}>{filtered.length} รายการ</div>
      </div>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : filtered.length === 0 ? (
        <Empty
          image={<BookOutlined style={{ fontSize: 56, color: "#cbd5e1" }} />}
          description={<span style={{ color: "#94a3b8" }}>ยังไม่มีรายการ</span>}
          className={css.emptyState}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={css.addBtn}>
            เพิ่มสื่อแรก
          </Button>
        </Empty>
      ) : (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>หมวดหมู่</th>
                <th>ประเภท</th>
                <th>ลำดับ</th>
                <th>สถานะ</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={css.titleCell}>
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt="" className={css.coverThumb} />
                      ) : (
                        <div className={css.coverPlaceholder}>
                          {FILE_TYPE_ICON[item.fileType] || <FileTextOutlined />}
                        </div>
                      )}
                      <div className={css.titleText}>
                        <span className={css.titleName}>{item.title}</span>
                        {item.description && (
                          <span className={css.titleDesc}>{item.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={css.catBadge}>{item.category}</span>
                  </td>
                  <td>
                    <span className={`${css.badge} ${css[`badge${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}`] || css.badgePdf}`}>
                      {FILE_TYPES.find((f) => f.value === item.fileType)?.label || item.fileType}
                    </span>
                  </td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <button
                      className={`${css.statusBtn} ${item.isActive ? css.statusOn : css.statusOff}`}
                      onClick={() => handleToggle(item)}
                    >
                      <span
                        className={css.statusDot}
                        style={{ background: item.isActive ? "#16a34a" : "#d1d5db" }}
                      />
                      {item.isActive ? "เปิด" : "ปิด"}
                    </button>
                  </td>
                  <td>
                    <div className={css.actionBtns}>
                      <Tooltip title="แก้ไข">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          className={`${css.btnAction} ${css.btnActionEdit}`}
                          onClick={() => openEdit(item)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="ลบรายการนี้?"
                        description="คุณแน่ใจว่าต้องการลบ?"
                        onConfirm={() => handleDelete(item.id)}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="ลบ">
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            className={`${css.btnAction} ${css.btnActionDel}`}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
