import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/departments
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const departments = await prisma.department.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Admin dept fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/departments — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, dohCodes, coopExt, mobile, sortOrder } = await req.json();
    if (!name) return NextResponse.json({ error: "ต้องระบุชื่อฝ่ายงาน" }, { status: 400 });

    const dept = await prisma.department.create({
      data: {
        name,
        dohCodes: dohCodes || null,
        coopExt: coopExt || null,
        mobile: mobile || null,
        sortOrder: sortOrder ?? 0,
        updatedBy: user.userName,
      },
    });
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    console.error("Admin dept create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/departments — update
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, dohCodes, coopExt, mobile, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.userName };
    if (name !== undefined) data.name = name;
    if (dohCodes !== undefined) data.dohCodes = dohCodes || null;
    if (coopExt !== undefined) data.coopExt = coopExt || null;
    if (mobile !== undefined) data.mobile = mobile || null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const dept = await prisma.department.update({ where: { id }, data });
    return NextResponse.json(dept);
  } catch (error) {
    console.error("Admin dept update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/departments?id=X
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id") || "");
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin dept delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
