"use client";

import React from "react";
import {
  PictureOutlined,
  FileTextOutlined,
  NotificationOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const stats = [
  { label: "สไลด์", value: "—", icon: <PictureOutlined />, href: "/admin/slides", color: "#E8652B" },
  { label: "ข่าว", value: "—", icon: <FileTextOutlined />, href: "/admin/news", color: "#1a3a5c" },
  { label: "แจ้งเตือน", value: "—", icon: <NotificationOutlined />, href: "/admin/notifications", color: "#7c3aed" },
  { label: "เข้าชมวันนี้", value: "—", icon: <EyeOutlined />, href: "#", color: "#2d6a4f" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f1d36", marginBottom: 24 }}>
        แดชบอร์ด
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "20px 20px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
              border: "1px solid #f0f0f0",
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${s.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f1d36" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        border: "1px solid #f0f0f0",
        color: "#9ca3af",
        textAlign: "center",
      }}>
        <p style={{ margin: 0 }}>
          ระบบจัดการเว็บไซต์ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>
          เลือกเมนูด้านซ้ายเพื่อจัดการเนื้อหา
        </p>
      </div>
    </div>
  );
}
