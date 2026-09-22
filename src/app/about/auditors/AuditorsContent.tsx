"use client";

import React, { useState, useEffect } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Calculator, ClipboardCheck } from "lucide-react";
import AboutPageShell, { AboutSectionHead, AboutLoading, AboutEmpty } from "@/components/about/AboutPageShell";
import PeopleTiers from "@/components/about/PeopleTiers";
import { AuditEmblem } from "@/components/about/GovernanceEmblems";
import css from "./AuditorsContent.module.css";

interface Auditor {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  order: number;
}

/* อธิบายบทบาทแบบภาษาง่าย — สมาชิกหลายคนไม่รู้ว่าสองตำแหน่งนี้ต่างกันอย่างไร */
const ROLES = [
  {
    icon: Calculator,
    title: "ผู้สอบบัญชี",
    text: "ตรวจสอบงบการเงินของสหกรณ์ และแสดงความเห็นว่างบการเงินถูกต้องตามที่ควร ก่อนเสนอต่อที่ประชุมใหญ่",
  },
  {
    icon: ClipboardCheck,
    title: "ผู้ตรวจสอบกิจการ",
    text: "ได้รับเลือกจากที่ประชุมใหญ่ ตรวจสอบการดำเนินงานและการบริหารของสหกรณ์ แล้วรายงานผลให้คณะกรรมการและที่ประชุมใหญ่ทราบ",
  },
];

export default function AuditorsContent() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auditors")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAuditors((data.auditors || []).sort((a: Auditor, b: Auditor) => a.order - b.order));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AboutPageShell
      breadcrumbLabel="ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ"
      eyebrow="AUDIT & INSPECTION"
      title="ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ"
      lead="ผู้ทำหน้าที่ตรวจสอบอย่างเป็นอิสระ เพื่อให้สมาชิกมั่นใจได้ว่าการเงินและการดำเนินงานของสหกรณ์โปร่งใสและถูกต้อง"
      heroImage="/images/about/auditors-hero.png"
      heroImageAlt="ภาพประกอบผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<AuditEmblem />}
    >
      {loading ? (
        <AboutLoading />
      ) : auditors.length > 0 ? (
        <>
          <PeopleTiers tiers={[{ key: "auditors", label: "ผู้ตรวจสอบประจำปี", members: auditors }]} />

          <section className={css.section} aria-labelledby="roles-heading">
            <AboutSectionHead title="แต่ละตำแหน่งทำอะไร" id="roles-heading" />
            <div className={css.roles}>
              {ROLES.map(({ icon: Icon, title, text }) => (
                <article key={title} className={css.role}>
                  <span className={css.roleIcon} aria-hidden="true">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <h3 className={css.roleTitle}>{title}</h3>
                  <p className={css.roleText}>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <AboutEmpty icon={<SearchOutlined />} text="ยังไม่มีข้อมูล — กรุณาเพิ่มผ่านระบบ Admin" />
      )}
    </AboutPageShell>
  );
}
