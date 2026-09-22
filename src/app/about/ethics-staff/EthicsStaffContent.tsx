"use client";

import React from "react";
import { SolutionOutlined } from "@ant-design/icons";
import GovernancePageLayout from "@/components/about/GovernancePageLayout";
import { EthicsStaffEmblem } from "@/components/about/GovernanceEmblems";

export default function EthicsStaffContent() {
  return (
    <GovernancePageLayout
      apiPath="/api/ethics-staff-items"
      breadcrumbLabel="จรรยาบรรณเจ้าหน้าที่"
      eyebrow="STAFF CODE OF CONDUCT"
      title="จรรยาบรรณเจ้าหน้าที่"
      lead="แนวทางการประพฤติปฏิบัติที่เจ้าหน้าที่สหกรณ์ยึดถือในการทำงาน เพื่อให้สมาชิกได้รับบริการที่ซื่อสัตย์ เป็นธรรม เท่าเทียม และเชื่อถือได้ในทุกครั้งที่มาใช้บริการ"
      countLabel={(n) => `จรรยาบรรณ ${n} ประการ`}
      countIcon={<SolutionOutlined />}
      sectionTitle={(n) => `จรรยาบรรณ ${n} ประการ`}
      heroImage="/images/about/ethics-staff-hero.png"
      heroImageAlt="ภาพประกอบจรรยาบรรณเจ้าหน้าที่สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<EthicsStaffEmblem />}
      /* ข้อความสั้น 2-3 บรรทัด จึงจัด 2 คอลัมน์ให้กวาดสายตาได้เร็ว */
      listLayout="grid"
      emptyIcon={<SolutionOutlined />}
      emptyText="ยังไม่มีจรรยาบรรณ — กรุณาเพิ่มผ่านระบบ Admin"
      ctaText="หากไม่ได้รับบริการตามจรรยาบรรณข้างต้น สมาชิกสามารถแจ้งเรื่องถึงสหกรณ์ได้โดยตรง ทุกเรื่องจะถูกรับไว้พิจารณา"
    />
  );
}
