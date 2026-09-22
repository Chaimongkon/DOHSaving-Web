"use client";

import React, { useState, useEffect, useRef } from "react";
import { EyeOutlined } from "@ant-design/icons";
import { Navigation } from "lucide-react";
import AboutPageShell, { AboutSectionHead, AboutLoading, AboutEmpty } from "@/components/about/AboutPageShell";
import RoadTimeline from "@/components/about/RoadTimeline";
import { VisionEmblem } from "@/components/about/GovernanceEmblems";
import { pickGovernanceIcon } from "@/components/about/governanceIcons";
import css from "./VisionPageContent.module.css";

interface MissionItem {
  id: string;
  text: string;
}

interface VisionData {
  coreValues: string;
  vision: string;
  missions: MissionItem[];
}

/**
 * ค่านิยมเก็บเป็นข้อความก้อนเดียว — แอดมินบางครั้งขึ้นบรรทัดใหม่ บางครั้งคั่นด้วยเว้นวรรค
 * (ข้อมูลจริงตอนนี้คือ "มุ่งมั่นพัฒนา ยึดหลักธรรมาภิบาล บริการด้วยใจ" บรรทัดเดียว)
 * ถ้ามีหลายบรรทัดใช้ตามบรรทัด ถ้าบรรทัดเดียวค่อยแยกด้วยเว้นวรรค
 * เพราะภาษาไทยใช้เว้นวรรคคั่นวลี ไม่ใช่คั่นคำ
 */
function splitCoreValues(raw: string): string[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length !== 1) return lines;
  const phrases = lines[0].split(/\s+/).filter(Boolean);
  // แยกเฉพาะเมื่อได้ 2-6 วลี — ถ้ามากกว่านั้นน่าจะเป็นประโยคยาว ไม่ใช่รายการค่านิยม
  return phrases.length >= 2 && phrases.length <= 6 ? phrases : lines;
}

export default function VisionPageContent() {
  const [data, setData] = useState<VisionData>({ coreValues: "", vision: "", missions: [] });
  const [loading, setLoading] = useState(true);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vision-data")
      .then((res) => res.json())
      .then((d) => {
        if (cancelled) return;
        setData({
          coreValues: typeof d.coreValues === "string" ? d.coreValues : "",
          vision: typeof d.vision === "string" ? d.vision : "",
          missions: Array.isArray(d.missions) ? d.missions : [],
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ค่อย ๆ แสดงหลักกิโลเมื่อเลื่อนมาถึง (ถนนพันธกิจจัดการ reveal เองใน RoadTimeline)
  useEffect(() => {
    const root = revealRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(css.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  const values = splitCoreValues(data.coreValues);
  const hasData = Boolean(data.vision || values.length || data.missions.length);

  return (
    <AboutPageShell
      breadcrumbLabel="วิสัยทัศน์และพันธกิจ"
      eyebrow="VISION · MISSION · VALUES"
      title="วิสัยทัศน์และพันธกิจ"
      lead="จุดหมายที่สหกรณ์มุ่งไป เส้นทางที่เลือกเดิน และหลักที่ยึดถือตลอดทาง เพื่อความมั่นคงของสมาชิกทุกคน"
      heroImage="/images/about/vision-hero.png"
      heroImageAlt="ภาพประกอบวิสัยทัศน์สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด"
      emblem={<VisionEmblem />}
    >
      {loading ? (
        <AboutLoading />
      ) : !hasData ? (
        <AboutEmpty icon={<EyeOutlined />} text="ยังไม่มีข้อมูล — กรุณาเพิ่มผ่านระบบ Admin" />
      ) : (
        <div ref={revealRef}>
          {/* ── วิสัยทัศน์: ป้ายบอกทางสู่จุดหมาย ── */}
          {data.vision && (
            <section className={css.sign} aria-labelledby="vision-heading">
              <span className={css.signQuote} aria-hidden="true">&ldquo;</span>
              <p className={css.signLabel}>
                <Navigation size={15} strokeWidth={2.2} aria-hidden="true" />
                จุดหมายปลายทาง · VISION
              </p>
              <h2 className={css.signTitle} id="vision-heading">วิสัยทัศน์</h2>
              <blockquote className={css.signText}>{data.vision}</blockquote>
              <span className={css.signRoad} aria-hidden="true" />
            </section>
          )}

          {/* ── ค่านิยม: หลักกิโลเมตรที่ปักไว้ตลอดทาง ── */}
          {values.length > 0 && (
            <section className={css.section} aria-labelledby="values-heading">
              <AboutSectionHead title="ค่านิยม" id="values-heading" />
              <p className={css.sectionIntro}>หลักที่บุคลากรทุกคนยึดถือ เหมือนหลักกิโลเมตรที่บอกว่าเรายังอยู่บนเส้นทาง</p>
              <ol role="list" className={css.posts}>
                {values.map((value, i) => {
                  const Icon = pickGovernanceIcon(value);
                  return (
                    <li
                      key={`${i}-${value}`}
                      className={`${css.post} ${css.reveal}`}
                      data-reveal
                      style={{ transitionDelay: `${i * 90}ms` }}
                    >
                      <div className={css.postCap} aria-hidden="true">
                        <Icon size={26} strokeWidth={1.8} />
                        <span className={css.postNum}>{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <p className={css.postText}>{value}</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* ── พันธกิจ: ถนนที่พาไปสู่วิสัยทัศน์ ── */}
          {data.missions.length > 0 && (
            <section className={css.section} aria-labelledby="missions-heading">
              <AboutSectionHead title={`พันธกิจ ${data.missions.length} ด้าน`} id="missions-heading" />
              <p className={css.sectionIntro}>งานที่สหกรณ์ลงมือทำ เพื่อพาสมาชิกไปถึงจุดหมายเดียวกัน</p>

              <RoadTimeline
                ariaLabel="พันธกิจ"
                stops={data.missions.map((m) => ({
                  key: m.id,
                  icon: pickGovernanceIcon(m.text),
                  content: m.text,
                }))}
                destination={data.vision ? "ปลายทาง: วิสัยทัศน์ของสหกรณ์" : undefined}
              />
            </section>
          )}
        </div>
      )}
    </AboutPageShell>
  );
}
