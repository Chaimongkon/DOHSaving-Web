"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { User } from "lucide-react";
import css from "./PeopleTiers.module.css";

export interface Person {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
}

export interface PeopleTier {
  key: string | number;
  label: string;
  members: Person[];
}

/**
 * แยก "ชื่อ" กับ "นามสกุล" — ปกติแสดงต่อกันบรรทัดเดียว แต่ถ้าชื่อยาวจนย่อถึงขนาดต่ำสุด
 * แล้วยังล้น จะใช้รอยต่อนี้ขึ้นบรรทัดใหม่แทนที่จะให้เบราว์เซอร์ตัดกลางคำ ("มงคลโชติ/สกุล")
 * ข้อมูลบางชื่อมีเว้นวรรคสองช่อง จึงแยกด้วย \s+
 */
function splitName(full: string): [string, string] {
  const [first, ...rest] = full.trim().split(/\s+/);
  return [first ?? "", rest.join(" ")];
}

/**
 * ตำแหน่งยาว ๆ (เช่น "ผู้จัดการฝ่ายการเงินและการลงทุน") กว้างกว่าการ์ด
 * ถ้าให้เบราว์เซอร์ตัดเอง จะตัดกลางคำ เช่น "ฝ่ายการ/เงิน"
 * จึงแบ่งท่อนก่อนคำว่า "และ" แต่ละท่อนห้ามตัดกลาง ถ้าวางบรรทัดเดียวได้ก็อยู่บรรทัดเดียว
 */
function splitPosition(position: string): string[] {
  return position.trim().split(/(?=และ)/).filter(Boolean);
}

interface PeopleTiersProps {
  tiers: PeopleTier[];
}

/** ขนาดตัวอักษรต่ำสุดที่ยอมย่อชื่อลงไป ก่อนจะยอมแบ่งเป็น 2 บรรทัด */
const NAME_MIN_PX = 12;

/**
 * ให้ชื่อเต็มอยู่บรรทัดเดียว: ถ้าล้นความกว้างการ์ด ย่อทีละ 0.5px จนพอดี
 * ถ้าย่อถึง NAME_MIN_PX แล้วยังล้น ค่อยแบ่งชื่อ/นามสกุลเป็น 2 บรรทัด
 * (วัดข้อมูลจริงแล้ว: จอใหญ่ทุกชื่อพอดีที่ 15px ไม่ต้องย่อ — ส่วนนี้มีไว้กันมือถือจอแคบ
 *  และชื่อยาวที่อาจเพิ่มในอนาคต)
 */
function fitNames(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(`.${css.name}`).forEach((el) => {
    el.classList.remove(css.nameWrap);
    el.style.fontSize = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 0.5 && size > NAME_MIN_PX) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
    if (el.scrollWidth > el.clientWidth + 0.5) {
      el.style.fontSize = "";
      el.classList.add(css.nameWrap);
    }
  });
}

/**
 * ผังบุคลากรแบ่งตามระดับ: ป้ายระดับแบบป้ายทางหลวง
 * เชื่อมระดับด้วยเส้นประสีทองแบบเส้นกึ่งกลางถนน
 * ระดับแรกใช้การ์ดใหญ่กว่า (ประธาน / ผู้จัดการใหญ่ / ผู้จัดการฝ่าย)
 */
export default function PeopleTiers({ tiers }: PeopleTiersProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll(`.${css.reveal}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tiers]);

  // จัดชื่อให้พอดีก่อนเบราว์เซอร์วาด (layout effect กันชื่อกระพริบ)
  // วัดใหม่เมื่อฟอนต์โหลดเสร็จ และเมื่อความกว้างเปลี่ยน (หมุนจอ / ย่อหน้าต่าง)
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    fitNames(root);
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) fitNames(root); });
    let lastWidth = root.clientWidth;
    const resize = new ResizeObserver(() => {
      if (root.clientWidth === lastWidth) return;
      lastWidth = root.clientWidth;
      fitNames(root);
    });
    resize.observe(root);
    return () => {
      cancelled = true;
      resize.disconnect();
    };
  }, [tiers]);

  return (
    <div className={css.chart} ref={rootRef}>
      {tiers.map((tier, tierIdx) => {
        const featured = tierIdx === 0 && tiers.length > 1;
        return (
          <section key={tier.key} className={css.tier} aria-label={tier.label}>
            {tierIdx > 0 && <span className={css.connector} aria-hidden="true" />}

            <h3 className={css.tierLabel}>
              {tier.label}
              {tier.members.length > 1 && (
                <span className={css.tierCount}>{tier.members.length} ท่าน</span>
              )}
            </h3>

            <ul role="list" className={css.grid}>
              {tier.members.map((m, i) => (
                <li
                  key={m.id}
                  className={`${css.person} ${featured ? css.personFeatured : ""} ${css.reveal}`}
                  style={{ transitionDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  {/* เหรียญตรา: วงแหวนทอง > ขอบขาว > รูปครอปเฉพาะใบหน้า */}
                  <div className={css.ring}>
                    <div className={css.face}>
                      {/* ไอคอนรองพื้นไว้เสมอ ถ้ารูปโหลดไม่ขึ้น (ไฟล์หาย) จะเห็นไอคอนแทนวงว่าง */}
                      <span className={css.facePlaceholder} aria-hidden="true">
                        <User size={featured ? 64 : 48} strokeWidth={1.5} />
                      </span>
                      {m.imageUrl && (
                        /* รูปมาจาก /uploads ของ Admin ขนาดไม่แน่นอน — ใช้ <img> ครอปด้วย CSS
                           รายการนี้เรนเดอร์หลัง fetch ฝั่ง client จึงจับ onError ได้ทัน */
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                  </div>
                  <h4 className={css.name}>
                    {(() => {
                      const [first, last] = splitName(m.name);
                      return (
                        <>
                          <span className={css.nameLine}>{first}</span>
                          {/* ช่องว่างจริงใน DOM ให้โปรแกรมอ่านหน้าจออ่านชื่อกับนามสกุลแยกกัน */}
                          {last && <>{" "}<span className={css.nameLine}>{last}</span></>}
                        </>
                      );
                    })()}
                  </h4>
                  <p className={css.position}>
                    {splitPosition(m.position).map((part, i) => (
                      <span key={i} className={css.positionPart}>{part}</span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
