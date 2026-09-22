"use client";

import React, { useState, useEffect } from "react";
import { CrownOutlined } from "@ant-design/icons";
import { Quote, ExternalLink } from "lucide-react";
import AboutPageShell, { AboutLoading, AboutEmpty, AboutNextLink } from "@/components/about/AboutPageShell";
import { ChairmanEmblem } from "@/components/about/GovernanceEmblems";
import css from "./ChairmanMessageContent.module.css";

interface ChairmanData {
  portraitUrl: string;
  messageUrl: string;
  name: string;
  title: string;
}

const EMPTY: ChairmanData = { portraitUrl: "", messageUrl: "", name: "", title: "" };

export default function ChairmanMessageContent() {
  const [data, setData] = useState<ChairmanData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chairman-message")
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData({ ...EMPTY, ...d }); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hasData = Boolean(data.portraitUrl || data.messageUrl);

  return (
    <AboutPageShell
      breadcrumbLabel="สารจากประธานฯ"
      eyebrow="MESSAGE FROM THE CHAIRMAN"
      title="สารจากประธานกรรมการ"
      lead={
        data.name
          ? `${data.name}${data.title ? ` · ${data.title}` : ""}`
          : "ข้อความถึงสมาชิกจากประธานคณะกรรมการดำเนินการ"
      }
      /* รูปประธานจาก Admin เป็นภาพหลักของหน้า — ถ้ายังไม่มีจะแสดงตราสัญลักษณ์แทน */
      heroImage={data.portraitUrl}
      heroImageAlt={data.name ? `${data.name} ${data.title}` : "ประธานกรรมการดำเนินการ"}
      emblem={<ChairmanEmblem />}
    >
      {loading ? (
        <AboutLoading />
      ) : hasData ? (
        <>
          {data.messageUrl && (
            <article className={css.letter} aria-labelledby="letter-heading">
              <header className={css.letterHead}>
                <span className={css.letterIcon} aria-hidden="true">
                  <Quote size={20} strokeWidth={2.2} />
                </span>
                <h2 className={css.letterTitle} id="letter-heading">สารถึงสมาชิก</h2>
                <a
                  className={css.letterZoom}
                  href={data.messageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                  ดูขนาดเต็ม
                </a>
              </header>

              <div className={css.letterPaper}>
                {/* สารเป็นรูปภาพที่อัปโหลดจาก Admin ขนาดไม่แน่นอน */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.messageUrl}
                  alt={`สารจากประธานกรรมการ${data.name ? ` ${data.name}` : ""}`}
                  className={css.letterImg}
                  loading="lazy"
                />
              </div>

              {data.name && (
                <footer className={css.signature}>
                  <span className={css.signatureRule} aria-hidden="true" />
                  <span className={css.signatureName}>{data.name}</span>
                  {data.title && <span className={css.signatureTitle}>{data.title}</span>}
                  <span className={css.signatureOrg}>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</span>
                </footer>
              )}
            </article>
          )}

          <AboutNextLink
            href="/about/vision"
            title="วิสัยทัศน์และพันธกิจ"
            text="จุดหมายที่คณะกรรมการและสหกรณ์มุ่งพาสมาชิกไป"
          />
        </>
      ) : (
        <AboutEmpty icon={<CrownOutlined />} text="ยังไม่มีข้อมูล — กรุณาเพิ่มผ่านระบบ Admin" />
      )}
    </AboutPageShell>
  );
}
