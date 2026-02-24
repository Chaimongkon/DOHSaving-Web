"use client";

import { useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
  InterestRateIcon,
  LoanIcon,
  DepositIcon,
  WelfareIcon,
  FormIcon,
  QnAIcon,
  ContactIcon,
  AlertIcon
} from "@/components/icons/HomeIcons";
import HeroSlider from "@/components/home/HeroSlider";
import AppDownloadBar from "@/components/home/AppDownloadBar";
import NewsSection from "@/components/home/NewsSection";
import VideoAndRateSection from "@/components/home/VideoAndRateSection";
import PhotoGallerySection from "@/components/home/PhotoGallerySection";
import PromoDialog from "@/components/home/PromoDialog";
import ComplaintPopup from "@/components/home/ComplaintPopup";
import css from "./page.module.css";

const quickLinks = [
  {
    icon: <InterestRateIcon size={56} />,
    title: "อัตราดอกเบี้ย",
    desc: "เงินฝาก-เงินกู้ล่าสุด",
    href: "/interest-rates",
    color: "#E8652B",
    bg: "#fff5f0",
  },
  {
    icon: <LoanIcon size={56} />,
    title: "เงินกู้",
    desc: "ฉุกเฉิน สามัญ พิเศษ",
    href: "/services/general-loan",
    color: "#1a3a5c",
    bg: "#f0f4f8",
  },
  {
    icon: <DepositIcon size={56} />,
    title: "เงินฝาก",
    desc: "ออมทรัพย์ ประจำ พิเศษ",
    href: "/services/savings",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    icon: <WelfareIcon size={56} />,
    title: "สวัสดิการ",
    desc: "สิทธิประโยชน์สมาชิก",
    href: "/services/welfare-a",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    icon: <FormIcon size={56} />,
    title: "ดาวน์โหลดแบบฟอร์ม",
    desc: "แบบฟอร์มทุกประเภท",
    href: "/forms",
    color: "#0369a1",
    bg: "#f0f9ff",
  },
  {
    icon: <QnAIcon size={56} />,
    title: "ถาม-ตอบ Q&A",
    desc: "สอบถามเจ้าหน้าที่",
    href: "/qna",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    icon: <ContactIcon size={56} />,
    title: "ติดต่อเรา",
    desc: "ช่องทางติดต่อสหกรณ์",
    href: "/contact",
    color: "#be185d",
    bg: "#fdf2f8",
  },
];

export default function HomePage() {
  const [complaintOpen, setComplaintOpen] = useState(false);

  return (
    <>
      {/* Promotion Popup */}
      <PromoDialog />

      {/* Hero Slider */}
      <HeroSlider />

      {/* App Download Bar */}
      <AppDownloadBar />

      {/* Quick Links / Services Section */}
      <section className={css.quickLinksSection}>
        <div className={css.quickLinksInner}>
          <h2 className={css.sectionTitle}>บริการของเรา</h2>
          <p className={css.sectionSub}>
            เข้าถึงบริการต่างๆ ของสหกรณ์ออมทรัพย์กรมทางหลวง ได้อย่างสะดวกรวดเร็ว
          </p>
          <div className={css.grid}>
            {quickLinks.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={css.card}
                style={{ "--accent": item.color, "--bg": item.bg } as React.CSSProperties}
              >
                <div className={css.iconWrap}>
                  {item.icon}
                </div>
                <h3 className={css.cardTitle}>{item.title}</h3>
                <p className={css.cardDesc}>{item.desc}</p>
                <span className={css.cta}>
                  <ArrowRightOutlined className={css.ctaArrow} />
                </span>
              </Link>
            ))}

            {/* Complaint popup trigger card */}
            <button
              className={css.card}
              style={{ "--accent": "#dc2626", "--bg": "#fef2f2" } as React.CSSProperties}
              onClick={() => setComplaintOpen(true)}
            >
              <div className={css.iconWrap}>
                <AlertIcon size={56} />
              </div>
              <h3 className={css.cardTitle}>ร้องเรียน / เสนอแนะ</h3>
              <p className={css.cardDesc}>แจ้งเรื่องหรือเสนอแนะ</p>
              <span className={css.cta}>
                <ArrowRightOutlined className={css.ctaArrow} />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* News Section */}
      <NewsSection />

      {/* Video + Interest Rate (side by side like old site) */}
      <VideoAndRateSection />

      {/* Photo Gallery */}
      <PhotoGallerySection />

      {/* Complaint Popup */}
      <ComplaintPopup open={complaintOpen} onClose={() => setComplaintOpen(false)} />
    </>
  );
}
