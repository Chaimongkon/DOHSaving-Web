"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TeamOutlined } from "@ant-design/icons";
import AboutPageShell, { AboutLoading, AboutEmpty, AboutNextLink } from "@/components/about/AboutPageShell";
import PeopleTiers, { type PeopleTier } from "@/components/about/PeopleTiers";
import { TeamEmblem } from "@/components/about/GovernanceEmblems";

interface BoardMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

const TIER_LABELS: Record<number, string> = {
  1: "ประธานกรรมการดำเนินการ",
  2: "รองประธานกรรมการ",
  3: "เลขานุการ / เหรัญญิก",
  4: "กรรมการ",
};

export default function BoardContent() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/board-members")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setMembers(data.members || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const tiers: PeopleTier[] = useMemo(
    () =>
      [1, 2, 3, 4]
        .map((tier) => ({
          key: tier,
          label: TIER_LABELS[tier],
          members: members.filter((m) => m.tier === tier).sort((a, b) => a.order - b.order),
        }))
        .filter((t) => t.members.length > 0),
    [members]
  );

  return (
    <AboutPageShell
      breadcrumbLabel="คณะกรรมการดำเนินการ"
      eyebrow="BOARD OF DIRECTORS"
      title="คณะกรรมการดำเนินการ"
      lead="ได้รับเลือกตั้งจากที่ประชุมใหญ่ของสมาชิก ทำหน้าที่กำหนดนโยบายและกำกับดูแลการบริหารงานของสหกรณ์ เพื่อประโยชน์ของสมาชิกทุกคน"
      badge={members.length > 0 ? <>ทั้งหมด {members.length} ท่าน</> : undefined}
      heroImage="/images/about/board-hero.png"
      heroImageAlt="ภาพประกอบคณะกรรมการดำเนินการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<TeamEmblem label="ตราสัญลักษณ์คณะกรรมการดำเนินการ" />}
    >
      {loading ? (
        <AboutLoading />
      ) : tiers.length > 0 ? (
        <>
          <PeopleTiers tiers={tiers} />
          <AboutNextLink
            href="/about/ethics-board"
            title="จรรยาบรรณคณะกรรมการ"
            text="หลักที่คณะกรรมการยึดถือในการตัดสินใจและกำกับดูแลสหกรณ์"
          />
        </>
      ) : (
        <AboutEmpty icon={<TeamOutlined />} text="ยังไม่มีข้อมูลกรรมการ — กรุณาเพิ่มผ่านระบบ Admin" />
      )}
    </AboutPageShell>
  );
}
