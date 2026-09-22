"use client";

import React, { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Flag } from "lucide-react";
import css from "./RoadTimeline.module.css";

export interface RoadStop {
  key: string;
  icon: LucideIcon;
  /** ข้อความธรรมดาจะได้สไตล์มาตรฐาน ส่ง ReactNode มาถ้าต้องการจัดรูปแบบเอง */
  content: React.ReactNode;
}

interface RoadTimelineProps {
  stops: RoadStop[];
  /** ข้อความที่ธงปลายทางท้ายถนน — ไม่ส่งก็ไม่แสดงธง */
  destination?: string;
  /** ป้ายกำกับของรายการสำหรับโปรแกรมอ่านหน้าจอ */
  ariaLabel?: string;
}

/**
 * ถนนแนวตั้งแบบทางหลวง: ผิวถนนกรมท่า เส้นกึ่งกลางสีทอง
 * แต่ละจุดแวะมีหมุดเลขลำดับบนถนน และการ์ดเนื้อหาด้านขวา
 */
export default function RoadTimeline({ stops, destination, ariaLabel }: RoadTimelineProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // ค่อย ๆ แสดงจุดแวะเมื่อเลื่อนมาถึง
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
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
    root.querySelectorAll(`.${css.reveal}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stops]);

  return (
    <div className={css.route} ref={rootRef}>
      <ol role="list" className={css.stops} aria-label={ariaLabel}>
        {stops.map(({ key, icon: Icon, content }, i) => (
          <li
            key={key}
            className={`${css.stop} ${css.reveal}`}
            style={{ transitionDelay: `${Math.min(i, 6) * 80}ms` }}
          >
            <span className={css.stopMarker} aria-hidden="true">{i + 1}</span>
            <div className={css.stopCard}>
              <span className={css.stopIcon} aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <div className={css.stopBody}>
                {typeof content === "string" ? <p className={css.stopText}>{content}</p> : content}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {destination && (
        <div className={css.destination}>
          <span className={css.destinationMarker} aria-hidden="true">
            <Flag size={20} strokeWidth={2} />
          </span>
          <span className={css.destinationText}>{destination}</span>
        </div>
      )}
    </div>
  );
}
