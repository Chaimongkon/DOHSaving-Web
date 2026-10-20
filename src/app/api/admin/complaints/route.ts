import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

// ─── XSS Sanitizer ───
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// GET /api/admin/complaints — list all complaints
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    // status: "" = ทั้งหมด · "open" = ยังไม่ปิดเรื่อง (รอดำเนินการ + กำลังตรวจสอบ) · หรือสถานะเดียว
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20") || 20));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base: any = {};
    if (search) {
      base.OR = [
        { trackingCode: { contains: search } },
        { name: { contains: search } },
        { subject: { contains: search } },
        { memberId: { contains: search } },
        { tel: { contains: search } },
      ];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ...base };
    if (status === "open") where.status = { in: ["pending", "reviewing"] };
    else if (status) where.status = status;

    const [complaints, total, grouped] = await Promise.all([
      prisma.complaint.findMany({
        where,
        // เรื่องที่ยังไม่ปิด: เก่าสุดขึ้นก่อน (รอนานที่สุดต้องทำก่อน) · อื่น ๆ: ใหม่สุดก่อน
        orderBy: { createdAt: status === "open" || status === "pending" ? "asc" : "desc" },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
      prisma.complaint.groupBy({ by: ["status"], where: base, _count: true }),
    ]);

    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<string, number>;
    const counts = {
      all: grouped.reduce((n, g) => n + g._count, 0),
      open: (byStatus.pending ?? 0) + (byStatus.reviewing ?? 0),
      pending: byStatus.pending ?? 0,
      reviewing: byStatus.reviewing ?? 0,
      resolved: byStatus.resolved ?? 0,
      rejected: byStatus.rejected ?? 0,
    };

    return NextResponse.json({
      complaints,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    console.error("Admin complaints error:", error);
    return NextResponse.json({ complaints: [], total: 0 }, { status: 500 });
  }
}

// PATCH /api/admin/complaints — update complaint status / admin note
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Validate status whitelist
    const allowedStatuses = ["pending", "reviewing", "resolved", "rejected"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (status) data.status = status;
    if (adminNote !== undefined) data.adminNote = sanitize(adminNote).slice(0, 2000);
    // resolvedAt = วันที่ปิดเรื่อง (ทั้งเสร็จสิ้นและไม่รับพิจารณา) — ผู้แจ้งเห็นในหน้าติดตามสถานะ
    if (status === "resolved" || status === "rejected") data.resolvedAt = new Date();
    else if (status) data.resolvedAt = null;

    const complaint = await prisma.complaint.update({
      where: { id },
      data,
    });

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Admin complaint update error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/complaints — delete complaint
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.complaint.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin complaint delete error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
