"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TeamOutlined } from "@ant-design/icons";
import AboutPageShell, { AboutLoading, AboutEmpty, AboutNextLink } from "./AboutPageShell";
import PeopleTiers, { type PeopleTier } from "./PeopleTiers";
import { TeamEmblem } from "./GovernanceEmblems";

interface StaffMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const DEFAULT_TIER_LABELS: Record<number, string> = {
  1: "ผู้จัดการฝ่าย",
  2: "เจ้าหน้าที่อาวุโส",
  3: "เจ้าหน้าที่",
};

interface Props {
  deptKey: string;
  title: string;
  breadcrumbLabel: string;
  tierLabels?: Record<number, string>;
}

/** หน้าบุคลากร — ใช้ร่วมกันทั้งหน้าผู้จัดการใหญ่และทุกฝ่าย */
export default function DepartmentStaffContent({ deptKey, title, breadcrumbLabel, tierLabels }: Props) {
  const labels = tierLabels || DEFAULT_TIER_LABELS;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/department-staff?dept=${deptKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setStaff(
          (data.staff || []).sort(
            (a: StaffMember, b: StaffMember) => (a.tier || 3) - (b.tier || 3) || a.order - b.order
          )
        );
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [deptKey]);

  const tiers: PeopleTier[] = useMemo(() => {
    const byTier = new Map<number, StaffMember[]>();
    staff.forEach((m) => {
      const t = m.tier || 3;
      byTier.set(t, [...(byTier.get(t) || []), m]);
    });
    return [...byTier.keys()]
      .sort((a, b) => a - b)
      .map((t) => ({ key: t, label: labels[t] || `ระดับ ${t}`, members: byTier.get(t)! }));
  }, [staff, labels]);

  const isManagement = deptKey === "managers";

  return (
    <AboutPageShell
      breadcrumbLabel={breadcrumbLabel}
      eyebrow={isManagement ? "MANAGEMENT" : "OUR TEAM"}
      title={title}
      lead={
        isManagement
          ? "ผู้บริหารฝ่ายจัดการที่ดูแลการดำเนินงานประจำวันของสหกรณ์ ตามนโยบายของคณะกรรมการดำเนินการ"
          : `ทำความรู้จักบุคลากร${title} ที่พร้อมให้บริการและดูแลสมาชิกทุกท่าน`
      }
      badge={staff.length > 0 ? <>ทั้งหมด {staff.length} ท่าน</> : undefined}
      heroImage="/images/about/team-hero.png"
      heroImageAlt={`ภาพประกอบ${title} สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด`}
      emblem={<TeamEmblem label={`ตราสัญลักษณ์${title}`} />}
    >
      {loading ? (
        <AboutLoading />
      ) : staff.length > 0 ? (
        <>
          <PeopleTiers tiers={tiers} />
          <AboutNextLink
            href="/about/ethics-staff"
            title="จรรยาบรรณเจ้าหน้าที่"
            text="แนวทางที่เจ้าหน้าที่ทุกคนยึดถือในการให้บริการสมาชิก"
          />
        </>
      ) : (
        <AboutEmpty icon={<TeamOutlined />} text="ยังไม่มีข้อมูล — กรุณาเพิ่มผ่านระบบ Admin" />
      )}
    </AboutPageShell>
  );
}
