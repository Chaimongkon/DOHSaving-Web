"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  LoadingOutlined,
  PictureOutlined,
  CameraOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Typography,
  message,
  Drawer,
  Tooltip,
  Popconfirm,
  Empty,
} from "antd";
import { ImagePlus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import css from "./page.module.css";

const { Title } = Typography;
const { TextArea } = Input;

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

interface AlbumForm {
  title: string;
  description: string;
  coverUrl: string;
  eventDate: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: AlbumForm = {
  title: "",
  description: "",
  coverUrl: "",
  eventDate: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminActivityAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<AlbumForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Photo management
  const [photoAlbumId, setPhotoAlbumId] = useState<number | null>(null);
  const [photoAlbumTitle, setPhotoAlbumTitle] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  /* ── Load albums ── */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity-albums", { credentials: "include" });
      if (res.ok) setAlbums(await res.json());
      else message.error("ไม่สามารถโหลดข้อมูลอัลบั้มได้");
    } catch {
      message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const stats = useMemo(() => ({
    total: albums.length,
    active: albums.filter((a) => a.isActive).length,
    hidden: albums.filter((a) => !a.isActive).length,
    totalPhotos: albums.reduce((sum, a) => sum + (a._count?.photos || 0), 0),
  }), [albums]);

  /* ── Load photos for album ── */
  const loadPhotos = useCallback(async (albumId: number) => {
    const res = await fetch(`/api/admin/activity-photos?albumId=${albumId}`, { credentials: "include" });
    if (res.ok) setPhotos(await res.json());
  }, []);

  /* ── Drawer open/close ── */
  const openCreate = () => {
    setEditingId(null);
    setFormValues(defaultForm);
    form.setFieldsValue({ ...defaultForm, eventDate: null });
    setDrawerOpen(true);
  };

  const openEdit = (album: Album) => {
    setEditingId(album.id || null);
    const editForm: AlbumForm = {
      title: album.title,
      description: album.description || "",
      coverUrl: album.coverUrl || "",
      eventDate: album.eventDate || "",
      sortOrder: album.sortOrder || 0,
      isActive: album.isActive,
    };
    setFormValues(editForm);
    form.setFieldsValue({
      ...editForm,
      eventDate: album.eventDate ? dayjs(album.eventDate) : null,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setFormValues(defaultForm);
    form.resetFields();
  };

  /* ── Save album ── */
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        coverUrl: formValues.coverUrl || null,
        eventDate: values.eventDate ? dayjs(values.eventDate).format("YYYY-MM-DD") : null,
        sortOrder: values.sortOrder || 0,
        isActive: values.isActive ?? true,
      };
      if (editingId) payload.id = editingId;

      const res = await fetch("/api/admin/activity-albums", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        message.success("บันทึกข้อมูลเรียบร้อย");
        closeDrawer();
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

  /* ── Delete album ── */
  const removeAlbum = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/activity-albums?id=${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        message.success("ลบอัลบั้มเรียบร้อย");
        load();
      } else message.error("ลบไม่สำเร็จ");
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบ");
    }
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
        setFormValues((prev) => ({ ...prev, coverUrl: data.url }));
        message.success("อัปโหลดภาพปกสำเร็จ");
      } else message.error("อัปโหลดไม่สำเร็จ");
    } catch { message.error("อัปโหลดไม่สำเร็จ"); }
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
        message.success(`เพิ่มรูปภาพ ${urls.length} รูปสำเร็จ`);
        loadPhotos(photoAlbumId);
        load();
      }
    } catch { message.error("อัปโหลดรูปไม่สำเร็จ"); }
    setUploadingPhotos(false);
  };

  /* ── Delete photo ── */
  const removePhoto = async (photoId: number) => {
    try {
      await fetch(`/api/admin/activity-photos?id=${photoId}`, { method: "DELETE", credentials: "include" });
      message.success("ลบรูปเรียบร้อย");
      if (photoAlbumId) { loadPhotos(photoAlbumId); load(); }
    } catch { message.error("ลบรูปไม่สำเร็จ"); }
  };

  /* ── Set as cover ── */
  const setAsCover = async (albumId: number, imageUrl: string) => {
    await fetch("/api/admin/activity-albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId, coverUrl: imageUrl }),
      credentials: "include",
    });
    message.success("ตั้งเป็นภาพปกเรียบร้อย");
    load();
  };

  // Skeleton loading
  const renderSkeleton = () => (
    <div className={css.loadingGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={css.skeletonCard}>
          <div className={css.skeletonImage} />
          <div className={css.skeletonBody}>
            <div className={css.skeletonLine} />
            <div className={css.skeletonLine} />
            <div className={css.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  );

  /* ══════════════════════════════════════════════
     Photo Manager View
     ══════════════════════════════════════════════ */
  if (photoAlbumId) {
    return (
      <div className={css.photoManager}>
        {/* Header */}
        <div className={css.photoHeader}>
          <div className={css.photoHeaderTop}>
            <div className={css.photoHeaderInfo}>
              <Title level={3} className={css.photoHeaderTitle}>
                <CameraOutlined style={{ marginRight: 8 }} />
                {photoAlbumTitle}
              </Title>
              <p className={css.photoHeaderSub}>
                จัดการรูปภาพในอัลบั้ม — {photos.length} รูป
              </p>
            </div>
            <div className={css.photoHeaderActions}>
              <input
                ref={photosInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.length) uploadPhotosHandler(e.target.files); }}
              />
              <Button
                type="primary"
                icon={uploadingPhotos ? <LoadingOutlined spin /> : <ImagePlus size={15} />}
                onClick={() => photosInputRef.current?.click()}
                disabled={uploadingPhotos}
                loading={uploadingPhotos}
                className={css.uploadPhotosBtn}
              >
                {uploadingPhotos ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ"}
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => { setPhotoAlbumId(null); setPhotos([]); }}
                className={css.backBtn}
              >
                กลับ
              </Button>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className={css.photoEmpty}>
            <PictureOutlined className={css.photoEmptyIcon} />
            <p className={css.photoEmptyText}>ยังไม่มีรูปภาพในอัลบั้มนี้</p>
            <p className={css.photoEmptyHint}>
              คลิก &quot;เพิ่มรูปภาพ&quot; เพื่ออัปโหลดรูปหลายรูปพร้อมกัน
            </p>
          </div>
        ) : (
          <div className={css.photoGrid}>
            {photos.map((p) => (
              <div key={p.id} className={css.photoCard}>
                <div className={css.photoImageWrap}>
                  <img
                    src={p.imageUrl}
                    alt={p.caption || ""}
                    className={css.photoImage}
                  />
                </div>
                <div className={css.photoActions}>
                  <Button
                    size="small"
                    icon={<PictureOutlined />}
                    onClick={() => setAsCover(photoAlbumId, p.imageUrl)}
                    className={css.setCoverBtn}
                  >
                    ตั้งเป็นปก
                  </Button>
                  <Popconfirm
                    title="ลบรูปนี้?"
                    description="คุณแน่ใจว่าต้องการลบรูปนี้?"
                    onConfirm={() => removePhoto(p.id)}
                    okText="ลบ"
                    cancelText="ยกเลิก"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="ลบรูป">
                      <Button
                        size="small"
                        icon={<Trash2 size={13} />}
                        className={css.deletePhotoBtn}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     Main Album List
     ══════════════════════════════════════════════ */
  return (
    <div className={css.container}>
      {/* ── Hero Header ── */}
      <div className={css.heroHeader}>
        <div className={css.heroTop}>
          <div className={css.heroTitleWrap}>
            <Title level={2} className={css.pageTitle}>
              อัลบั้มภาพกิจกรรม
            </Title>
            <p className={css.pageSubtitle}>
              จัดการอัลบั้มและรูปภาพกิจกรรมของสหกรณ์
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            className={css.addBtn}
          >
            สร้างอัลบั้ม
          </Button>
        </div>

        {/* Stats */}
        <div className={css.statsRow}>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAll}`}>
              <CameraOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.total}</span>
              <span className={css.statLabel}>อัลบั้มทั้งหมด</span>
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
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={css.toolbar}>
        <div className={css.resultCount}>
          {albums.length} อัลบั้ม · {stats.totalPhotos} รูปภาพ
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        renderSkeleton()
      ) : albums.length === 0 ? (
        <Empty
          image={<CameraOutlined style={{ fontSize: 56, color: "#cbd5e1" }} />}
          description={<span style={{ color: "#94a3b8" }}>ยังไม่มีอัลบั้มภาพกิจกรรม</span>}
          className={css.emptyState}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={css.addBtn}>
            สร้างอัลบั้มแรก
          </Button>
        </Empty>
      ) : (
        <div className={css.albumGrid}>
          {albums.map((album) => (
            <div
              key={album.id}
              className={`${css.albumCard} ${!album.isActive ? css.albumCardInactive : ""}`}
            >
              {/* Cover */}
              <div className={css.cardCoverWrap}>
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className={css.cardCoverImage}
                  />
                ) : (
                  <div className={css.cardCoverPlaceholder}>
                    <CameraOutlined />
                  </div>
                )}
                <div className={css.cardOverlayBadges}>
                  <span className={css.photoCountBadge}>
                    <PictureOutlined /> {album._count?.photos || 0} รูป
                  </span>
                  <span
                    className={`${css.statusBadge} ${album.isActive ? css.statusPublished : css.statusHidden}`}
                  >
                    {album.isActive ? (
                      <><EyeOutlined /> เผยแพร่</>
                    ) : (
                      <><EyeInvisibleOutlined /> ซ่อน</>
                    )}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className={css.cardBody}>
                <h3 className={css.cardTitle}>{album.title}</h3>
                {album.eventDate && (
                  <p className={css.cardDate}>
                    <CalendarOutlined />
                    {new Date(album.eventDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {album.description && (
                  <p className={css.cardDesc}>{album.description}</p>
                )}
              </div>

              {/* Footer */}
              <div className={css.cardFooter}>
                <Button
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => {
                    setPhotoAlbumId(album.id!);
                    setPhotoAlbumTitle(album.title);
                    loadPhotos(album.id!);
                  }}
                  className={css.managePhotosBtn}
                >
                  จัดการรูป
                </Button>
                <div className={css.cardActions}>
                  <Tooltip title="แก้ไข">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      className={`${css.cardActionBtn} ${css.editBtn}`}
                      onClick={() => openEdit(album)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="ลบอัลบั้มนี้?"
                    description="ลบอัลบั้มพร้อมรูปภาพทั้งหมด"
                    onConfirm={() => album.id && removeAlbum(album.id)}
                    okText="ลบ"
                    cancelText="ยกเลิก"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="ลบ">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        className={`${css.cardActionBtn} ${css.deleteBtn}`}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Drawer Form
          ══════════════════════════════════════════════ */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={closeDrawer}
        styles={{ wrapper: { width: 540 } }}
        destroyOnClose
        maskClosable={false}
        keyboard={false}
        className={css.customDrawer}
        closable={false}
      >
        {/* ── Gradient Hero Header ── */}
        <div className={css.drawerHero}>
          <div className={css.drawerHeroInner}>
            <div className={css.drawerTitleIcon}>
              {editingId ? <EditOutlined /> : <CameraOutlined />}
            </div>
            <div>
              <div className={css.drawerTitle}>
                {editingId ? "แก้ไขอัลบั้ม" : "สร้างอัลบั้มใหม่"}
              </div>
              <div className={css.drawerSubtitle}>
                {editingId
                  ? "แก้ไขรายละเอียดอัลบั้มภาพกิจกรรม"
                  : "ระบุข้อมูลอัลบั้มภาพกิจกรรมใหม่"}
              </div>
            </div>
          </div>
        </div>

        <div className={css.formContainer}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={defaultForm}
            className={css.form}
          >
            {/* Section 1: Album info */}
            <div className={css.formSection}>
              <div className={css.sectionHeader}>
                <div className={`${css.sectionIconWrap} ${css.sectionIconBlue}`}>
                  <EditOutlined />
                </div>
                <div className={css.sectionTitle}>ข้อมูลอัลบั้ม</div>
              </div>
              <div className={css.sectionBody}>
                <Form.Item
                  name="title"
                  label="ชื่ออัลบั้ม"
                  rules={[{ required: true, message: "กรุณาระบุชื่ออัลบั้ม" }]}
                >
                  <Input
                    placeholder="เช่น ประชุมใหญ่สามัญประจำปี 2568"
                    size="middle"
                  />
                </Form.Item>

                <Form.Item name="eventDate" label="วันที่จัดกิจกรรม">
                  <DatePicker
                    placeholder="เลือกวันที่"
                    style={{ width: "100%" }}
                    size="middle"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

                <Form.Item name="description" label="คำอธิบาย (ไม่บังคับ)">
                  <TextArea
                    rows={3}
                    placeholder="รายละเอียดกิจกรรม..."
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section 2: Cover image */}
            <div className={css.formSection}>
              <div className={css.sectionHeader}>
                <div className={`${css.sectionIconWrap} ${css.sectionIconPurple}`}>
                  <PictureOutlined />
                </div>
                <div className={css.sectionTitle}>ภาพปก</div>
              </div>
              <div className={css.sectionBody}>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadCover(e.target.files[0]);
                  }}
                />
                <div
                  className={`${css.coverUploadZone} ${formValues.coverUrl ? css.coverUploadZoneActive : ""}`}
                  onClick={() => !uploading && coverInputRef.current?.click()}
                >
                  {formValues.coverUrl ? (
                    <div className={css.coverHasImage}>
                      <img
                        src={formValues.coverUrl}
                        alt="cover"
                        className={css.coverLargeThumb}
                      />
                      <div className={css.coverOverlay}>
                        <Button
                          icon={<UploadOutlined />}
                          className={css.coverChangeBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            coverInputRef.current?.click();
                          }}
                        >
                          เปลี่ยนภาพปก
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={css.coverEmptyContent}>
                      <div className={css.coverEmptyIconBg}>
                        {uploading ? <LoadingOutlined spin /> : <UploadOutlined />}
                      </div>
                      <p className={css.coverEmptyTitle}>
                        {uploading ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกภาพปก"}
                      </p>
                      <p className={css.coverEmptyHint}>
                        รองรับไฟล์ JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Settings */}
            <div className={css.formSection}>
              <div className={css.sectionHeader}>
                <div className={`${css.sectionIconWrap} ${css.sectionIconGreen}`}>
                  <CheckCircleOutlined />
                </div>
                <div className={css.sectionTitle}>การตั้งค่า</div>
              </div>
              <div className={css.sectionBody}>
                <div className={css.settingsRow}>
                  <div className={css.settingCard}>
                    <div className={`${css.settingCardIcon} ${css.settingCardIconSort}`}>
                      <CalendarOutlined />
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
          </Form>
        </div>

        {/* ── Sticky Footer ── */}
        <div className={css.drawerFooter}>
          <Button onClick={closeDrawer} size="middle" className={css.cancelBtn}>
            ยกเลิก
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={saving}
            size="middle"
            className={css.submitBtn}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
