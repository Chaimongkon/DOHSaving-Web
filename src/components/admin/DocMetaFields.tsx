"use client";

import React from "react";
import { FileProtectOutlined } from "@ant-design/icons";
import { type DocMeta, safeDocUrl } from "@/lib/docMeta";
import css from "./DocMetaFields.module.css";

interface DocMetaFieldsProps {
  value: DocMeta;
  onChange: (next: DocMeta) => void;
  /** ตัวอย่างข้อความอ้างอิง ให้ต่างกันตามหน้า */
  referencePlaceholder?: string;
}

export default function DocMetaFields({
  value,
  onChange,
  referencePlaceholder = "มติที่ประชุมคณะกรรมการดำเนินการ ชุดที่ .. ครั้งที่ ../25..",
}: DocMetaFieldsProps) {
  const set = (key: keyof DocMeta) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  // เตือนตั้งแต่ตอนกรอก ถ้าลิงก์ใช้ไม่ได้หน้าเว็บจะไม่แสดงปุ่มดาวน์โหลดให้
  const urlInvalid = value.documentUrl.trim() !== "" && safeDocUrl(value.documentUrl) === null;

  return (
    <div className={css.box}>
      <div className={css.head}>
        <h2 className={css.title}>
          <FileProtectOutlined /> ที่มาของเอกสาร
        </h2>
        <p className={css.hint}>
          แสดงเป็นแถบด้านบนของหน้าเว็บ ให้สมาชิกและผู้ตรวจสอบกิจการอ้างอิงได้ว่าเอกสารนี้
          ประกาศใช้เมื่อไรและตามมติใด — เว้นว่างไว้ได้ ช่องไหนว่างจะไม่แสดง
          และถ้าเว้นว่างทั้งหมดแถบนี้จะไม่ขึ้นเลย
        </p>
      </div>

      <div className={css.grid}>
        <div className={css.field}>
          <label className={css.label} htmlFor="docMeta-announcedAt">ประกาศใช้เมื่อ</label>
          <input
            id="docMeta-announcedAt"
            className={css.input}
            type="text"
            value={value.announcedAt}
            onChange={set("announcedAt")}
            placeholder="1 มกราคม 2567"
          />
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="docMeta-edition">ฉบับ</label>
          <input
            id="docMeta-edition"
            className={css.input}
            type="text"
            value={value.edition}
            onChange={set("edition")}
            placeholder="ฉบับปี 2567"
          />
        </div>

        <div className={`${css.field} ${css.fieldWide}`}>
          <label className={css.label} htmlFor="docMeta-reference">อ้างอิง</label>
          <input
            id="docMeta-reference"
            className={css.input}
            type="text"
            value={value.reference}
            onChange={set("reference")}
            placeholder={referencePlaceholder}
          />
        </div>

        <div className={`${css.field} ${css.fieldWide}`}>
          <label className={css.label} htmlFor="docMeta-documentUrl">ลิงก์เอกสารต้นฉบับ (PDF)</label>
          <input
            id="docMeta-documentUrl"
            className={`${css.input} ${urlInvalid ? css.inputError : ""}`}
            type="text"
            value={value.documentUrl}
            onChange={set("documentUrl")}
            placeholder="/uploads/documents/ethics-staff-2567.pdf หรือ https://..."
            aria-invalid={urlInvalid || undefined}
            aria-describedby={urlInvalid ? "docMeta-documentUrl-error" : undefined}
          />
          {urlInvalid && (
            <span className={css.error} id="docMeta-documentUrl-error">
              ลิงก์ไม่ถูกต้อง — ต้องขึ้นต้นด้วย / หรือ http:// หรือ https:// เท่านั้น
              ถ้าบันทึกแบบนี้หน้าเว็บจะไม่แสดงปุ่มดาวน์โหลด
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
