import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { meetingDocKind, meetingDocOrder } from "@/lib/meetingDocs";

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
/** ปี พ.ศ. ที่สมเหตุสมผล — กันพิมพ์ ค.ศ. หรือเลขผิดหลัก */
const validYear = (v: unknown) => {
  const y = Number(v);
  return Number.isInteger(y) && y >= 2500 && y <= 2700 ? y : null;
};

/** จำนวนครั้งที่เปิดหน้าเอกสารประชุมใหญ่บนเว็บ 12 เดือน */
async function pageViews12m(): Promise<number> {
  try {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) c FROM visit_logs WHERE pageUrl LIKE '/reports/annual-meeting%' AND visitDate >= ${since}`;
    return Number(rows[0]?.c ?? 0);
  } catch (error) {
    console.error("Failed to count meeting page views:", error);
    return 0;
  }
}

// GET /api/admin/meeting-documents — { items (รวมที่ซ่อน), pageViews12m }
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const [items, views] = await Promise.all([
      prisma.meetingDocument.findMany({
        orderBy: [{ year: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      pageViews12m(),
    ]);
    return NextResponse.json({ items, pageViews12m: views });
  } catch (error) {
    console.error("Failed to fetch meeting documents:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/meeting-documents — create (ลำดับตั้งจากประเภทเอกสารอัตโนมัติ)
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const year = validYear(body.year);
    const title = text(body.title);
    const fileUrl = text(body.fileUrl);
    if (!year) return NextResponse.json({ error: "ปี พ.ศ. ไม่ถูกต้อง" }, { status: 400 });
    if (!title || !fileUrl) {
      return NextResponse.json({ error: "กรุณาระบุชื่อเอกสาร และไฟล์ PDF" }, { status: 400 });
    }
    const category = meetingDocKind(body.category);

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.meetingDocument.create({
      data: {
        year,
        title,
        fileUrl,
        coverUrl: text(body.coverUrl),
        category,
        sortOrder: meetingDocOrder(category),
        description: text(body.description),
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "meeting_documents",
      recordId: item.id,
      ipAddress,
      newValues: item,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting document:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// PATCH /api/admin/meeting-documents — update existing (ส่งเฉพาะช่องที่เปลี่ยน เช่น { id, isActive })
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingItem = await prisma.meetingDocument.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Meeting document not found" }, { status: 404 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.year !== undefined) {
      const year = validYear(body.year);
      if (!year) return NextResponse.json({ error: "ปี พ.ศ. ไม่ถูกต้อง" }, { status: 400 });
      data.year = year;
    }
    if (body.title !== undefined) {
      if (!text(body.title)) return NextResponse.json({ error: "กรุณาระบุชื่อเอกสาร" }, { status: 400 });
      data.title = text(body.title);
    }
    if (body.fileUrl !== undefined) {
      if (!text(body.fileUrl)) return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์ PDF" }, { status: 400 });
      data.fileUrl = text(body.fileUrl);
    }
    if (body.coverUrl !== undefined) data.coverUrl = text(body.coverUrl);
    if (body.category !== undefined) {
      data.category = meetingDocKind(body.category);
      data.sortOrder = meetingDocOrder(body.category);
    }
    if (body.description !== undefined) data.description = text(body.description);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const item = await prisma.meetingDocument.update({ where: { id }, data });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "meeting_documents",
      recordId: item.id,
      ipAddress,
      oldValues: existingItem,
      newValues: item,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update meeting document:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/admin/meeting-documents?id=1
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingItem = await prisma.meetingDocument.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Meeting document not found" }, { status: 404 });
    }

    await prisma.meetingDocument.delete({ where: { id } });

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "meeting_documents",
      recordId: id,
      ipAddress,
      oldValues: existingItem,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meeting document:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
