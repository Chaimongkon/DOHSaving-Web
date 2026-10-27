"use client";

import React from "react";
import { Download } from "lucide-react";
import { trackEvent } from "@/lib/trackEvent";
import { memberKeyOf, type MemberKey } from "@/lib/memberType";
import type { FormVariant } from "@/lib/formGroups";
import css from "./HomeFinder.module.css";

const SHORT: Record<string, string> = {
  "สมาชิกสามัญ ก": "สามัญ ก",
  "สมาชิกสามัญ ข": "สามัญ ข",
  "สมาชิกสมทบ": "สมทบ",
};

const fileExt = (url: string) => url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "pdf";
const downloadName = (title: string, v: FormVariant) =>
  `${title}${SHORT[v.category] ? ` (${v.category})` : ""}.${fileExt(v.fileUrl)}`;

/** จำแบบฟอร์มที่เพิ่งโหลด — หน้า /forms แสดงในหัวข้อ “ใช้ล่าสุด” (คีย์เดียวกัน) */
const RECENT_KEY = "doh-forms-recent";
function remember(id: number) {
  try {
    const prev = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    const list = Array.isArray(prev) ? prev.filter((n) => typeof n === "number" && n !== id) : [];
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...list].slice(0, 4)));
  } catch { /* ไม่จำก็ยังดาวน์โหลดได้ */ }
}

/**
 * ปุ่มดาวน์โหลดแบบฟอร์มแยกตามประเภทสมาชิก (ก / ข / สมทบ) — ฉบับเดียว (ทุกประเภท) แสดงปุ่มเดียว
 * ประเภทที่สมาชิกเคยเลือกไว้ในหน้าแบบฟอร์ม/ระเบียบ ถูกเน้นเป็นปุ่มหลัก
 */
export default function FormDownloadButtons({ title, variants, member }: { title: string; variants: FormVariant[]; member: MemberKey | null }) {
  return (
    <div className={css.dlRow}>
      {variants.map((v) => {
        const mine = member !== null && memberKeyOf(v.category) === member;
        const single = variants.length === 1;
        return (
          <a
            key={v.id}
            href={v.fileUrl}
            download={downloadName(title, v)}
            className={`${css.dlBtn} ${mine || single ? css.dlBtnMain : ""}`}
            onClick={() => {
              trackEvent("form_download", v.id, "download");
              remember(v.id);
            }}
            aria-label={`ดาวน์โหลด ${title}${SHORT[v.category] ? ` สำหรับ${v.category}` : ""}`}
          >
            <Download size={13} />
            {SHORT[v.category] ?? "ดาวน์โหลด"}
            {mine && !single && <span className={css.dlMine}>ของคุณ</span>}
          </a>
        );
      })}
    </div>
  );
}
