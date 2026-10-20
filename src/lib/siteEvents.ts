/**
 * บันทึกเหตุการณ์ใช้งาน (ดาวน์โหลดแบบฟอร์ม · หมวดที่เปิด · ค้นหาไม่เจอ) — ฝั่งเซิร์ฟเวอร์เท่านั้น
 *
 * เก็บแค่ "อะไรถูกใช้" ไม่เก็บ IP/อุปกรณ์/ตัวตน จึงไม่ต้องรอความยินยอมคุกกี้
 * ตารางสร้างเองครั้งแรกที่ใช้ (ไม่ต้องรัน prisma db push ตอน deploy) แบบเดียวกับ rateLimit.ts
 */
import prisma from "@/lib/prisma";
import type { SiteEventType } from "@/lib/siteEventTypes";

const TABLE_NAME = "site_events";

let initTablePromise: Promise<void> | null = null;

export async function ensureSiteEventsTable() {
  if (!initTablePromise) {
    initTablePromise = prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id BIGINT NOT NULL AUTO_INCREMENT,
        type VARCHAR(30) NOT NULL,
        target VARCHAR(191) NOT NULL,
        meta VARCHAR(100) NULL,
        createdAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        KEY site_events_type_created_idx (type, createdAt),
        KEY site_events_created_idx (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).then(() => undefined).catch((error) => {
      initTablePromise = null;
      throw error;
    });
  }

  await initTablePromise;
}

export async function recordSiteEvent(type: SiteEventType, target: string, meta: string | null = null) {
  await ensureSiteEventsTable();
  await prisma.$executeRaw`
    INSERT INTO site_events (type, target, meta, createdAt)
    VALUES (${type}, ${target}, ${meta}, UTC_TIMESTAMP(3))
  `;
}

/** ลบเหตุการณ์ที่เก่ากว่า cutoff (เรียกจาก retention.ts) */
export async function purgeSiteEvents(cutoff: Date): Promise<number> {
  await ensureSiteEventsTable();
  return prisma.$executeRaw`DELETE FROM site_events WHERE createdAt < ${cutoff}`;
}
