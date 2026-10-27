/**
 * ลบข้อมูลส่วนบุคคลที่เกินระยะเวลาเก็บ (PDPA) — ระยะเวลาอยู่ที่ retentionPolicy.ts ใช้ร่วมกับหน้านโยบายคุกกี้
 *
 * ลบอัตโนมัติวันละครั้งต่อโปรเซส (เรียกจากเส้นทางที่มีคนเข้าบ่อย ไม่ต้องตั้ง cron บนเซิร์ฟเวอร์)
 */
import prisma from "@/lib/prisma";
import { RETENTION_YEARS } from "@/lib/retentionPolicy";
import { purgeSiteEvents } from "@/lib/siteEvents";

export { RETENTION_YEARS };

const DAY_MS = 24 * 60 * 60 * 1000;
/** ผลการลบครั้งล่าสุด — แสดงในหน้าตั้งค่าระบบ (/admin/settings) */
export const RETENTION_LAST_RUN_KEY = "retention_last_run";
let lastRun = 0;
let running = false;

export async function purgeExpiredData(): Promise<void> {
  const now = Date.now();
  if (running || now - lastRun < DAY_MS) return;
  running = true;
  lastRun = now;
  try {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
    const [visits, consents, events] = await Promise.all([
      prisma.visitLog.deleteMany({ where: { visitDate: { lt: cutoff } } }),
      // นับจากการตัดสินใจครั้งล่าสุด — คนที่ยังกลับมาเปลี่ยนใจจะถูกเก็บต่อ
      prisma.cookieConsent.deleteMany({ where: { updatedAt: { lt: cutoff } } }),
      purgeSiteEvents(cutoff),
    ]);
    if (visits.count || consents.count || events) {
      console.info(`[retention] ลบข้อมูลเกิน ${RETENTION_YEARS} ปี: visit_logs ${visits.count}, cookie_consents ${consents.count}, site_events ${events}`);
    }
    const value = JSON.stringify({ at: new Date(now).toISOString(), visits: visits.count, consents: consents.count, events });
    await prisma.siteSetting.upsert({
      where: { key: RETENTION_LAST_RUN_KEY },
      update: { value },
      create: { key: RETENTION_LAST_RUN_KEY, value, remark: "ผลการลบข้อมูลที่เกินระยะเวลาเก็บครั้งล่าสุด" },
    });
  } catch (error) {
    lastRun = 0; // ล้มเหลว → ลองใหม่ครั้งหน้า
    console.error("[retention] purge failed:", error);
  } finally {
    running = false;
  }
}
