/**
 * ข้อมูลติดต่อที่ใช้ร่วมกันระหว่าง /contact และ /contact/map
 *
 * เดิมสองหน้านี้ต่างคนต่างเขียนเบอร์โทรไว้ในไฟล์ตัวเอง พอ DB เปลี่ยนก็แก้ไม่ครบ
 * จนสมาชิกเห็นเบอร์ไม่ตรงกันคนละหน้า — รวมไว้ที่เดียวเพื่อไม่ให้เกิดซ้ำอีก
 */
"use client";

import { useState, useEffect } from "react";

export interface DeptData {
  name: string;
  dohCodes: string | null;
  coopExt: string | null;
  mobile: string | null;
}

export interface LineData {
  name: string;
  lineUrl: string;
}

export type ContactInfoMap = Record<string, string>;

/* ── ค่าสำรอง ใช้ระหว่างรอ API หรือเมื่อ API ล่ม ── */
export const DEFAULT_CONTACT_INFO: ContactInfoMap = {
  address: "2/486 อาคาร 26\nถนนศรีอยุธยา\nแขวงทุ่งพญาไท เขตราชเทวี\nกรุงเทพมหานคร 10400",
  hours: "วันจันทร์ - ศุกร์ เวลา 08.30 - 16.30 น.",
  hoursNote: "(การเงิน ปิดทำการเวลา 15.30 น.)",
  mainPhone: "02-345-6668",
  phone: "02-644-7940-43",
  phoneSub1: "02-644-9243",
  phoneSub2: "02-644-4633",
  email: "dohcoop@hotmail.com",
  lineOfficial: "@dohsaving",
  fax1: "02-354-6717",
  fax1Note: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน, ฝ่ายบริหารทั่วไป, ฝ่ายบัญชี",
  fax2: "02-644-4825",
  fax2Note: "ฝ่ายการเงินและการลงทุน, ฝ่ายสินเชื่อ, ฝ่ายประชาสัมพันธ์และสวัสดิการ",
  /* เวลาทำการแบบมีโครงสร้าง — ทั้งข้อความที่แสดงและ logic เปิด/ปิด อ่านจากสามค่านี้
     ผู้ดูแลแก้ได้ในหน้า admin > ข้อมูลติดต่อ */
  openTime: "08:30",
  closeTime: "16:30",
  financeCloseTime: "15:30",
};

export const DEFAULT_DEPARTMENTS: DeptData[] = [
  { name: "ฝ่ายสินเชื่อ", dohCodes: "27008, 27009, 27010, 27020, 27021", coopExt: "106, 107, 109, 110", mobile: "098-998-3274, 065-937-8275" },
  { name: "ฝ่ายการเงินและการลงทุน", dohCodes: "27004, 27005, 27006, 27018, 27019", coopExt: "102, 103, 104", mobile: "098-998-4420" },
  { name: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", dohCodes: "27003, 27007, 27017", coopExt: "105, 108, 112", mobile: "098-998-1890" },
  { name: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน", dohCodes: "27011, 27012, 27013, 27023, 27024", coopExt: "207, 208, 209, 210, 211, 212", mobile: "098-998-3653" },
  { name: "ฝ่ายบริหารทั่วไป", dohCodes: "27001, 27015, 27097", coopExt: "205, 206", mobile: "061-236-3434" },
  { name: "ฝ่ายบัญชี", dohCodes: "27014, 27022", coopExt: "203, 204", mobile: "" },
];

export const DEFAULT_LINE_CONTACTS: LineData[] = [
  { name: "LINE ฝ่ายสินเชื่อ 1", lineUrl: "https://line.me/ti/p/g8Pp6RF0PU" },
  { name: "LINE ฝ่ายสินเชื่อ 2", lineUrl: "https://line.me/ti/p/l-cisnHSiQ" },
  { name: "LINE ฝ่ายการเงินและการลงทุน", lineUrl: "https://line.me/ti/p/vFLO1kRR0g" },
  { name: "LINE ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน", lineUrl: "https://line.me/ti/p/PlckMoqQ04" },
  { name: "LINE ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", lineUrl: "https://line.me/ti/p/u66nXOIiPr" },
];

/* ── แผนที่ ── */
export const MAP_QUERY = "สหกรณ์ออมทรัพย์กรมทางหลวง";
export const MAP_LINK = `https://maps.google.com/?q=${encodeURIComponent(MAP_QUERY)}`;
export const MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

/* ── ตัวช่วยจัดการค่าจากฐานข้อมูล ── */

/** ค่าบางช่องมี tab/ช่องว่างติดมาหัวท้าย — ตัดทิ้งก่อนใช้เสมอ */
export const clean = (v: string | null | undefined) => (v ?? "").trim();

/** แยกค่าที่เก็บหลายรายการในช่องเดียว เช่น "098-998-3274, 065-937-8275" */
export const splitList = (v: string | null | undefined) =>
  clean(v).split(/[,،/]/).map((s) => s.trim()).filter(Boolean);

/** ลิงก์โทรต้องเหลือแต่ตัวเลข ไม่อย่างนั้นเครื่องจะโทรออกไม่ได้ */
export const telHref = (v: string) => `tel:${v.replace(/\D/g, "")}`;

/** "08:30" / "08.30" / "8:30" → จำนวนนาทีจากเที่ยงคืน · รูปแบบเพี้ยนเมื่อไหร่ใช้ค่าสำรอง */
export function parseTime(value: string | undefined, fallback: number): number {
  const m = clean(value).match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return fallback;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return fallback;
  return hour * 60 + minute;
}

/** นาที → "08.30" (ไทยใช้จุด ไม่ใช่ทวิภาค) */
export const formatTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}.${String(minutes % 60).padStart(2, "0")}`;

/** รวมแถวโทรสารที่เลขซ้ำกันให้เหลือแถวเดียว แล้วต่อหมายเหตุเข้าด้วยกัน */
export function mergeFaxes(info: ContactInfoMap) {
  const rows = [
    { number: clean(info.fax1), note: clean(info.fax1Note) },
    { number: clean(info.fax2), note: clean(info.fax2Note) },
  ].filter((f) => f.number);

  const merged: { number: string; note: string }[] = [];
  for (const row of rows) {
    const same = merged.find((m) => m.number === row.number);
    if (same) {
      if (row.note && !same.note.includes(row.note)) {
        same.note = [same.note, row.note].filter(Boolean).join(", ");
      }
    } else {
      merged.push({ ...row });
    }
  }
  return merged;
}

/** เบอร์สำนักงานที่ไม่ใช่สายหลัก — กรองค่าว่างและค่าซ้ำออก */
export function otherPhonesOf(info: ContactInfoMap, mainPhone: string) {
  const list = [info.phone, info.phoneSub1, info.phoneSub2].map(clean).filter(Boolean);
  return Array.from(new Set(list)).filter((p) => p !== mainPhone);
}

export interface ContactData {
  info: ContactInfoMap;
  departments: DeptData[];
  lineContacts: LineData[];
}

/**
 * ดึงข้อมูลติดต่อจาก API พร้อมค่าสำรอง
 * onInfo เรียกทุกครั้งที่ได้ข้อมูลใหม่ ใช้สำหรับงานที่ต้องทำนอก React เช่นตั้งเวลาทำการ
 */
export function useContactData(onInfo?: (info: ContactInfoMap) => void): ContactData {
  const [data, setData] = useState<ContactData>({
    info: DEFAULT_CONTACT_INFO,
    departments: DEFAULT_DEPARTMENTS,
    lineContacts: DEFAULT_LINE_CONTACTS,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contact")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const info = json.info && Object.keys(json.info).length
          ? { ...DEFAULT_CONTACT_INFO, ...json.info }
          : DEFAULT_CONTACT_INFO;
        setData({
          info,
          departments: json.departments?.length ? json.departments : DEFAULT_DEPARTMENTS,
          lineContacts: json.lineContacts?.length ? json.lineContacts : DEFAULT_LINE_CONTACTS,
        });
        onInfo?.(info);
      })
      .catch(() => {
        /* ใช้ค่าสำรองต่อไป */
      });
    return () => { cancelled = true; };
    // onInfo ตั้งใจไม่ใส่ใน deps — ผู้เรียกส่ง inline function มาจะทำให้ fetch ซ้ำทุกครั้งที่ re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}
