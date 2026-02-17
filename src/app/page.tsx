"use client";

import { Card, Row, Col } from "antd";
import {
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import HeroSlider from "@/components/home/HeroSlider";
import AppDownloadBar from "@/components/home/AppDownloadBar";
import NewsSection from "@/components/home/NewsSection";
import VideoAndRateSection from "@/components/home/VideoAndRateSection";
import PhotoGallerySection from "@/components/home/PhotoGallerySection";
import css from "./page.module.css";

const quickLinks = [
  {
    icon: <BankOutlined />,
    title: "อัตราดอกเบี้ย",
    desc: "ดอกเบี้ยเงินฝากและเงินกู้ล่าสุด",
    href: "/interest-rates",
    color: "#E8652B",
  },
  {
    icon: <DollarOutlined />,
    title: "เงินกู้",
    desc: "เงินกู้ฉุกเฉิน สามัญ พิเศษ",
    href: "/services/general-loan",
    color: "#1a3a5c",
  },
  {
    icon: <SafetyOutlined />,
    title: "เงินฝาก",
    desc: "ออมทรัพย์ ประจำ พิเศษ",
    href: "/services/savings",
    color: "#2d6a4f",
  },
  {
    icon: <TeamOutlined />,
    title: "สวัสดิการ",
    desc: "สิทธิประโยชน์สมาชิกทุกประเภท",
    href: "/services/welfare-a",
    color: "#7c3aed",
  },
  {
    icon: <FileTextOutlined />,
    title: "ดาวน์โหลดแบบฟอร์ม",
    desc: "แบบฟอร์มบริการทุกประเภท",
    href: "/downloads/member-forms",
    color: "#0369a1",
  },
  {
    icon: <CustomerServiceOutlined />,
    title: "ติดต่อเรา",
    desc: "ช่องทางติดต่อสหกรณ์",
    href: "/contact",
    color: "#be185d",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {/* App Download Bar */}
      <AppDownloadBar />

      {/* News Section */}
      <NewsSection />

      {/* Video + Interest Rate (side by side like old site) */}
      <VideoAndRateSection />

      {/* Photo Gallery */}
      <PhotoGallerySection />

      {/* Quick Links Section */}
      <section className={css.quickLinksSection}>
        <div className={css.quickLinksInner}>
          <h2 className="section-heading">บริการของเรา</h2>
          <p className="section-subheading">
            เข้าถึงบริการต่างๆ ของสหกรณ์ออมทรัพย์กรมทางหลวง ได้อย่างสะดวกรวดเร็ว
          </p>
          <Row gutter={[24, 24]}>
            {quickLinks.map((item, i) => (
              <Col key={i} xs={24} sm={12} md={8}>
                <Link href={item.href} style={{ display: "block" }}>
                  <Card hoverable className={css.card}>
                    <div className={css.cardInner}>
                      <div
                        className={css.iconWrap}
                        style={{ background: item.color }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <h3 className={css.cardTitle}>{item.title}</h3>
                        <p className={css.cardDesc}>{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      </section>
    </>
  );
}
