"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Checkbox,
  Tag,
  Space,
  message,
  Popconfirm,
  Card,
  Typography,
  Divider,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// ── เมนูทั้งหมดที่ใช้กำหนดสิทธิ์ ──
const ALL_MENU_GROUPS = [
  {
    group: "จัดการเนื้อหา",
    items: [
      { label: "ข่าวประชาสัมพันธ์", href: "/admin/news" },
      { label: "วิดีโอ", href: "/admin/videos" },
      { label: "อัลบั้มภาพ", href: "/admin/photo-albums" },
      { label: "สื่อสำหรับสมาชิก", href: "/admin/member-media" },
    ],
  },
  {
    group: "จัดการหน้าเว็บ",
    items: [
      { label: "สไลด์หน้าแรก", href: "/admin/slides" },
      { label: "ป๊อปอัพแจ้งเตือน", href: "/admin/notifications" },
      { label: "หน้าบริการ", href: "/admin/service-pages" },
      { label: "วิธีใช้งาน App", href: "/admin/app-guide" },
      { label: "ดาวน์โหลดแอป", href: "/admin/download-app" },
    ],
  },
  {
    group: "หน้าเพจ",
    items: [
      { label: "ประวัติสหกรณ์", href: "/admin/pages/history" },
      { label: "สารจากประธานฯ", href: "/admin/chairman-message" },
      { label: "วิสัยทัศน์และพันธกิจ", href: "/admin/vision-data" },
      { label: "นโยบายสหกรณ์", href: "/admin/policy-items" },
      { label: "จรรยาบรรณคณะกรรมการ", href: "/admin/ethics-board-items" },
      { label: "จรรยาบรรณเจ้าหน้าที่", href: "/admin/ethics-staff-items" },
      { label: "คณะกรรมการ", href: "/admin/board-members" },
      { label: "ผู้ตรวจสอบ", href: "/admin/auditors" },
      { label: "บุคลากร/ฝ่ายต่างๆ", href: "/admin/department-staff" },
      { label: "โครงสร้างองค์กร", href: "/admin/pages/organization/images" },
    ],
  },
  {
    group: "การเงิน",
    items: [
      { label: "อัตราดอกเบี้ย", href: "/admin/interest-rates" },
      { label: "สินทรัพย์และหนี้สิน", href: "/admin/financial-summary" },
    ],
  },
  {
    group: "เอกสาร",
    items: [
      { label: "ข้อบังคับ ระเบียบ ประกาศ", href: "/admin/regulations" },
      { label: "แบบฟอร์มต่างๆ", href: "/admin/forms" },
      { label: "รายงานประจำปี", href: "/admin/annual-reports" },
      { label: "เอกสารประกอบการประชุม", href: "/admin/meeting-documents" },
    ],
  },
  {
    group: "สื่อสาร",
    items: [
      { label: "กระดานถาม-ตอบ", href: "/admin/qna" },
      { label: "ร้องเรียน/เสนอแนะ", href: "/admin/complaints" },
    ],
  },
  {
    group: "ข้อมูลติดต่อ",
    items: [
      { label: "ข้อมูลสหกรณ์", href: "/admin/contact-info" },
      { label: "ฝ่ายงาน/เบอร์โทร", href: "/admin/departments" },
      { label: "LINE ฝ่ายต่างๆ", href: "/admin/line-contacts" },
      { label: "บัญชีธนาคาร", href: "/admin/bank-accounts" },
    ],
  },
  {
    group: "ระบบ",
    items: [
      { label: "รูปเมนูหลัก", href: "/admin/mega-images" },
      { label: "Festival Theme", href: "/admin/festivals" },
      { label: "ผู้ใช้งาน", href: "/admin/users" },
      { label: "Cookie Consent", href: "/admin/cookie-consent" },
      { label: "ตั้งค่า", href: "/admin/settings" },
    ],
  },
];

// ── Preset templates ──
const ROLE_PRESETS: Record<string, string[]> = {
  "ฝ่ายสวัสดิการ": [
    // จัดการเนื้อหาทั้งหมด
    "/admin/news", "/admin/videos", "/admin/photo-albums", "/admin/member-media",
    // จัดการหน้าเว็บทั้งหมด
    "/admin/slides", "/admin/notifications", "/admin/service-pages", "/admin/app-guide", "/admin/download-app",
    // เอกสาร: แค่แบบฟอร์ม
    "/admin/forms",
    // สื่อสาร: แค่กระดานถามตอบ
    "/admin/qna",
  ],
  "ฝ่ายบริหาร": [
    // จัดการเนื้อหาทั้งหมด
    "/admin/news", "/admin/videos", "/admin/photo-albums", "/admin/member-media",
    // จัดการหน้าเว็บทั้งหมด
    "/admin/slides", "/admin/notifications", "/admin/service-pages", "/admin/app-guide", "/admin/download-app",
    // เอกสารทั้งหมด
    "/admin/regulations", "/admin/forms", "/admin/annual-reports", "/admin/meeting-documents",
    // หน้าเพจทั้งหมด
    "/admin/pages/history", "/admin/chairman-message", "/admin/vision-data",
    "/admin/policy-items", "/admin/ethics-board-items", "/admin/ethics-staff-items",
    "/admin/board-members", "/admin/auditors", "/admin/department-staff", "/admin/pages/organization/images",
    // สื่อสารทั้งหมด
    "/admin/qna", "/admin/complaints",
    // ข้อมูลติดต่อทั้งหมด
    "/admin/contact-info", "/admin/departments", "/admin/line-contacts", "/admin/bank-accounts",
  ],
  "ฝ่ายบัญชี": [
    // การเงิน: แค่สินทรัพย์และหนี้สิน
    "/admin/financial-summary",
  ],
};

interface UserRecord {
  id: number;
  fullName: string | null;
  userName: string;
  userRole: string | null;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  menuPermissions: string[] | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form] = Form.useForm();
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data);
    } catch {
      message.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Open modal ──
  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ userRole: "editor", isActive: true });
    setSelectedPerms(new Set());
    setModalOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      userName: user.userName,
      userRole: user.userRole,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      password: "",
    });
    setSelectedPerms(new Set(user.menuPermissions || []));
    setModalOpen(true);
  };

  // ── Save ──
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        ...values,
        menuPermissions: Array.from(selectedPerms),
      };

      // ไม่ส่ง password ว่างไป
      if (!payload.password) delete payload.password;

      let res: Response;
      if (editingUser) {
        // แก้ไข — ไม่ส่ง userName
        delete payload.userName;
        res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        message.error(err.error || "เกิดข้อผิดพลาด");
        return;
      }

      message.success(editingUser ? "แก้ไขสำเร็จ" : "สร้างผู้ใช้สำเร็จ");
      setModalOpen(false);
      fetchUsers();
    } catch {
      // validation error
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        message.error(err.error || "ลบไม่สำเร็จ");
        return;
      }
      message.success("ลบสำเร็จ");
      fetchUsers();
    } catch {
      message.error("เกิดข้อผิดพลาด");
    }
  };

  // ── Permission helpers ──
  const togglePerm = (href: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const toggleGroupAll = (groupItems: { href: string }[]) => {
    const allHrefs = groupItems.map((i) => i.href);
    const allChecked = allHrefs.every((h) => selectedPerms.has(h));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        allHrefs.forEach((h) => next.delete(h));
      } else {
        allHrefs.forEach((h) => next.add(h));
      }
      return next;
    });
  };

  const applyPreset = (presetName: string) => {
    const perms = ROLE_PRESETS[presetName];
    if (perms) {
      setSelectedPerms(new Set(perms));
      message.info(`โหลดสิทธิ์ "${presetName}" แล้ว`);
    }
  };

  const selectAll = () => {
    const all = ALL_MENU_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    setSelectedPerms(new Set(all));
  };

  const clearAll = () => {
    setSelectedPerms(new Set());
  };

  // ── Watch userRole to auto-apply preset ──
  const watchedRole = Form.useWatch("userRole", form);
  const isAdmin = watchedRole === "admin";

  // ── Table columns ──
  const columns = [
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "fullName",
      key: "fullName",
      render: (v: string | null, r: UserRecord) => v || r.userName,
    },
    {
      title: "ชื่อผู้ใช้",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "บทบาท",
      dataIndex: "userRole",
      key: "userRole",
      render: (v: string | null) => {
        const color = v === "admin" ? "red" : v === "editor" ? "blue" : "default";
        return <Tag color={color}>{v || "viewer"}</Tag>;
      },
    },
    {
      title: "ฝ่าย/แผนก",
      dataIndex: "department",
      key: "department",
      render: (v: string | null) => v || "-",
    },
    {
      title: "สิทธิ์เมนู",
      key: "perms",
      render: (_: unknown, r: UserRecord) => {
        if (r.userRole === "admin") return <Tag color="red">เข้าถึงทั้งหมด</Tag>;
        const count = (r.menuPermissions || []).length;
        return <Text type="secondary">{count} เมนู</Text>;
      },
    },
    {
      title: "สถานะ",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) =>
        v ? <Tag color="green">เปิดใช้งาน</Tag> : <Tag>ปิดใช้งาน</Tag>,
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 120,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="ยืนยันลบผู้ใช้นี้?"
            onConfirm={() => handleDelete(record.id)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>จัดการผู้ใช้งาน</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          เพิ่มผู้ใช้
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      {/* ── Modal สร้าง/แก้ไข ── */}
      <Modal
        title={editingUser ? `แก้ไขผู้ใช้: ${editingUser.userName}` : "เพิ่มผู้ใช้ใหม่"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={720}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <Form form={form} layout="vertical" size="middle">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ชื่อ-นามสกุล"
                name="fullName"
                rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ชื่อผู้ใช้ (Login)"
                name="userName"
                rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }]}
              >
                <Input disabled={!!editingUser} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={editingUser ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}
                name="password"
                rules={editingUser ? [] : [{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
              >
                <Input.Password prefix={<KeyOutlined />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="บทบาท" name="userRole">
                <Select>
                  <Select.Option value="admin">Admin (เข้าถึงทั้งหมด)</Select.Option>
                  <Select.Option value="editor">Editor</Select.Option>
                  <Select.Option value="viewer">Viewer</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ฝ่าย/แผนก" name="department">
                <Input placeholder="เช่น ฝ่ายสวัสดิการ" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="เบอร์โทร" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="สถานะ" name="isActive" valuePropName="checked">
                <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── สิทธิ์เมนู ── */}
          <Divider style={{ fontSize: 14 }}>
            สิทธิ์การเข้าถึงเมนู
          </Divider>

          {isAdmin ? (
            <Card size="small" style={{ background: "#fff7e6", borderColor: "#ffd591" }}>
              <Text type="warning">
                บทบาท Admin เข้าถึงทุกเมนูอัตโนมัติ ไม่ต้องกำหนดสิทธิ์
              </Text>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="small" onClick={selectAll}>เลือกทั้งหมด</Button>
                <Button size="small" onClick={clearAll}>ล้างทั้งหมด</Button>
                <Divider type="vertical" />
                <Text type="secondary" style={{ lineHeight: "32px", fontSize: 12 }}>
                  โหลดสิทธิ์สำเร็จรูป:
                </Text>
                {Object.keys(ROLE_PRESETS).map((name) => (
                  <Button key={name} size="small" type="dashed" onClick={() => applyPreset(name)}>
                    {name}
                  </Button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {ALL_MENU_GROUPS.map((group) => {
                  const allHrefs = group.items.map((i) => i.href);
                  const checkedCount = allHrefs.filter((h) => selectedPerms.has(h)).length;
                  const allChecked = checkedCount === allHrefs.length;
                  const indeterminate = checkedCount > 0 && !allChecked;

                  return (
                    <Card
                      key={group.group}
                      size="small"
                      title={
                        <Checkbox
                          checked={allChecked}
                          indeterminate={indeterminate}
                          onChange={() => toggleGroupAll(group.items)}
                          style={{ fontWeight: 600 }}
                        >
                          {group.group}
                        </Checkbox>
                      }
                      styles={{ body: { padding: "8px 12px" } }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {group.items.map((item) => (
                          <Checkbox
                            key={item.href}
                            checked={selectedPerms.has(item.href)}
                            onChange={() => togglePerm(item.href)}
                            style={{ fontSize: 13 }}
                          >
                            {item.label}
                          </Checkbox>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
