import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/line-contacts
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contacts = await prisma.lineContact.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Admin LINE fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/line-contacts — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, lineUrl, sortOrder } = await req.json();
    if (!name || !lineUrl) return NextResponse.json({ error: "ต้องระบุชื่อและ URL" }, { status: 400 });

    const contact = await prisma.lineContact.create({
      data: { name, lineUrl, sortOrder: sortOrder ?? 0, updatedBy: user.userName },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Admin LINE create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/line-contacts — update
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, lineUrl, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.userName };
    if (name !== undefined) data.name = name;
    if (lineUrl !== undefined) data.lineUrl = lineUrl;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const contact = await prisma.lineContact.update({ where: { id }, data });
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Admin LINE update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/line-contacts?id=X
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id") || "");
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.lineContact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin LINE delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
