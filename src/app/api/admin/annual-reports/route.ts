import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
/** ปี พ.ศ. ที่สมเหตุสมผล — กันพิมพ์ ค.ศ. หรือเลขผิดหลัก */
const validYear = (v: unknown) => {
  const y = Number(v);
  return Number.isInteger(y) && y >= 2500 && y <= 2700 ? y : null;
};

/** จำนวนครั้งที่เปิดอ่าน eBook แต่ละเล่มใน 12 เดือน (จากสถิติการเข้าชม /annual-reports/:id) */
async function readsByReport(): Promise<Map<number, number>> {
  try {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<{ pageUrl: string; c: bigint }[]>`
      SELECT pageUrl, COUNT(*) c FROM visit_logs
      WHERE pageUrl LIKE '/annual-reports/%' AND visitDate >= ${since}
      GROUP BY pageUrl`;
    const out = new Map<number, number>();
    for (const r of rows) {
      const id = Number(/^\/annual-reports\/(\d+)/.exec(r.pageUrl ?? "")?.[1]);
      if (id) out.set(id, (out.get(id) ?? 0) + Number(r.c));
    }
    return out;
  } catch (error) {
    console.error("Failed to count annual report reads:", error);
    return new Map();
  }
}

// GET /api/admin/annual-reports — fetch all (including inactive) + ยอดเปิดอ่าน 12 เดือน
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const [items, reads] = await Promise.all([
      prisma.annualReport.findMany({ orderBy: [{ year: "desc" }, { id: "desc" }] }),
      readsByReport(),
    ]);
    return NextResponse.json(items.map((item) => ({ ...item, reads12m: reads.get(item.id) ?? 0 })));
  } catch (error) {
    console.error("Failed to fetch annual reports:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/annual-reports — create
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const year = validYear(body.year);
    const title = text(body.title);
    const fileUrl = text(body.fileUrl);
    if (!year) return NextResponse.json({ error: "ปี พ.ศ. ไม่ถูกต้อง" }, { status: 400 });
    if (!title || !fileUrl) {
      return NextResponse.json({ error: "กรุณาระบุชื่อรายงาน และไฟล์ PDF" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const item = await prisma.annualReport.create({
      data: {
        year,
        title,
        coverUrl: text(body.coverUrl),
        fileUrl,
        legacyPath: text(body.legacyPath),
        description: text(body.description),
        isActive: body.isActive ?? true,
        updatedBy,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create annual report:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// PATCH /api/admin/annual-reports — update existing (ส่งเฉพาะช่องที่เปลี่ยน เช่น { id, isActive })
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data: Record<string, unknown> = { updatedBy };
    if (body.year !== undefined) {
      const year = validYear(body.year);
      if (!year) return NextResponse.json({ error: "ปี พ.ศ. ไม่ถูกต้อง" }, { status: 400 });
      data.year = year;
    }
    if (body.title !== undefined) {
      if (!text(body.title)) return NextResponse.json({ error: "กรุณาระบุชื่อรายงาน" }, { status: 400 });
      data.title = text(body.title);
    }
    if (body.fileUrl !== undefined) {
      if (!text(body.fileUrl)) return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์ PDF" }, { status: 400 });
      data.fileUrl = text(body.fileUrl);
    }
    if (body.coverUrl !== undefined) data.coverUrl = text(body.coverUrl);
    if (body.legacyPath !== undefined) data.legacyPath = text(body.legacyPath);
    if (body.description !== undefined) data.description = text(body.description);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const item = await prisma.annualReport.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update annual report:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE /api/admin/annual-reports?id=1
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.annualReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete annual report:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
