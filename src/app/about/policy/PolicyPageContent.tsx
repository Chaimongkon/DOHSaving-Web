"use client";

import React from "react";
import { SafetyCertificateOutlined, UnorderedListOutlined } from "@ant-design/icons";
import GovernancePageLayout from "@/components/about/GovernancePageLayout";
import { PolicyEmblem } from "@/components/about/GovernanceEmblems";

export default function PolicyPageContent() {
  return (
    <GovernancePageLayout
      apiPath="/api/policy-items"
      breadcrumbLabel="นโยบายสหกรณ์"
      eyebrow="POLICY"
      title="นโยบายสหกรณ์"
      lead="แนวทางการดำเนินงานที่คณะกรรมการดำเนินการกำหนดไว้ เพื่อให้การบริหารงานของสหกรณ์เป็นไปอย่างโปร่งใส มั่นคง และเกิดประโยชน์สูงสุดแก่สมาชิก"
      countLabel={(n) => `ทั้งหมด ${n} ข้อ`}
      countIcon={<SafetyCertificateOutlined />}
      sectionTitle={() => "แนวนโยบายการดำเนินงาน"}
      heroImage="/images/about/policy-hero.png"
      heroImageAlt="ภาพประกอบนโยบายสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<PolicyEmblem />}
      /* ข้อความแต่ละข้อยาว จึงใช้คอลัมน์เดียวให้อ่านต่อเนื่อง */
      listLayout="single"
      emptyIcon={<UnorderedListOutlined />}
      emptyText="ยังไม่มีนโยบาย — กรุณาเพิ่มผ่านระบบ Admin"
      ctaText="หากพบว่าการดำเนินงานของสหกรณ์ไม่เป็นไปตามนโยบายข้างต้น สมาชิกสามารถแจ้งเรื่องถึงสหกรณ์ได้โดยตรง"
    />
  );
}
