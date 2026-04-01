import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

const userSelect = {
  id: true,
  fullName: true,
  userName: true,
  userRole: true,
  department: true,
  phone: true,
  isActive: true,
  menuPermissions: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const { id } = await params;
  const userId = Number(id);

  try {
    const ipAddress = getAuditIpAddress(req);
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!existingUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const body = await req.json();
    const { fullName, userRole, department, phone, isActive, menuPermissions, password } = body;

    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (userRole !== undefined) updateData.userRole = userRole;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (menuPermissions !== undefined) updateData.menuPermissions = menuPermissions;

    if (password && password.trim()) {
      updateData.password = await hashPassword(password);
      updateData.mustChangePassword = true;
      updateData.sessionToken = null;
    }

    if (isActive === false) {
      updateData.sessionToken = null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelect,
    });

    await writeAuditLog({
      userId: payload.userId,
      action: "update",
      tableName: "users",
      recordId: user.id,
      ipAddress,
      oldValues: existingUser,
      newValues: user,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const { id } = await params;
  const userId = Number(id);

  if (userId === payload.userId) {
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีตัวเองได้" },
      { status: 400 }
    );
  }

  try {
    const ipAddress = getAuditIpAddress(req);
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!existingUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });

    await writeAuditLog({
      userId: payload.userId,
      action: "delete",
      tableName: "users",
      recordId: userId,
      ipAddress,
      oldValues: existingUser,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}