"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  YoutubeOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  VideoCameraAddOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  message,
  Drawer,
  Tooltip,
  Popconfirm,
  Tag,
  Empty,
} from "antd";
import css from "./page.module.css";

const { Title } = Typography;
const { TextArea } = Input;

/* ── Types ── */
interface Video {
  id: number;
  title: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

interface VideoForm {
  title: string;
  youtubeUrl: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: VideoForm = {
  title: "",
  youtubeUrl: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<VideoForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [form] = Form.useForm();

  /* ── Load ── */
  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/videos");
      if (res.ok) {
        setVideos(await res.json());
      } else {
        message.error("ไม่สามารถโหลดข้อมูลวิดีโอได้");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: videos.length,
      active: videos.filter((v) => v.isActive).length,
      hidden: videos.filter((v) => !v.isActive).length,
    };
  }, [videos]);

  /* ── Extract YouTube ID for preview ── */
  const extractId = (url: string): string | null => {
    if (!url) return null;
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

  const openCreate = () => {
    setEditingId(null);
    setFormValues(defaultForm);
    form.setFieldsValue(defaultForm);
    setDrawerOpen(true);
  };

  const openEdit = (item: Video) => {
    setEditingId(item.id);
    const editForm = {
      title: item.title,
      youtubeUrl: item.youtubeUrl,
      description: item.description || "",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive,
    };
    setFormValues(editForm);
    form.setFieldsValue(editForm);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setFormValues(defaultForm);
    form.resetFields();
  };

  /* ── Save ── */
  const handleSave = async (values: any) => {
    const ytId = extractId(values.youtubeUrl);
    if (!ytId) {
      message.error("ลิงก์ YouTube ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = {
        ...values,
        id: editingId,
      };

      const res = await fetch("/api/admin/videos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("บันทึกข้อมูลเรียบร้อย");
        closeDrawer();
        fetchVideos();
      } else {
        const err = await res.json();
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
      const res = await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        message.success("ลบวิดีโอเรียบร้อย");
        fetchVideos();
      } else {
        message.error("ลบไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const livePreviewId = formValues.youtubeUrl ? extractId(formValues.youtubeUrl) : null;

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

  return (
    <div className={css.container}>
      {/* ── Hero Header ── */}
      <div className={css.heroHeader}>
        <div className={css.heroTop}>
          <div className={css.heroTitleWrap}>
            <Title level={2} className={css.pageTitle}>
              จัดการวิดีโอสหกรณ์
            </Title>
            <p className={css.pageSubtitle}>
              จัดการวิดีโอ YouTube ที่ต้องการให้แสดงบนหน้าเว็บไซต์
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            className={css.addBtn}
          >
            เพิ่มวิดีโอ
          </Button>
        </div>

        {/* Stats */}
        <div className={css.statsRow}>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAll}`}>
              <YoutubeOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.total}</span>
              <span className={css.statLabel}>วิดีโอทั้งหมด</span>
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
          {videos.length} รายการ
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        renderSkeleton()
      ) : videos.length === 0 ? (
        <Empty
          image={<VideoCameraAddOutlined style={{ fontSize: 56, color: "#cbd5e1" }} />}
          description={<span style={{ color: "#94a3b8" }}>ยังไม่มีวิดีโอในระบบ</span>}
          className={css.emptyState}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={css.addBtn}>
            เพิ่มวิดีโอแรก
          </Button>
        </Empty>
      ) : (
        <div className={css.videoGrid}>
          {videos.map((v) => (
            <div key={v.id} className={css.videoCard}>
              {/* Thumbnail / Player */}
              <div
                className={css.cardImageWrap}
                onClick={() => setPreviewId(previewId === v.youtubeId ? null : (v.youtubeId || null))}
              >
                {previewId === v.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={css.previewFrame}
                  />
                ) : (
                  <>
                    <img
                      src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt={v.title}
                      className={css.cardImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`;
                      }}
                    />
                    <div className={css.playOverlay}>
                      <PlayCircleOutlined className={css.playIcon} />
                    </div>
                  </>
                )}

                {/* Badges Overlay */}
                <div className={css.cardBadges}>
                  <div
                    className={`${css.statusDot} ${v.isActive ? css.statusActive : css.statusInactive}`}
                  />
                </div>
              </div>

              {/* Body */}
              <div className={css.cardBody}>
                <h3 className={css.cardTitle}>{v.title}</h3>
                {v.description && (
                  <p className={css.cardDesc}>{v.description}</p>
                )}
                <div className={css.cardUrl}>
                  <YoutubeOutlined style={{ color: "#ef4444", marginRight: 4 }} />
                  {v.youtubeUrl}
                </div>
              </div>

              {/* Footer */}
              <div className={css.cardFooter}>
                <div className={css.sortOrderBadge}>
                  ลำดับ: {v.sortOrder}
                </div>
                <div className={css.cardActions}>
                  <Tooltip title="แก้ไข">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      className={`${css.cardActionBtn} ${css.editBtn}`}
                      onClick={() => openEdit(v)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="ลบวิดีโอนี้?"
                    description="คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้?"
                    onConfirm={() => handleDelete(v.id)}
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

      {/* ── Drawer Form ── */}
      <Drawer
        title={
          <div className={css.drawerTitleWrap}>
            <div className={css.drawerTitleIcon}>
              {editingId ? <EditOutlined /> : <VideoCameraAddOutlined />}
            </div>
            <div>
              <div className={css.drawerTitle}>
                {editingId ? "แก้ไขวิดีโอ" : "เพิ่มวิดีโอใหม่"}
              </div>
              <div className={css.drawerSubtitle}>
                {editingId ? "แก้ไขรายละเอียดวิดีโอ YouTube" : "ระบุลิงก์และรายละเอียดของวิดีโอ"}
              </div>
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={closeDrawer}
        styles={{ wrapper: { width: 560 } }}
        destroyOnClose
        maskClosable={false}
        keyboard={false}
        className={css.customDrawer}
        extra={
          <div className={css.drawerActions}>
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
        }
      >
        <div className={css.formContainer}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={defaultForm}
            className={css.form}
          >
            <div className={css.formSection}>
              <div className={css.sectionTitle}>ข้อมูลวิดีโอ YouTube</div>
              <Form.Item
                name="youtubeUrl"
                label="ลิงก์ YouTube (URL)"
                rules={[{ required: true, message: "กรุณาระบุลิงก์ YouTube" }]}
              >
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  size="middle"
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      youtubeUrl: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              {/* Live Preview */}
              {livePreviewId && (
                <div className={css.ytPreviewBox}>
                  <iframe
                    src={`https://www.youtube.com/embed/${livePreviewId}`}
                    title="Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  />
                </div>
              )}

              <Form.Item
                name="title"
                label="ชื่อวิดีโอ"
                rules={[{ required: true, message: "กรุณาระบุชื่อวิดีโอ" }]}
                style={{ marginTop: 20 }}
              >
                <Input
                  placeholder="เช่น กิจกรรมวันสถาปนาสหกรณ์ 2567"
                  size="middle"
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="คำอธิบาย (ไม่บังคับ)" name="description">
                <TextArea
                  rows={4}
                  placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับวิดีโอ"
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </Form.Item>
            </div>

            <div className={css.formSection}>
              <div className={css.sectionTitle}>การตั้งค่าการแสดงผล</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <Form.Item label="ลำดับการแสดงผล" name="sortOrder">
                  <InputNumber
                    min={0}
                    style={{ width: "100%", borderRadius: 8 }}
                    size="middle"
                    onChange={(val) =>
                      setFormValues((prev) => ({
                        ...prev,
                        sortOrder: val ?? 0,
                      }))
                    }
                  />
                </Form.Item>

                <div className={css.switchItem} style={{ padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 8, height: 40, marginTop: 32 }}>
                  <span className={css.switchLabel}>สถานะเผยแพร่</span>
                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch
                      onChange={(val) =>
                        setFormValues((prev) => ({
                          ...prev,
                          isActive: val,
                        }))
                      }
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </Drawer>
    </div>
  );
}
