import prisma from "@/lib/prisma";
import { type DocMeta, normalizeDocMeta, parseDocMeta } from "@/lib/docMeta";

/**
 * อ่าน/เขียนเอกสารกำกับดูแล (นโยบาย / จรรยาบรรณ) จาก siteSetting
 *
 * รายการข้อเก็บที่ key เดิม เช่น "page_ethics_staff_items"
 * ส่วนที่มาของเอกสารเก็บแยกอีก key คือ "page_ethics_staff_meta"
 * แยกกันเพื่อไม่ต้องแก้ shape ของข้อมูลเดิมที่หน้า Admin ใช้อยู่
 */

export const metaKeyFor = (itemsKey: string): string =>
  itemsKey.replace(/_items$/, "") + "_meta";

function parseItems(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function readGovernanceDoc(
  itemsKey: string
): Promise<{ items: unknown[]; meta: DocMeta }> {
  const [itemsRow, metaRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: itemsKey } }),
    prisma.siteSetting.findUnique({ where: { key: metaKeyFor(itemsKey) } }),
  ]);

  return {
    items: parseItems(itemsRow?.value),
    meta: parseDocMeta(metaRow?.value),
  };
}

export async function writeGovernanceDoc(
  itemsKey: string,
  items: unknown,
  meta: unknown,
  remark: string
): Promise<{ items: unknown[]; meta: DocMeta }> {
  const safeItems = Array.isArray(items) ? items : [];
  const safeMeta = normalizeDocMeta(meta);
  const itemsValue = JSON.stringify(safeItems);
  const metaValue = JSON.stringify(safeMeta);

  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: itemsKey },
      create: { key: itemsKey, value: itemsValue, remark },
      update: { value: itemsValue },
    }),
    prisma.siteSetting.upsert({
      where: { key: metaKeyFor(itemsKey) },
      create: { key: metaKeyFor(itemsKey), value: metaValue, remark: `${remark} — ที่มาของเอกสาร` },
      update: { value: metaValue },
    }),
  ]);

  return { items: safeItems, meta: safeMeta };
}
