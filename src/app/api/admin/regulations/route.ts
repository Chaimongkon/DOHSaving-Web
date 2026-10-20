import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

const TYPES = ["statute", "rules", "announcements"];

const userIdOf = (user: unknown) => String((user as Record<string, unknown>).userId ?? "");
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
/** id ของฉบับเก่าที่ให้ซ่อนพร้อมกัน (ลงฉบับใหม่แทนฉบับเดิม) */
const idList = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50) : [];

// GET /api/admin/regulations — fetch all
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const items = await prisma.regulation.findMany({
      orderBy: [{ createdAt: "desc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch regulations:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/regulations — create
// typeMembers: [...] ลงเอกสารเดียวกันให้หลายกลุ่มสมาชิกในครั้งเดียว (สร้างแยกรายการต่อกลุ่ม)
// hideIds: [...] ซ่อนฉบับเก่าในการบันทึกเดียวกัน
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const title = text(body.title);
    if (!title) return NextResponse.json({ error: "กรุณาระบุชื่อเอกสาร" }, { status: 400 });
    if (!TYPES.includes(body.typeForm)) return NextResponse.json({ error: "ประเภทเอกสารไม่ถูกต้อง" }, { status: 400 });

    const members: (string | null)[] = Array.isArray(body.typeMembers)
      ? [...new Set(body.typeMembers.map(text).filter(Boolean) as string[])]
      : [text(body.typeMember)];
    if (members.length === 0) members.push(null);

    const updatedBy = userIdOf(user);
    const base = {
      title,
      typeForm: body.typeForm as string,
      filePath: text(body.filePath),
      imagePath: text(body.imagePath),
      description: text(body.description),
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive ?? true,
      createdBy: updatedBy,
      updatedBy,
    };
    const hideIds = idList(body.hideIds);

    const items = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const typeMember of members) created.push(await tx.regulation.create({ data: { ...base, typeMember } }));
      if (hideIds.length) await tx.regulation.updateMany({ where: { id: { in: hideIds } }, data: { isActive: false, updatedBy } });
      return created;
    });
    return NextResponse.json(Array.isArray(body.typeMembers) ? items : items[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create regulation:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// PATCH /api/admin/regulations — update (ส่งเฉพาะช่องที่เปลี่ยน เช่น { id, isActive } สำหรับปุ่มเผยแพร่/ซ่อน)
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (body.typeForm !== undefined && !TYPES.includes(body.typeForm)) {
      return NextResponse.json({ error: "ประเภทเอกสารไม่ถูกต้อง" }, { status: 400 });
    }
    if (body.title !== undefined && !text(body.title)) {
      return NextResponse.json({ error: "กรุณาระบุชื่อเอกสาร" }, { status: 400 });
    }

    const updatedBy = userIdOf(user);
    const data: Record<string, unknown> = { updatedBy };
    if (body.title !== undefined) data.title = text(body.title);
    if (body.typeForm !== undefined) data.typeForm = body.typeForm;
    if (body.typeMember !== undefined) data.typeMember = text(body.typeMember);
    if (body.filePath !== undefined) data.filePath = text(body.filePath);
    if (body.imagePath !== undefined) data.imagePath = text(body.imagePath);
    if (body.description !== undefined) data.description = text(body.description);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    const hideIds = idList(body.hideIds).filter((h) => h !== id);

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.regulation.update({ where: { id }, data });
      if (hideIds.length) await tx.regulation.updateMany({ where: { id: { in: hideIds } }, data: { isActive: false, updatedBy } });
      return updated;
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update regulation:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/admin/regulations?id=1
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.regulation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete regulation:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
