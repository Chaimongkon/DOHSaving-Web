"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Switch,
    Space,
    message,
    Popconfirm,
    Tag,
    Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface LoanType {
    id: number;
    name: string;
    code: string;
    category: string;
    interestRate: number;
    maxAmount: number | null;
    maxTerm: number;
    defaultTerm: number;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
}

export default function AdminLoanTypesPage() {
    const [data, setData] = useState<LoanType[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<LoanType | null>(null);
    const [form] = Form.useForm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/loan-types");
            const json = await res.json();
            setData(json.loanTypes || []);
        } catch {
            message.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (record?: LoanType) => {
        if (record) {
            setEditing(record);
            form.setFieldsValue({
                ...record,
                interestRate: Number(record.interestRate),
                maxAmount: record.maxAmount ? Number(record.maxAmount) : undefined,
            });
        } else {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ isActive: true, sortOrder: 0, maxTerm: 12, defaultTerm: 12, category: "ordinary" });
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const url = editing
                ? `/api/admin/loan-types/${editing.id}`
                : "/api/admin/loan-types";
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error("Save failed");
            message.success(editing ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ");
            setModalOpen(false);
            fetchData();
        } catch {
            message.error("บันทึกไม่สำเร็จ");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fetch(`/api/admin/loan-types/${id}`, { method: "DELETE" });
            message.success("ลบสำเร็จ");
            fetchData();
        } catch {
            message.error("ลบไม่สำเร็จ");
        }
    };

    const columns: ColumnsType<LoanType> = [
        {
            title: "ลำดับ",
            dataIndex: "sortOrder",
            width: 70,
            align: "center",
        },
        {
            title: "ชื่อประเภท",
            dataIndex: "name",
            render: (name: string, r: LoanType) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{r.code}</div>
                </div>
            ),
        },
        {
            title: "หมวด",
            dataIndex: "category",
            width: 100,
            align: "center",
            render: (category: string) => {
                const colors: Record<string, string> = {
                    emergency: "red",
                    ordinary: "green",
                    special: "orange",
                };
                const labels: Record<string, string> = {
                    emergency: "ฉุกเฉิน",
                    ordinary: "สามัญ",
                    special: "กู้สามัญเฉพาะกิจ",
                };
                return <Tag color={colors[category] || "default"}>{labels[category] || category}</Tag>;
            },
        },
        {
            title: "อัตราดอกเบี้ย (%/ปี)",
            dataIndex: "interestRate",
            width: 150,
            align: "center",
            render: (v: number) => <Tag color="blue">{Number(v).toFixed(2)}%</Tag>,
        },
        {
            title: "วงเงินสูงสุด",
            dataIndex: "maxAmount",
            width: 150,
            align: "right",
            render: (v: number | null) =>
                v ? Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "—",
        },
        {
            title: "งวดสูงสุด",
            dataIndex: "maxTerm",
            width: 100,
            align: "center",
        },
        {
            title: "งวด Default",
            dataIndex: "defaultTerm",
            width: 100,
            align: "center",
        },
        {
            title: "สถานะ",
            dataIndex: "isActive",
            width: 80,
            align: "center",
            render: (v: boolean) =>
                v ? <Tag color="green">เปิด</Tag> : <Tag color="red">ปิด</Tag>,
        },
        {
            title: "จัดการ",
            width: 120,
            align: "center",
            render: (_: unknown, record: LoanType) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openModal(record)}
                    />
                    <Popconfirm
                        title="ยืนยันลบ?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                    จัดการประเภทเงินกู้
                </h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openModal()}
                >
                    เพิ่มประเภท
                </Button>
            </div>

            <Table
                dataSource={data}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={false}
                bordered
                size="middle"
            />

            <Modal
                title={editing ? "แก้ไขประเภทเงินกู้" : "เพิ่มประเภทเงินกู้ใหม่"}
                open={modalOpen}
                onOk={handleSave}
                onCancel={() => setModalOpen(false)}
                okText="บันทึก"
                cancelText="ยกเลิก"
                width={520}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name"
                        label="ชื่อประเภท"
                        rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
                    >
                        <Input placeholder="เช่น กู้ฉุกเฉิน" />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="รหัส (code)"
                        rules={[{ required: true, message: "กรุณากรอกรหัส" }]}
                    >
                        <Input placeholder="เช่น emergency" />
                    </Form.Item>
                    <Form.Item
                        name="category"
                        label="หมวด"
                        rules={[{ required: true, message: "กรุณาเลือกหมวด" }]}
                    >
                        <Select placeholder="เลือกหมวด">
                            <Select.Option value="emergency">ฉุกเฉิน</Select.Option>
                            <Select.Option value="ordinary">สามัญ</Select.Option>
                            <Select.Option value="special">กู้สามัญเฉพาะกิจ</Select.Option>
                        </Select>
                    </Form.Item>
                    <Space size="middle" style={{ width: "100%" }}>
                        <Form.Item
                            name="interestRate"
                            label="อัตราดอกเบี้ย (%/ปี)"
                            rules={[{ required: true, message: "กรุณากรอก" }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={0}
                                max={100}
                                step={0.01}
                                precision={2}
                                style={{ width: "100%" }}
                                placeholder="5.50"
                            />
                        </Form.Item>
                        <Form.Item
                            name="maxAmount"
                            label="วงเงินสูงสุด"
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                placeholder="ไม่จำกัดให้เว้น"
                                formatter={(v) =>
                                    v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                                }
                            />
                        </Form.Item>
                    </Space>
                    <Space size="middle" style={{ width: "100%" }}>
                        <Form.Item
                            name="maxTerm"
                            label="จำนวนงวดสูงสุด"
                            style={{ flex: 1 }}
                        >
                            <InputNumber min={1} max={360} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            name="defaultTerm"
                            label="จำนวนงวด Default"
                            style={{ flex: 1 }}
                        >
                            <InputNumber min={1} max={360} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            name="sortOrder"
                            label="ลำดับ"
                            style={{ flex: 1 }}
                        >
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Space>
                    <Form.Item name="description" label="คำอธิบาย">
                        <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
                    </Form.Item>
                    <Form.Item name="isActive" label="เปิดใช้งาน" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
