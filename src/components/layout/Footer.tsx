"use client";

import React from "react";
import { Row, Col, Typography, Space, Divider } from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  PrinterOutlined,
  MailOutlined,
  FacebookFilled,
  MessageFilled,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";

const { Title, Text, Paragraph } = Typography;

const quickLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "ข่าวประชาสัมพันธ์", href: "/news" },
  { label: "อัตราดอกเบี้ย", href: "/interest-rates" },
  { label: "แบบฟอร์มดาวน์โหลด", href: "/downloads/forms" },
  { label: "ข้อบังคับ/ระเบียบ", href: "/downloads/regulations" },
  { label: "ถาม-ตอบ", href: "/qna" },
];

const serviceLinks = [
  { label: "บริการเงินฝาก", href: "/services/deposit" },
  { label: "บริการเงินกู้", href: "/services/loan" },
  { label: "สวัสดิการสมาชิก", href: "/services/welfare" },
  { label: "สมัครสมาชิก", href: "/services/application" },
  { label: "ร้องเรียน", href: "/complaints" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Row gutter={[48, 32]}>
          {/* Column 1 — About */}
          <Col xs={24} sm={24} md={8}>
            <div className="footer-brand">
              <Image
                src="/logo.svg"
                alt="สหกรณ์ออมทรัพย์กรมทางหลวง"
                width={56}
                height={56}
              />
              <Title level={5} style={{ color: "#fff", margin: 0 }}>
                สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
              </Title>
            </div>
            <Paragraph style={{ color: "rgba(255,255,255,0.7)", marginTop: 16 }}>
              บริการเงินฝาก สินเชื่อ และสวัสดิการสมาชิก
              ด้วยระบบที่ทันสมัยและโปร่งใส
            </Paragraph>

            <Space orientation="vertical" size={4} style={{ marginTop: 8 }}>
              <Space size={8}>
                <EnvironmentOutlined style={{ color: "#E8652B" }} />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  ถนนศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กทม. 10400
                </Text>
              </Space>
              <Space size={8}>
                <PhoneOutlined style={{ color: "#E8652B" }} />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  02-354-6827
                </Text>
              </Space>
              <Space size={8}>
                <PrinterOutlined style={{ color: "#E8652B" }} />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  02-354-6833
                </Text>
              </Space>
              <Space size={8}>
                <MailOutlined style={{ color: "#E8652B" }} />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  dohsaving@gmail.com
                </Text>
              </Space>
            </Space>
          </Col>

          {/* Column 2 — Quick Links */}
          <Col xs={24} sm={12} md={8}>
            <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
              ลิงก์ด่วน
            </Title>
            <Space orientation="vertical" size={8}>
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </Space>
          </Col>

          {/* Column 3 — Services + Social */}
          <Col xs={24} sm={12} md={8}>
            <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
              บริการ
            </Title>
            <Space orientation="vertical" size={8}>
              {serviceLinks.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </Space>

            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ color: "#fff", marginBottom: 12 }}>
                ติดตามเรา
              </Title>
              <Space size="middle">
                <a
                  href="https://www.facebook.com/DOHSaving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social"
                >
                  <FacebookFilled style={{ fontSize: 28 }} />
                </a>
                <a
                  href="https://line.me/R/ti/p/@dohsaving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social"
                >
                  <MessageFilled style={{ fontSize: 28 }} />
                </a>
              </Space>
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: "rgba(255,255,255,0.15)", margin: "32px 0 16px" }} />

        <div className="footer-bottom">
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            © {new Date().getFullYear()} สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — สงวนลิขสิทธิ์
          </Text>
        </div>
      </div>
    </footer>
  );
}
