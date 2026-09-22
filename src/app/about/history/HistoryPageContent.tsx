"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileTextOutlined } from "@ant-design/icons";
import {
  Users,
  Stamp,
  BadgeCheck,
  CalendarCheck,
  Building2,
  PiggyBank,
  HandCoins,
  RefreshCcw,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import AboutPageShell, { AboutSectionHead, AboutLoading, AboutEmpty } from "@/components/about/AboutPageShell";
import RoadTimeline, { type RoadStop } from "@/components/about/RoadTimeline";
import { HistoryEmblem } from "@/components/about/GovernanceEmblems";
import css from "./HistoryPageContent.module.css";

/*
 * ข้อเท็จจริงช่วงก่อตั้ง (ตัวเลข วันที่ ลำดับเหตุการณ์) สรุปจากประวัติฉบับเต็ม
 * ที่แอดมินบันทึกไว้ในระบบ (/api/pages/history) — เป็นเหตุการณ์ในอดีตที่ไม่เปลี่ยน
 * จึงจัดเป็นข้อมูลคงที่เพื่อออกแบบเป็นภาพได้ ส่วนเนื้อหาเต็มยังดึงจากระบบเหมือนเดิม
 * ถ้าแก้ประวัติฉบับเต็มในส่วนนี้ ต้องแก้ตรงนี้ให้ตรงกันด้วย
 */
const REGISTERED = { year: 1977, month: 4, day: 30 }; // 30 พ.ค. 2520 (month นับจาก 0)

const MILESTONES: Array<{ date: string; title: string; detail: string; icon: RoadStop["icon"] }> = [
  {
    date: "28 เมษายน 2520",
    title: "ประชุมใหญ่ผู้เข้าชื่อจดทะเบียน",
    detail: "ข้าราชการและลูกจ้างประจำกรมทางหลวง 256 คน มีมติให้ยื่นขอจดทะเบียนสหกรณ์ต่อนายทะเบียนสหกรณ์",
    icon: Users,
  },
  {
    date: "30 พฤษภาคม 2520",
    title: "ได้รับจดทะเบียนเป็นสหกรณ์",
    detail: "นายทะเบียนสหกรณ์รับจดทะเบียน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด เลขทะเบียนที่ กพธ.26/2520",
    icon: Stamp,
  },
  {
    date: "3 และ 19 สิงหาคม 2520",
    title: "กำหนดตราสหกรณ์และเจ้าหน้าที่ชุดแรก",
    detail:
      "ใช้ตราเครื่องหมายกรมทางหลวงพร้อมอักษร “สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด สอ.ทล.” และแต่งตั้งเจ้าหน้าที่จากกรมทางหลวง 5 คนมาช่วยปฏิบัติงาน",
    icon: BadgeCheck,
  },
  {
    date: "29 สิงหาคม 2520",
    title: "ประชุมใหญ่สามัญครั้งแรก",
    detail: "สมาชิกประชุมใหญ่สามัญร่วมกันเป็นครั้งแรก ก่อนเริ่มดำเนินกิจการ",
    icon: CalendarCheck,
  },
  {
    date: "1 ตุลาคม 2520",
    title: "เริ่มดำเนินกิจการ",
    detail: "สหกรณ์เริ่มประกอบธุรกิจอย่างเป็นทางการเป็นวันแรก",
    icon: Building2,
  },
];

/** จำนวนปีเต็มนับจากวันจดทะเบียน */
function yearsSinceRegistered(now: Date): number {
  const registered = new Date(REGISTERED.year, REGISTERED.month, REGISTERED.day);
  let years = now.getFullYear() - registered.getFullYear();
  const anniversary = new Date(now.getFullYear(), REGISTERED.month, REGISTERED.day);
  if (now < anniversary) years -= 1;
  return years;
}

/**
 * เนื้อหาจาก editor มี &nbsp; คั่นทุกคำ ทำให้เบราว์เซอร์ตัดบรรทัดตรงช่องว่างไม่ได้
 * (บรรทัดยาวล้น หรือไปตัดกลางคำแทน) — แปลงเป็นช่องว่างปกติก่อนแสดง
 */
function normalizeEditorHtml(html: string): string {
  return html.replace(/&nbsp;| /g, " ");
}

export default function HistoryPageContent() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  // คำนวณตอน render — server กับ client จะได้ค่าต่างกันก็ต่อเมื่อเปิดหน้าคร่อมเที่ยงคืนวันครบรอบพอดี
  const years = useMemo(() => yearsSinceRegistered(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pages/history")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setContent(data.content || ""); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const safeHtml = useMemo(() => (content ? sanitizeHtml(normalizeEditorHtml(content)) : ""), [content]);

  const stops: RoadStop[] = MILESTONES.map((m) => ({
    key: m.date,
    icon: m.icon,
    content: (
      <>
        <span className={css.stopDate}>{m.date}</span>
        <h3 className={css.stopTitle}>{m.title}</h3>
        <p className={css.stopDetail}>{m.detail}</p>
      </>
    ),
  }));

  const stats = [
    { value: "10", unit: "คน", label: "คณะผู้ริเริ่มก่อตั้ง" },
    { value: "256", unit: "คน", label: "ข้าราชการและลูกจ้างกรมทางหลวงผู้ร่วมก่อตั้ง" },
    { value: "2520", unit: "", label: "ปีที่จดทะเบียนเป็นสหกรณ์", prefix: "พ.ศ." },
    { value: String(years), unit: "ปี", label: "ดูแลสมาชิกต่อเนื่อง" },
  ];

  return (
    <AboutPageShell
      breadcrumbLabel="ประวัติสหกรณ์"
      eyebrow="OUR HISTORY · SINCE 2520"
      title="ประวัติสหกรณ์"
      lead="จากข้าราชการและลูกจ้างกรมทางหลวง 256 คนที่ร่วมกันก่อตั้งเมื่อปี 2520 เพื่อให้เพื่อนร่วมงานมีที่ออมเงินและที่พึ่งยามจำเป็น สู่สหกรณ์ที่ดูแลสมาชิกมาต่อเนื่องจนถึงวันนี้"
      badge={<>ก่อตั้ง พ.ศ. 2520 · {years} ปี</>}
      heroImage="/images/about/history-hero.png"
      heroImageAlt="ภาพประกอบประวัติสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<HistoryEmblem />}
    >
      {/* ── จุดเริ่มต้น ── */}
      <section className={css.origin} aria-labelledby="origin-heading">
        <div className={css.originYear} aria-hidden="true">
          <span className={css.originYearLabel}>พ.ศ.</span>
          2520
        </div>
        <div className={css.originBody}>
          <h2 className={css.originTitle} id="origin-heading">สหกรณ์ของคนกรมทางหลวง</h2>
          <p className={css.originText}>
            ก่อตั้งขึ้นเพื่อ<strong>ส่งเสริมการออมทรัพย์ในหมู่สมาชิก</strong>
            และ<strong>ช่วยให้สมาชิกได้รับเงินกู้ตามความต้องการอันจำเป็น</strong>
            โดยใช้ตราเครื่องหมายกรมทางหลวงเป็นตราของสหกรณ์มาตั้งแต่วันแรก
          </p>
        </div>
      </section>

      {/* ── ตัวเลขสำคัญ ── */}
      <ul role="list" className={css.stats} aria-label="ตัวเลขสำคัญ">
        {stats.map((s) => (
          <li key={s.label} className={css.stat}>
            <span className={css.statValue}>
              {s.prefix && <span className={css.statPrefix}>{s.prefix}</span>}
              {s.value}
              {s.unit && <span className={css.statUnit}>{s.unit}</span>}
            </span>
            <span className={css.statLabel}>{s.label}</span>
          </li>
        ))}
      </ul>

      {/* ── เส้นทางการก่อตั้ง ── */}
      <section className={css.section} aria-labelledby="timeline-heading">
        <AboutSectionHead title="เส้นทางการก่อตั้ง ปี 2520" id="timeline-heading" />
        <p className={css.sectionIntro}>ใช้เวลาเพียง 5 เดือน จากการประชุมครั้งแรกจนถึงวันเปิดดำเนินกิจการ</p>
        <RoadTimeline
          ariaLabel="ลำดับเหตุการณ์การก่อตั้ง"
          stops={stops}
          destination="เจริญก้าวหน้าเป็นลำดับจนถึงปัจจุบัน"
        />
      </section>

      {/* ── สหกรณ์ทำงานอย่างไร ── */}
      <section className={css.section} aria-labelledby="how-heading">
        <AboutSectionHead title="สหกรณ์ช่วยสมาชิกอย่างไร" id="how-heading" />
        <p className={css.sectionIntro}>ตั้งแต่วันแรก สหกรณ์แบ่งบทบาทของสมาชิกไว้เป็น 2 กลุ่มที่ช่วยเหลือกัน</p>
        <div className={css.flow}>
          <article className={css.flowCard}>
            <span className={css.flowIcon} aria-hidden="true"><PiggyBank size={26} strokeWidth={1.8} /></span>
            <h3 className={css.flowTitle}>สมาชิกผู้ออม</h3>
            <p className={css.flowText}>
              นำเงินมาฝากกับสหกรณ์ ได้รับผลตอบแทนเป็นดอกเบี้ยเงินฝากที่สูงกว่าธนาคารพาณิชย์
            </p>
          </article>

          <div className={css.flowLink} aria-hidden="true">
            <RefreshCcw size={22} strokeWidth={2} />
          </div>

          <article className={css.flowCard}>
            <span className={css.flowIcon} aria-hidden="true"><HandCoins size={26} strokeWidth={1.8} /></span>
            <h3 className={css.flowTitle}>สมาชิกผู้กู้</h3>
            <p className={css.flowText}>
              กู้เงินไปบรรเทาความเดือดร้อนในอัตราดอกเบี้ยต่ำ และยังได้รับเงินเฉลี่ยคืน
            </p>
          </article>
        </div>
        <p className={css.flowCaption}>เงินของสมาชิก หมุนเวียนช่วยเหลือสมาชิกด้วยกันเอง — นี่คือหัวใจของสหกรณ์ออมทรัพย์</p>
      </section>

      {/* ── ประวัติฉบับเต็ม (แก้ไขได้จากระบบ Admin) ── */}
      <section className={css.section} aria-labelledby="full-heading">
        <AboutSectionHead title="ประวัติฉบับเต็ม" id="full-heading" />
        {loading ? (
          <AboutLoading />
        ) : safeHtml ? (
          <article className={css.article} dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          <AboutEmpty icon={<FileTextOutlined />} text="ยังไม่มีเนื้อหา — กรุณาเพิ่มเนื้อหาผ่านระบบ Admin" />
        )}
      </section>
    </AboutPageShell>
  );
}
