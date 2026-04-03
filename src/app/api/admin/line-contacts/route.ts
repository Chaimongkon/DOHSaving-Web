import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

// GET /api/admin/line-contacts
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const contacts = await prisma.lineContact.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Admin LINE fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/line-contacts - create
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const { name, lineUrl, sortOrder } = await req.json();
    if (!name || !lineUrl) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const contact = await prisma.lineContact.create({
      data: { name, lineUrl, sortOrder: sortOrder ?? 0, updatedBy: user.userName },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "line_contacts",
      recordId: contact.id,
      ipAddress,
      newValues: contact,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Admin LINE create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/line-contacts - update
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const { id, name, lineUrl, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const existingContact = await prisma.lineContact.findUnique({ where: { id } });
    if (!existingContact) {
      return NextResponse.json({ error: "LINE contact not found" }, { status: 404 });
    }

    const data: {
      updatedBy: string;
      name?: string;
      lineUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
    } = { updatedBy: user.userName };

    if (name !== undefined) data.name = name;
    if (lineUrl !== undefined) data.lineUrl = lineUrl;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const contact = await prisma.lineContact.update({ where: { id }, data });

    await writeAuditLog({
      userId: user.userId,
      action: "update",
      tableName: "line_contacts",
      recordId: contact.id,
      ipAddress,
      oldValues: existingContact,
      newValues: contact,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Admin LINE update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/line-contacts?id=X
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const id = parseInt(new URL(req.url).searchParams.get("id") || "", 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existingContact = await prisma.lineContact.findUnique({ where: { id } });
    if (!existingContact) {
      return NextResponse.json({ error: "LINE contact not found" }, { status: 404 });
    }

    await prisma.lineContact.delete({ where: { id } });

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "line_contacts",
      recordId: id,
      ipAddress,
      oldValues: existingContact,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin LINE delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
