import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { ensureSiteEventsTable } from "@/lib/siteEvents";

const DOWNLOAD_DAYS = 30;

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** ยอดเปิดดู/ดาวน์โหลดแต่ละแบบฟอร์ม 30 วันล่าสุด — นับไม่ได้ก็แค่ไม่แสดง ไม่ทำให้หน้ารายการพัง */
async function recentDownloads(): Promise<Map<number, number>> {
  try {
    await ensureSiteEventsTable();
    const since = new Date(Date.now() - DOWNLOAD_DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<{ target: string; c: bigint }[]>`
      SELECT target, COUNT(*) c FROM site_events
      WHERE type = 'form_download' AND createdAt >= ${since}
      GROUP BY target`;
    return new Map(rows.map((r) => [Number(r.target), Number(r.c)]));
  } catch (error) {
    console.error("Failed to count form downloads:", error);
    return new Map();
  }
}

// GET /api/admin/forms — fetch all (including inactive) + ยอดใช้งาน 30 วัน
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const [items, downloads] = await Promise.all([
      prisma.form.findMany({
        orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      }),
      recentDownloads(),
    ]);
    return NextResponse.json(items.map((item) => ({ ...item, downloads30: downloads.get(item.id) ?? 0 })));
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/forms — create
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const category = text(body.category);
    const group = text(body.group);
    const title = text(body.title);
    if (!category || !group || !title) {
      return NextResponse.json({ error: "กรุณาระบุประเภทสมาชิก หมวดหมู่ และชื่อแบบฟอร์ม" }, { status: 400 });
    }

    // ฉบับใหม่ต่อท้ายรายการในหมวด/ประเภทเดียวกัน (ไม่ต้องให้ผู้ใช้กรอกลำดับเอง)
    let sortOrder = Number(body.sortOrder);
    if (!Number.isFinite(sortOrder) || body.sortOrder === undefined || body.sortOrder === null) {
      const last = await prisma.form.aggregate({ where: { category, group }, _max: { sortOrder: true } });
      sortOrder = (last._max.sortOrder ?? -1) + 1;
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.form.create({
      data: {
        category,
        group,
        title,
        fileUrl: text(body.fileUrl),
        legacyPath: text(body.legacyPath),
        sortOrder,
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "forms",
      recordId: item.id,
      ipAddress,
      newValues: item,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create form:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// PATCH /api/admin/forms — update existing
//   { id, ...fields }            แก้ไขรายการเดียว (ส่งเฉพาะช่องที่เปลี่ยน เช่น { id, isActive })
//   { order: [id, id, ...] }     จัดลำดับใหม่ทั้งรายการ (ลากวาง) — ลำดับ = ตำแหน่งในอาร์เรย์
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");

    if (Array.isArray(body.order)) {
      const ids = [...new Set(body.order.map(Number).filter((n: number) => Number.isInteger(n) && n > 0))] as number[];
      if (ids.length === 0 || ids.length > 200) return NextResponse.json({ error: "ลำดับไม่ถูกต้อง" }, { status: 400 });
      await prisma.$transaction(ids.map((id, index) => prisma.form.update({ where: { id }, data: { sortOrder: index, updatedBy } })));
      await writeAuditLog({ userId: user.userId, action: "reorder", tableName: "forms", ipAddress, newValues: { order: ids } });
      return NextResponse.json({ ok: true });
    }

    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (body.title !== undefined && !text(body.title)) {
      return NextResponse.json({ error: "กรุณาระบุชื่อแบบฟอร์ม" }, { status: 400 });
    }

    const existingItem = await prisma.form.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = { updatedBy };
    if (body.category !== undefined && text(body.category)) data.category = text(body.category);
    if (body.group !== undefined && text(body.group)) data.group = text(body.group);
    if (body.title !== undefined) data.title = text(body.title);
    if (body.fileUrl !== undefined) data.fileUrl = text(body.fileUrl);
    if (body.legacyPath !== undefined) data.legacyPath = text(body.legacyPath);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    // ย้ายหมวด/ประเภท → ไปต่อท้ายรายการปลายทาง
    const moved =
      (data.category && data.category !== existingItem.category) || (data.group && data.group !== existingItem.group);
    if (moved && body.sortOrder === undefined) {
      const last = await prisma.form.aggregate({
        where: { category: String(data.category ?? existingItem.category), group: String(data.group ?? existingItem.group) },
        _max: { sortOrder: true },
      });
      data.sortOrder = (last._max.sortOrder ?? -1) + 1;
    }

    const item = await prisma.form.update({ where: { id }, data });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "forms",
      recordId: item.id,
      ipAddress,
      oldValues: existingItem,
      newValues: item,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update form:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/admin/forms?id=1
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingItem = await prisma.form.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    await prisma.form.delete({ where: { id } });

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "forms",
      recordId: id,
      ipAddress,
      oldValues: existingItem,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete form:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
