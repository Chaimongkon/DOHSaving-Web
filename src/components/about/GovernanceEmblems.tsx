"use client";

import React from "react";
import css from "./AboutPageShell.module.css";

/**
 * ตราสัญลักษณ์สำรองของหน้าเอกสารกำกับดูแล
 * แสดงเมื่อยังไม่ได้วางไฟล์ภาพ hero ไว้ใน public/images/about/
 * แต่ละหน้าใช้คนละตราเพื่อให้สมาชิกจำแยกกันได้ แต่ใช้ชุดสีเดียวกัน
 *
 * id ของ gradient ต้องไม่ซ้ำกันข้ามไฟล์ เพราะ <defs> เป็น global ในหน้าเดียวกัน
 */

export function GoldDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {/* userSpaceOnUse ไม่ใช่ objectBoundingBox เพราะเส้นตรงแนวตั้ง/แนวนอน
          มี bounding box กว้างหรือสูงเป็นศูนย์ ทำให้ gradient ไม่เรนเดอร์เลย
          (เช่น เสาและคานของตราชั่ง) และยังได้แสงทองต่อเนื่องทั้งตราด้วย */}
      <linearGradient id={`${prefix}Gold`} gradientUnits="userSpaceOnUse" x1="40" y1="40" x2="240" y2="240">
        <stop offset="0%" stopColor="#F7E3A1" />
        <stop offset="45%" stopColor="#D8AE3F" />
        <stop offset="100%" stopColor="#9C7415" />
      </linearGradient>
      <linearGradient id={`${prefix}GoldSoft`} gradientUnits="userSpaceOnUse" x1="40" y1="40" x2="240" y2="240">
        <stop offset="0%" stopColor="#F7E3A1" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#C9A227" stopOpacity="0.22" />
      </linearGradient>
      <radialGradient id={`${prefix}Core`} cx="36%" cy="30%" r="74%">
        <stop offset="0%" stopColor="#FBEFC6" />
        <stop offset="52%" stopColor="#E8652B" />
        <stop offset="100%" stopColor="#8F3110" />
      </radialGradient>
    </defs>
  );
}

/* ── นโยบายสหกรณ์ — โล่ ── */
export function PolicyEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์นโยบายสหกรณ์">
      <GoldDefs prefix="pol" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#polGoldSoft)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="104" fill="none" stroke="url(#polGold)" strokeWidth="2.5" opacity="0.75" />

      <path
        d="M140 44 L214 76 V146 C214 190 178 220 140 236 C102 220 66 190 66 146 V76 Z"
        fill="rgba(255,255,255,0.05)"
        stroke="url(#polGold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M140 62 L198 87 V145 C198 180 170 204 140 218 C110 204 82 180 82 145 V87 Z"
        fill="none"
        stroke="url(#polGoldSoft)"
        strokeWidth="1.5"
      />

      <circle cx="140" cy="140" r="36" fill="url(#polCore)" />
      <circle cx="140" cy="140" r="36" fill="none" stroke="url(#polGold)" strokeWidth="2" />
      <path
        d="M124 141 l11 12 l21 -25"
        fill="none"
        stroke="#FFF7E3"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── จรรยาบรรณเจ้าหน้าที่ — ตราประทับพวงลอเรล + รูปเจ้าหน้าที่ ── */
const LAUREL_LEAVES = Array.from({ length: 8 }, (_, i) => {
  const deg = 140 + i * 10.5;
  const rad = (deg * Math.PI) / 180;
  const r = 99;
  return {
    x: 140 + Math.cos(rad) * r,
    y: 140 + Math.sin(rad) * r,
    rot: deg + 68,
    scale: 1 - i * 0.055,
  };
});

function Laurel({ keyPrefix }: { keyPrefix: string }) {
  return (
    <>
      {LAUREL_LEAVES.map((leaf, i) => (
        <ellipse
          key={`${keyPrefix}${i}`}
          cx="0"
          cy="0"
          rx={5}
          ry={11}
          transform={`translate(${leaf.x.toFixed(1)},${leaf.y.toFixed(1)}) rotate(${leaf.rot.toFixed(1)}) scale(${leaf.scale.toFixed(2)})`}
        />
      ))}
    </>
  );
}

export function EthicsStaffEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์จรรยาบรรณเจ้าหน้าที่">
      <GoldDefs prefix="est" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#estGoldSoft)" strokeWidth="1.5" />
      <circle
        cx="140"
        cy="140"
        r="112"
        fill="none"
        stroke="url(#estGold)"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0.7"
      />

      <g fill="url(#estGold)" opacity="0.85">
        <Laurel keyPrefix="l" />
        <g transform="translate(280,0) scale(-1,1)">
          <Laurel keyPrefix="r" />
        </g>
      </g>

      <circle cx="140" cy="140" r="78" fill="rgba(255,255,255,0.05)" stroke="url(#estGold)" strokeWidth="2.5" />
      <circle cx="140" cy="140" r="68" fill="none" stroke="url(#estGoldSoft)" strokeWidth="1.2" />

      <circle cx="140" cy="140" r="50" fill="url(#estCore)" />
      <circle cx="140" cy="140" r="50" fill="none" stroke="url(#estGold)" strokeWidth="2" />
      <g fill="#FFF7E3">
        <circle cx="140" cy="126" r="14" />
        <path d="M112 172 a28 28 0 0 1 56 0 Z" />
      </g>
    </svg>
  );
}

/* ── จรรยาบรรณคณะกรรมการ — ตราชั่ง (ความเป็นธรรมในการตัดสินใจ) ── */
export function EthicsBoardEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์จรรยาบรรณคณะกรรมการ">
      <GoldDefs prefix="ebd" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#ebdGoldSoft)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="108" fill="none" stroke="url(#ebdGold)" strokeWidth="2" opacity="0.7" />

      <g stroke="url(#ebdGold)" strokeWidth="3" strokeLinecap="round" fill="none">
        {/* เสากลาง + คาน */}
        <path d="M140 96 V206" />
        <path d="M68 100 H212" />
        {/* โซ่แขวนจานสองข้าง */}
        <path d="M68 102 L50 142 M68 102 L86 142" strokeWidth="1.8" />
        <path d="M212 102 L194 142 M212 102 L230 142" strokeWidth="1.8" />
      </g>

      {/* จานชั่งสองข้าง */}
      <g fill="rgba(255,255,255,0.06)" stroke="url(#ebdGold)" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M44 142 H92 a24 24 0 0 1 -48 0 Z" />
        <path d="M188 142 H236 a24 24 0 0 1 -48 0 Z" />
      </g>

      {/* ฐาน */}
      <g fill="url(#ebdGold)">
        <path d="M112 206 H168 L176 222 H104 Z" />
        <rect x="96" y="222" width="88" height="8" rx="4" />
      </g>

      {/* หัวเสา */}
      <circle cx="140" cy="88" r="17" fill="url(#ebdCore)" />
      <circle cx="140" cy="88" r="17" fill="none" stroke="url(#ebdGold)" strokeWidth="2" />
    </svg>
  );
}

/* ── บุคลากร (คณะกรรมการ / ผู้จัดการ / ฝ่าย) — สามคนยืนเคียงกัน ── */
export function TeamEmblem({ label = "ตราสัญลักษณ์บุคลากรสหกรณ์" }: { label?: string }) {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label={label}>
      <GoldDefs prefix="tm" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#tmGoldSoft)" strokeWidth="1.5" />
      <circle
        cx="140"
        cy="140"
        r="108"
        fill="rgba(255,255,255,0.04)"
        stroke="url(#tmGold)"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* สองคนด้านข้าง สีทอง */}
      <g fill="url(#tmGold)" opacity="0.9">
        <circle cx="90" cy="130" r="13" />
        <path d="M66 176 a24 24 0 0 1 48 0 Z" />
        <circle cx="190" cy="130" r="13" />
        <path d="M166 176 a24 24 0 0 1 48 0 Z" />
      </g>

      {/* คนกลาง บนวงส้ม */}
      <circle cx="140" cy="128" r="46" fill="url(#tmCore)" />
      <circle cx="140" cy="128" r="46" fill="none" stroke="url(#tmGold)" strokeWidth="2" />
      <g fill="#FFF7E3">
        <circle cx="140" cy="113" r="14" />
        <path d="M114 160 a26 26 0 0 1 52 0 Z" />
      </g>

      {/* ฐานเส้นทอง */}
      <rect x="62" y="184" width="156" height="4" rx="2" fill="url(#tmGold)" />
    </svg>
  );
}

/* ── ผู้ตรวจสอบ — แว่นขยายส่องสมุดบัญชี ── */
export function AuditEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ">
      <GoldDefs prefix="aud" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#audGoldSoft)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="106" fill="rgba(255,255,255,0.04)" stroke="url(#audGold)" strokeWidth="2.5" opacity="0.75" />

      {/* สมุดบัญชี */}
      <rect x="84" y="66" width="98" height="128" rx="10" fill="#FFF7E3" stroke="url(#audGold)" strokeWidth="2.5" />
      <rect x="84" y="66" width="98" height="22" rx="10" fill="url(#audCore)" />
      <rect x="84" y="80" width="98" height="8" fill="url(#audCore)" />
      <g stroke="#0f1d36" strokeWidth="3" strokeLinecap="round" opacity="0.28">
        <path d="M100 108 H166" />
        <path d="M100 124 H158" />
        <path d="M100 140 H150" />
        <path d="M100 156 H136" />
      </g>

      {/* แว่นขยาย */}
      <path d="M192 184 L218 210" stroke="url(#audGold)" strokeWidth="11" strokeLinecap="round" />
      <circle cx="170" cy="162" r="32" fill="rgba(15,29,54,0.55)" stroke="url(#audGold)" strokeWidth="7" />
      <path
        d="M156 162 l9 9 l16 -18"
        fill="none"
        stroke="#F7E3A1"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── โครงสร้างองค์กร — ผังองค์กร 3 ชั้น ── */
export function OrgEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์โครงสร้างองค์กร">
      <GoldDefs prefix="org" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#orgGoldSoft)" strokeWidth="1.5" />
      <circle
        cx="140"
        cy="140"
        r="110"
        fill="rgba(255,255,255,0.04)"
        stroke="url(#orgGold)"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* เส้นเชื่อม */}
      <g stroke="url(#orgGold)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M140 100 V118 M76 118 H204 M76 118 V130 M140 118 V130 M204 118 V130" />
        <path d="M140 156 V172 M108 172 H172 M108 172 V184 M172 172 V184" />
      </g>

      {/* ชั้นบนสุด */}
      <rect x="108" y="68" width="64" height="32" rx="9" fill="url(#orgCore)" stroke="url(#orgGold)" strokeWidth="2" />
      {/* ชั้นกลาง */}
      <g fill="#16294a" stroke="url(#orgGold)" strokeWidth="2">
        <rect x="52" y="130" width="48" height="26" rx="7" />
        <rect x="116" y="130" width="48" height="26" rx="7" />
        <rect x="180" y="130" width="48" height="26" rx="7" />
      </g>
      {/* ชั้นล่าง */}
      <g fill="#FFF7E3" stroke="url(#orgGold)" strokeWidth="2">
        <rect x="86" y="184" width="44" height="24" rx="7" />
        <rect x="150" y="184" width="44" height="24" rx="7" />
      </g>
    </svg>
  );
}

/* ── สารจากประธาน — ใช้เมื่อยังไม่มีรูปประธาน: พวงลอเรล + ดาว + รูปบุคคล ── */
export function ChairmanEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์สารจากประธานกรรมการ">
      <GoldDefs prefix="chm" />

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#chmGoldSoft)" strokeWidth="1.5" />
      <g fill="url(#chmGold)" opacity="0.85">
        <Laurel keyPrefix="cl" />
        <g transform="translate(280,0) scale(-1,1)">
          <Laurel keyPrefix="cr" />
        </g>
      </g>

      <circle cx="140" cy="140" r="62" fill="url(#chmCore)" />
      <circle cx="140" cy="140" r="62" fill="none" stroke="url(#chmGold)" strokeWidth="2.5" />
      <g fill="#FFF7E3">
        <circle cx="140" cy="124" r="17" />
        <path d="M106 182 a34 34 0 0 1 68 0 Z" />
      </g>

      {/* ดาวเหนือศีรษะ */}
      <path
        d="M140 34 l6.5 13.2 14.5 2.1 -10.5 10.2 2.5 14.5 -13 -6.8 -13 6.8 2.5 -14.5 -10.5 -10.2 14.5 -2.1 Z"
        fill="url(#chmGold)"
      />
    </svg>
  );
}

/* ── ประวัติสหกรณ์ — หลักกิโลเมตร "2520" ข้างทางหลวง = จุดเริ่มต้นของเส้นทาง ── */
export function HistoryEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์ประวัติสหกรณ์ หลักกิโลเมตรปี 2520">
      <GoldDefs prefix="his" />
      <defs>
        <clipPath id="hisPost">
          <path d="M98 214 V104 A42 42 0 0 1 182 104 V214 Z" />
        </clipPath>
      </defs>

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#hisGoldSoft)" strokeWidth="1.5" />
      <circle
        cx="140"
        cy="140"
        r="110"
        fill="none"
        stroke="url(#hisGold)"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* ถนนที่หลักกิโลปักอยู่ */}
      <rect x="44" y="214" width="192" height="16" rx="8" fill="#0a1628" stroke="url(#hisGold)" strokeWidth="1.5" />
      <path d="M58 222 H222" stroke="#F7E3A1" strokeWidth="2.5" strokeDasharray="12 10" strokeLinecap="round" />

      {/* ตัวหลักกิโล: หัวส้ม ตัวครีม ขอบทอง */}
      <g clipPath="url(#hisPost)">
        <rect x="98" y="60" width="84" height="160" fill="#FFF7E3" />
        <rect x="98" y="60" width="84" height="62" fill="url(#hisCore)" />
        <rect x="98" y="122" width="84" height="5" fill="url(#hisGold)" />
      </g>
      <path
        d="M98 214 V104 A42 42 0 0 1 182 104 V214 Z"
        fill="none"
        stroke="url(#hisGold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <text x="140" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FFF7E3" letterSpacing="1">
        สอ.ทล.
      </text>
      <text x="140" y="156" textAnchor="middle" fontSize="13" fontWeight="700" fill="#8a6520">
        ก่อตั้ง พ.ศ.
      </text>
      <text x="140" y="188" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f1d36" letterSpacing="-0.5">
        2520
      </text>
    </svg>
  );
}

/* ── วิสัยทัศน์ — ถนนมุ่งสู่ขอบฟ้า มีดวงอาทิตย์เป็นจุดหมาย ── */
export function VisionEmblem() {
  return (
    <svg className={css.heroEmblem} viewBox="0 0 280 280" role="img" aria-label="ตราสัญลักษณ์วิสัยทัศน์ ถนนมุ่งสู่จุดหมาย">
      <GoldDefs prefix="vis" />
      <defs>
        <clipPath id="visClip">
          <circle cx="140" cy="140" r="100" />
        </clipPath>
        <linearGradient id="visAsphalt" gradientUnits="userSpaceOnUse" x1="140" y1="140" x2="140" y2="240">
          <stop offset="0%" stopColor="#1c3157" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
      </defs>

      <circle cx="140" cy="140" r="122" fill="none" stroke="url(#visGoldSoft)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="100" fill="rgba(255,255,255,0.05)" stroke="url(#visGold)" strokeWidth="2.5" />

      <g clipPath="url(#visClip)">
        {/* ดวงอาทิตย์ที่ขอบฟ้า = จุดหมายปลายทาง */}
        <circle cx="140" cy="132" r="30" fill="url(#visCore)" />
        <path d="M40 132 H240" stroke="url(#visGold)" strokeWidth="1.5" opacity="0.7" />

        {/* ผิวถนนแบบ perspective บีบเข้าหาขอบฟ้า */}
        <path d="M132 132 H148 L214 240 H66 Z" fill="url(#visAsphalt)" />
        <path d="M132 132 L66 240 M148 132 L214 240" stroke="url(#visGold)" strokeWidth="2.5" />

        {/* เส้นกึ่งกลางถนน — ขีดยาวขึ้นเมื่อใกล้ผู้มอง */}
        <g fill="#F7E3A1">
          <path d="M139.4 140 h1.2 l0.3 6 h-1.8 Z" />
          <path d="M139 152 h2 l0.5 10 h-3 Z" />
          <path d="M138.3 170 h3.4 l0.9 16 h-5.2 Z" />
          <path d="M137.2 196 h5.6 l1.4 26 h-8.4 Z" />
        </g>
      </g>
    </svg>
  );
}
