/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  EyeOutlined,
  PushpinOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Typography,
  message,
  Drawer,
  Tooltip,
  Popconfirm,
  Tag,
  Tabs,
  Empty,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dynamic from "next/dynamic";
import css from "./page.module.css";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const { Title, Text } = Typography;

interface News {
  id: number;
  title: string | null;
  details: string | null;
  imagePath: string | null;
  pdfPath: string | null;
  legacyPath: string | null;
  category: string;
  viewCount: number;
  isPinned: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsForm {
  title: string;
  details: string;
  imagePath: string;
  pdfPath: string;
  legacyPath: string;
  category: string;
  isPinned: boolean;
  isActive: boolean;
}

const defaultForm: NewsForm = {
  title: "",
  details: "",
  imagePath: "",
  pdfPath: "",
  legacyPath: "",
  category: "general",
  isPinned: false,
  isActive: true,
};

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

const categories = [
  { value: "all", label: "ทั้งหมด" },
  { value: "announcement", label: "ประกาศ" },
  { value: "member-approval", label: "อนุมัติสมาชิก" },
  { value: "general", label: "ทั่วไป" },
];

const categoryColors: Record<string, string> = {
  announcement: "orange",
  "member-approval": "green",
  general: "blue",
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<NewsForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [filter, setFilter] = useState("all");
  const [modalTab, setModalTab] = useState("edit");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  // Fetch news
  const fetchNews = async () => {
    try {
      const res = await fetch("/api/admin/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลข่าวได้");
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
      message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalViews = news.reduce((sum, n) => sum + n.viewCount, 0);
    return {
      total: news.length,
      active: news.filter((n) => n.isActive).length,
      pinned: news.filter((n) => n.isPinned).length,
      views: totalViews,
    };
  }, [news]);

  const openCreate = () => {
    setEditingId(null);
    setFormValues(defaultForm);
    form.setFieldsValue(defaultForm);
    setModalTab("edit");
    setModalOpen(true);
  };

  const openEdit = (item: News) => {
    setEditingId(item.id);
    const editForm = {
      title: item.title || "",
      details: item.details || "",
      imagePath: item.imagePath || "",
      pdfPath: item.pdfPath || "",
      legacyPath: item.legacyPath || "",
      category: item.category,
      isPinned: item.isPinned ?? false,
      isActive: item.isActive,
    };
    setFormValues(editForm);
    form.setFieldsValue(editForm);
    setModalTab("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormValues(defaultForm);
    form.resetFields();
  };

  // Upload image
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFormValues((prev) => ({ ...prev, imagePath: data.url }));
        form.setFieldValue("imagePath", data.url);
        message.success("อัพโหลดรูปภาพสำเร็จ");
      } else {
        message.error(data.error || "อัพโหลดไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการอัพโหลด");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Upload PDF
  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news-pdf");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFormValues((prev) => ({ ...prev, pdfPath: data.url }));
        form.setFieldValue("pdfPath", data.url);
        message.success("อัพโหลด PDF สำเร็จ");
      } else {
        message.error(data.error || "อัพโหลดไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการอัพโหลด");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  // Save (create or update)
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/news/${editingId}`
        : "/api/admin/news";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...values,
        details: formValues.details,
        imagePath: formValues.imagePath,
        pdfPath: formValues.pdfPath,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("บันทึกข้อมูลเรียบร้อย");
        closeModal();
        fetchNews();
      } else {
        const data = await res.json();
        message.error(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        message.success("ลบข่าวเรียบร้อย");
        fetchNews();
      } else {
        message.error("ลบข่าวไม่สำเร็จ");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format number
  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchText]);

  // Filtered list
  const filtered = news.filter((n) => {
    const matchCategory = filter === "all" || n.category === filter;
    const matchSearch =
      n.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      n.details?.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Generate page numbers to show
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // Table columns
  const tableColumns: ColumnsType<News> = [
    {
      title: "รูป",
      dataIndex: "imagePath",
      width: 80,
      render: (v: string | null) =>
        v ? (
          <img src={v} alt="" className={css.tableThumb} />
        ) : (
          <div className={css.tableThumbPlaceholder}>
            <FileTextOutlined />
          </div>
        ),
    },
    {
      title: "หัวข้อข่าว",
      dataIndex: "title",
      render: (v: string | null, record: News) => (
        <div className={css.tableTitleWrap}>
          <span className={css.tableTitle}>{v || "ไม่มีหัวข้อ"}</span>
          <span className={css.tableDate}>{formatDate(record.createdAt)}</span>
        </div>
      ),
    },
    {
      title: "หมวด",
      dataIndex: "category",
      width: 120,
      render: (v: string) => (
        <Tag color={categoryColors[v] || "default"}>
          {categories.find((c) => c.value === v)?.label || v}
        </Tag>
      ),
    },
    {
      title: "เข้าชม",
      dataIndex: "viewCount",
      width: 90,
      sorter: (a: News, b: News) => a.viewCount - b.viewCount,
      render: (v: number) => (
        <span style={{ color: "#64748b" }}>
          <EyeOutlined /> {formatNum(v)}
        </span>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "isActive",
      width: 90,
      render: (v: boolean, record: News) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Tag color={v ? "green" : "red"}>{v ? "แสดง" : "ซ่อน"}</Tag>
          {record.isPinned && (
            <Tag color="gold" icon={<PushpinOutlined />} />
          )}
        </div>
      ),
    },
    {
      title: "",
      width: 90,
      render: (_: any, record: News) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              className={`${css.cardActionBtn} ${css.editBtn}`}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="ลบข่าวนี้?"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?"
            onConfirm={() => handleDelete(record.id)}
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
      ),
    },
  ];

  const previewTabContent = (
    <div className={css.previewWrap}>
      {formValues.imagePath && (
        <div className={css.previewImage}>
          <img src={formValues.imagePath} alt="Preview" />
        </div>
      )}
      <div className={css.previewHeader}>
        <Tag color={categoryColors[formValues.category] || "default"}>
          {categories.find((c) => c.value === formValues.category)?.label || formValues.category}
        </Tag>
        {formValues.isPinned && (
          <Tag color="gold" icon={<PushpinOutlined />}>
            ปักหมุด
          </Tag>
        )}
      </div>
      <Title level={4} className={css.previewTitle}>
        {formValues.title || "(ยังไม่มีหัวข้อ)"}
      </Title>
      {formValues.details && (
        <div
          className={css.previewContent}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formValues.details) }}
        />
      )}
      {formValues.pdfPath && (
        <div className={css.previewPdf}>
          <FilePdfOutlined /> {formValues.pdfPath.split("/").pop()}
        </div>
      )}
      {!formValues.title && !formValues.details && !formValues.imagePath && (
        <Empty description="กรุณากรอกข้อมูลในแท็บ 'แก้ไข' ก่อน" />
      )}
    </div>
  );

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
              จัดการข่าวประชาสัมพันธ์
            </Title>
            <p className={css.pageSubtitle}>
              จัดการข่าวสาร ประกาศ และเนื้อหาสำหรับเว็บไซต์สหกรณ์
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            className={css.addBtn}
          >
            เพิ่มข่าวใหม่
          </Button>
        </div>

        {/* Stats */}
        <div className={css.statsRow}>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconAll}`}>
              <FileTextOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.total}</span>
              <span className={css.statLabel}>ข่าวทั้งหมด</span>
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
            <div className={`${css.statIconWrap} ${css.statIconPinned}`}>
              <PushpinOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{stats.pinned}</span>
              <span className={css.statLabel}>ปักหมุด</span>
            </div>
          </div>
          <div className={css.statCard}>
            <div className={`${css.statIconWrap} ${css.statIconViews}`}>
              <EyeOutlined />
            </div>
            <div className={css.statInfo}>
              <span className={css.statValue}>{formatNum(stats.views)}</span>
              <span className={css.statLabel}>ยอดเข้าชมรวม</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={css.toolbar}>
        <div className={css.toolbarTop}>
          <div className={css.toolbarLeft}>
            <Input
              placeholder="ค้นหาข่าว..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              onChange={(e) => setSearchText(e.target.value)}
              className={css.searchInput}
              allowClear
              size="middle"
            />
          </div>
          <div className={css.toolbarRight}>
            <span className={css.resultCount}>
              {filtered.length} รายการ
            </span>
            <div className={css.viewToggle}>
              <Button
                type="text"
                icon={<AppstoreOutlined />}
                className={`${css.viewBtn} ${viewMode === "grid" ? css.viewBtnActive : ""}`}
                onClick={() => setViewMode("grid")}
              />
              <Button
                type="text"
                icon={<UnorderedListOutlined />}
                className={`${css.viewBtn} ${viewMode === "table" ? css.viewBtnActive : ""}`}
                onClick={() => setViewMode("table")}
              />
            </div>
          </div>
        </div>
        <div className={css.filterChips}>
          {categories.map((cat) => {
            const count =
              cat.value === "all"
                ? news.length
                : news.filter((n) => n.category === cat.value).length;
            return (
              <button
                key={cat.value}
                className={`${css.chip} ${filter === cat.value ? css.chipActive : ""}`}
                onClick={() => setFilter(cat.value)}
              >
                {cat.label}
                <span className={css.chipCount}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        renderSkeleton()
      ) : filtered.length === 0 ? (
        <Empty
          image={<FileAddOutlined style={{ fontSize: 56, color: "#cbd5e1" }} />}
          description={
            <span style={{ color: "#94a3b8" }}>
              {searchText || filter !== "all"
                ? "ไม่พบข่าวที่ค้นหา"
                : "ยังไม่มีข่าวประชาสัมพันธ์"}
            </span>
          }
          className={css.emptyState}
        >
          {!searchText && filter === "all" && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={css.addBtn}>
              เพิ่มข่าวแรก
            </Button>
          )}
        </Empty>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className={css.newsGrid}>
          {paginatedItems.map((item) => (
            <div key={item.id} className={css.newsCard}>
              <div className={css.cardImageWrap}>
                {item.imagePath ? (
                  <img
                    alt={item.title || "News"}
                    src={item.imagePath}
                    className={css.cardImage}
                  />
                ) : (
                  <div className={css.placeholderImage}>
                    <FileTextOutlined />
                  </div>
                )}
                <div className={css.cardOverlay} />

                {/* Badges */}
                <div className={css.cardBadges}>
                  <div className={css.cardBadgesLeft}>
                    {item.isPinned && (
                      <Tag icon={<PushpinOutlined />} className={css.pinBadge}>
                        ปักหมุด
                      </Tag>
                    )}
                    <Tag
                      color={categoryColors[item.category] || "default"}
                      className={css.catBadge}
                    >
                      {categories.find((c) => c.value === item.category)
                        ?.label || item.category}
                    </Tag>
                  </div>
                  <div
                    className={`${css.statusDot} ${item.isActive ? css.statusActive : css.statusInactive}`}
                  />
                </div>

                {/* View count */}
                <div className={css.viewCount}>
                  <EyeOutlined /> {formatNum(item.viewCount)}
                </div>
              </div>

              {/* Body */}
              <div className={css.cardBody}>
                <h3 className={css.cardTitle}>
                  {item.title || "ไม่มีหัวข้อ"}
                </h3>
                {item.details && (
                  <p className={css.cardDesc}>
                    {sanitizeHtml(item.details).replace(/<[^>]+>/g, "")}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className={css.cardFooter}>
                <div className={css.cardMeta}>
                  <span>{formatDate(item.createdAt)}</span>
                  <span className={css.cardMetaDivider} />
                  <span>{item.createdBy || "Admin"}</span>
                  {item.pdfPath && (
                    <>
                      <span className={css.cardMetaDivider} />
                      <FilePdfOutlined style={{ color: "#ef4444" }} />
                    </>
                  )}
                </div>
                <div className={css.cardActions}>
                  <Tooltip title="แก้ไข">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      className={`${css.cardActionBtn} ${css.editBtn}`}
                      onClick={() => openEdit(item)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="ลบข่าวนี้?"
                    description="คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?"
                    onConfirm={() => handleDelete(item.id)}
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
      ) : (
        /* ── Table View ── */
        <div className={css.tableWrapper}>
          <Table
            dataSource={filtered}
            columns={tableColumns}
            rowKey="id"
            pagination={{
              pageSize,
              current: currentPage,
              total: filtered.length,
              onChange: handlePageChange,
              onShowSizeChange: (_, size) => handlePageSizeChange(size),
              showSizeChanger: true,
              pageSizeOptions: ["12", "24", "48"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
            size="middle"
          />
        </div>
      )}

      {/* ── Custom Pagination (Grid view) ── */}
      {!loading && filtered.length > 0 && viewMode === "grid" && totalPages > 1 && (
        <div className={css.paginationWrap}>
          <div className={css.paginationInfo}>
            แสดง {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} จาก{" "}
            <strong>{filtered.length}</strong> รายการ
          </div>

          <div className={css.paginationCenter}>
            <button
              className={`${css.pageBtn} ${css.pageBtnNav}`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              title="หน้าแรก"
            >
              <DoubleLeftOutlined />
            </button>
            <button
              className={`${css.pageBtn} ${css.pageBtnNav}`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="ก่อนหน้า"
            >
              <LeftOutlined />
            </button>

            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className={css.pageDots}>
                  ···
                </span>
              ) : (
                <button
                  key={page}
                  className={`${css.pageBtn} ${currentPage === page ? css.pageBtnActive : ""}`}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </button>
              )
            )}

            <button
              className={`${css.pageBtn} ${css.pageBtnNav}`}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              title="ถัดไป"
            >
              <RightOutlined />
            </button>
            <button
              className={`${css.pageBtn} ${css.pageBtnNav}`}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="หน้าสุดท้าย"
            >
              <DoubleRightOutlined />
            </button>
          </div>

          <div className={css.pageSizeWrap}>
            <select
              className={css.pageSizeSelect}
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={12}>12 / หน้า</option>
              <option value={24}>24 / หน้า</option>
              <option value={48}>48 / หน้า</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Drawer Form ── */}
      <Drawer
        title={
          <div className={css.drawerTitleWrap}>
            <div className={css.drawerTitleIcon}>
              {editingId ? <EditOutlined /> : <FileAddOutlined />}
            </div>
            <div>
              <div className={css.drawerTitle}>
                {editingId ? "แก้ไขข่าวประชาสัมพันธ์" : "เพิ่มข่าวประชาสัมพันธ์"}
              </div>
              <div className={css.drawerSubtitle}>
                {editingId ? "แก้ไขรายละเอียดข่าวสารให้ครบถ้วน" : "กรอกข้อมูลข่าวสารใหม่ให้ครบถ้วน"}
              </div>
            </div>
          </div>
        }
        open={modalOpen}
        onClose={closeModal}
        styles={{ wrapper: { width: 720 } }}
        destroyOnClose
        maskClosable={false}
        keyboard={false}
        className={css.customDrawer}
        extra={
          <div className={css.drawerActions}>
            <Button onClick={closeModal} className={css.cancelBtn}>
              ยกเลิก
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              className={css.submitBtn}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        }
      >
        <Tabs
          activeKey={modalTab}
          onChange={setModalTab}
          className={css.drawerTabs}
          items={[
            {
              key: "edit",
              label: "ฟอร์มข้อมูล",
              children: (
                <div className={css.formContainer}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={defaultForm}
                    className={css.form}
                  >
                    <div className={css.formSection}>
                      <div className={css.sectionTitle}>ข้อมูลทั่วไป</div>
                      <Form.Item
                        name="title"
                        label="หัวข้อข่าว"
                        rules={[{ required: true, message: "กรุณาระบุหัวข้อข่าว" }]}
                      >
                        <Input
                          placeholder="ระบุหัวข้อข่าวที่น่าสนใจ..."
                          size="large"
                          onChange={(e) =>
                            setFormValues((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </Form.Item>

                      <Form.Item label="รายละเอียดเนื้อหา">
                        <div className={css.editorWrap}>
                          <ReactQuill
                            theme="snow"
                            value={formValues.details}
                            onChange={(val: string) =>
                              setFormValues((prev) => ({ ...prev, details: val }))
                            }
                            modules={quillModules}
                            placeholder="พิมพ์รายละเอียดข่าวสาร..."
                          />
                        </div>
                      </Form.Item>
                    </div>

                    <div className={css.formSection}>
                      <div className={css.sectionTitle}>หมวดหมู่และการตั้งค่า</div>
                      <Row gutter={24}>
                        <Col xs={24} md={12}>
                          <Form.Item name="category" label="หมวดหมู่หลัก">
                            <Select
                              size="large"
                              onChange={(val) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  category: val,
                                }))
                              }
                            >
                              <Select.Option value="general">ทั่วไป</Select.Option>
                              <Select.Option value="announcement">
                                ประกาศ
                              </Select.Option>
                              <Select.Option value="member-approval">
                                อนุมัติสมาชิก
                              </Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="legacyPath"
                            label="ไฟล์เชื่อมโยง (Legacy Redirect)"
                            tooltip="ใช้สำหรับเชื่อมลิงก์ไฟล์จากระบบเก่า (ถ้ามี)"
                          >
                            <Input
                              placeholder="เช่น 34005357-f6e8.pdf"
                              size="large"
                              onChange={(e) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  legacyPath: e.target.value,
                                }))
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <div className={css.switchContainer}>
                        <div className={css.switchItem}>
                          <div>
                            <div className={css.switchLabel}>ปักหมุดข่าว</div>
                            <div className={css.switchDesc}>แสดงข่าวนี้ไว้บนสุดเสมอ</div>
                          </div>
                          <Form.Item name="isPinned" valuePropName="checked" noStyle>
                            <Switch
                              onChange={(val) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  isPinned: val,
                                }))
                              }
                            />
                          </Form.Item>
                        </div>
                        <div className={css.switchDivider} />
                        <div className={css.switchItem}>
                          <div>
                            <div className={css.switchLabel}>สถานะการแสดงผล</div>
                            <div className={css.switchDesc}>เปิดเพื่อแสดงข่าวบนเว็บไซต์</div>
                          </div>
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

                    <div className={css.formSection}>
                      <div className={css.sectionTitle}>สื่อประกอบ</div>
                      <Row gutter={24}>
                        <Col xs={24} md={12}>
                          <Form.Item label="รูปภาพหน้าปก">
                            {formValues.imagePath ? (
                              <div className={css.previewUploadWrapper}>
                                <img
                                  src={formValues.imagePath}
                                  alt="preview"
                                  className={css.uploadedImg}
                                />
                                <div className={css.uploadedOverlay}>
                                  <Button
                                    danger
                                    type="primary"
                                    shape="circle"
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      setFormValues((prev) => ({
                                        ...prev,
                                        imagePath: "",
                                      }));
                                      form.setFieldValue("imagePath", "");
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div
                                className={css.uploadBox}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <div className={css.uploadIconCircle}>
                                  <CloudUploadOutlined />
                                </div>
                                <div>
                                  <div className={css.uploadTitle}>
                                    {uploading ? "กำลังอัพโหลด..." : "อัพโหลดรูปภาพ"}
                                  </div>
                                  <div className={css.uploadDesc}>
                                    PNG, JPG, WebP (แนะนำ 800x600px)
                                  </div>
                                </div>
                              </div>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={handleUploadImage}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="เอกสารแนบ (PDF)">
                            {formValues.pdfPath ? (
                              <div className={css.pdfUploadedCard}>
                                <div className={css.pdfIconCircle}>
                                  <FilePdfOutlined />
                                </div>
                                <div className={css.pdfInfo}>
                                  <div className={css.pdfNameText}>
                                    {formValues.pdfPath.split("/").pop()}
                                  </div>
                                  <div className={css.pdfSizeText}>อัพโหลดแล้ว</div>
                                </div>
                                <div className={css.pdfActions}>
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={() => window.open(formValues.pdfPath, "_blank")}
                                    className={css.pdfPreviewBtn}
                                  />
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      setFormValues((prev) => ({
                                        ...prev,
                                        pdfPath: "",
                                      }));
                                      form.setFieldValue("pdfPath", "");
                                    }}
                                    className={css.pdfDeleteBtn}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div
                                className={css.uploadBox}
                                onClick={() => pdfInputRef.current?.click()}
                              >
                                <div className={css.uploadIconCirclePdf}>
                                  <FilePdfOutlined />
                                </div>
                                <div>
                                  <div className={css.uploadTitle}>
                                    {uploadingPdf ? "กำลังอัพโหลด..." : "อัพโหลดเอกสาร"}
                                  </div>
                                  <div className={css.uploadDesc}>
                                    ไฟล์ PDF เท่านั้น
                                  </div>
                                </div>
                              </div>
                            )}
                            <input
                              ref={pdfInputRef}
                              type="file"
                              accept="application/pdf,.pdf"
                              style={{ display: "none" }}
                              onChange={handleUploadPdf}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: "preview",
              label: "ดูตัวอย่าง",
              children: previewTabContent,
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
