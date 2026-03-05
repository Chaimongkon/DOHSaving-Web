"use client";

import { Button, Card, Col, Form, Input, Popconfirm, Row, Space, Spin, Table, Typography, message } from "antd";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import css from "./page.module.css";

const { Title } = Typography;

interface UrlMapping {
    id: number;
    url: string;
    thaiName: string;
    remark: string;
    updatedAt: string;
}

export default function UrlMappingsPage() {
    const [data, setData] = useState<UrlMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMapping, setEditingMapping] = useState<UrlMapping | null>(null);
    const [form] = Form.useForm();

    const fetchMappings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/url-mappings");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                message.error("ไม่สามารถดึงข้อมูลได้");
            }
        } catch (error) {
            console.error(error);
            message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const handleSave = async (values: any) => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/url-mappings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                message.success("บันทึกข้อมูลเรียบร้อยแล้ว");
                form.resetFields();
                setEditingMapping(null);
                fetchMappings();
            } else {
                const json = await res.json();
                message.error(json.error || "เกิดข้อผิดพลาดในการบันทึก");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            setLoading(false);
        }
    };

    const handleEdit = (record: UrlMapping) => {
        setEditingMapping(record);
        form.setFieldsValue({
            url: record.url,
            thaiName: record.thaiName,
        });
    };

    const handleDelete = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/url-mappings?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                message.success("ลบข้อมูลเรียบร้อยแล้ว");
                fetchMappings();
            } else {
                const json = await res.json();
                message.error(json.error || "เกิดข้อผิดพลาดในการลบ");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "URL Path",
            dataIndex: "url",
            key: "url",
            render: (text: string) => <strong className={css.urlText}>{text}</strong>,
        },
        {
            title: "ชื่อภาษาไทย (ที่ใช้แสดง)",
            dataIndex: "thaiName",
            key: "thaiName",
        },
        {
            title: "แก้ไขล่าสุด",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (text: string) => new Date(text).toLocaleString("th-TH"),
        },
        {
            title: "จัดการ",
            key: "action",
            render: (_: any, record: UrlMapping) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<Edit size={18} />}
                        onClick={() => handleEdit(record)}
                        className={css.editButton}
                    >
                        แก้ไข
                    </Button>
                    <Popconfirm
                        title="ยืนยันการลบ?"
                        description={`คุณต้องการลบการตั้งค่าแปลชื่อของ ${record.url} หรือไม่?`}
                        onConfirm={() => handleDelete(record.id)}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 size={18} />}
                            className={css.deleteButton}
                        >
                            ลบ
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={css.container}>
            <Title level={2} className={css.pageTitle}>ตั้งค่าการแสดงชื่อหน้า (URL Mappings)</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card
                        title={editingMapping ? "แก้ไขการตั้งค่า" : "เพิ่ม URL ใหม่"}
                        variant="borderless"
                        className={css.formCard}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSave}
                        >
                            <Form.Item
                                name="url"
                                label="URL Path (เช่น /services)"
                                rules={[{ required: true, message: "กรุณาระบุ URL" }]}
                            >
                                <Input placeholder="/url-path" disabled={!!editingMapping} />
                            </Form.Item>

                            <Form.Item
                                name="thaiName"
                                label="ชื่อที่ต้องการแสดง (ภาษาไทย)"
                                rules={[{ required: true, message: "กรุณาระบุชื่อที่ต้องการแสดง" }]}
                            >
                                <Input placeholder="ชื่อหน้ายอดนิยม" />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button type="primary" htmlType="submit" icon={editingMapping ? <Edit size={16} /> : <Plus size={16} />} loading={loading}>
                                        {editingMapping ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                                    </Button>
                                    {editingMapping && (
                                        <Button onClick={() => { setEditingMapping(null); form.resetFields(); }}>
                                            ยกเลิก
                                        </Button>
                                    )}
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card variant="borderless" className={css.tableCard} styles={{ body: { padding: 0 } }}>
                        <Table
                            columns={columns}
                            dataSource={data}
                            rowKey="id"
                            loading={{ indicator: <Spin size="large" />, spinning: loading }}
                            pagination={{ pageSize: 15 }}
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
