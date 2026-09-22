"use client";

import React from "react";
import { AuditOutlined } from "@ant-design/icons";
import GovernancePageLayout from "@/components/about/GovernancePageLayout";
import { EthicsBoardEmblem } from "@/components/about/GovernanceEmblems";

export default function EthicsBoardContent() {
  return (
    <GovernancePageLayout
      apiPath="/api/ethics-board-items"
      breadcrumbLabel="จรรยาบรรณคณะกรรมการ"
      eyebrow="BOARD CODE OF CONDUCT"
      title="จรรยาบรรณคณะกรรมการ"
      lead="แนวทางการประพฤติปฏิบัติที่คณะกรรมการดำเนินการยึดถือในการกำกับดูแลสหกรณ์ เพื่อให้การตัดสินใจทุกเรื่องตั้งอยู่บนประโยชน์ของสมาชิกโดยรวมอย่างเป็นธรรมและตรวจสอบได้"
      countLabel={(n) => `จรรยาบรรณ ${n} ประการ`}
      countIcon={<AuditOutlined />}
      sectionTitle={(n) => `จรรยาบรรณ ${n} ประการ`}
      heroImage="/images/about/ethics-board-hero.png"
      heroImageAlt="ภาพประกอบจรรยาบรรณคณะกรรมการสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<EthicsBoardEmblem />}
      listLayout="grid"
      emptyIcon={<AuditOutlined />}
      emptyText="ยังไม่มีจรรยาบรรณ — กรุณาเพิ่มผ่านระบบ Admin"
      ctaText="หากพบว่าการดำเนินงานของคณะกรรมการไม่เป็นไปตามจรรยาบรรณข้างต้น สมาชิกสามารถแจ้งเรื่องถึงสหกรณ์ได้โดยตรง"
    />
  );
}
