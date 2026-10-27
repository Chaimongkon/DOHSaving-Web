import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { ROLES, cleanPermissions, otherActiveAdmins, passwordProblem, userSelect } from "@/lib/adminUsers";

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

// PUT — แก้ไขข้อมูล/บทบาท/สิทธิ์ · { password } = รีเซ็ตรหัสผ่าน · { unlock: true } = ปลดล็อกบัญชี
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

    const body = await req.json().catch(() => ({}));
    const { fullName, userRole, department, phone, isActive, menuPermissions, password, unlock } = body;
    const isSelf = userId === payload.userId;

    const updateData: Record<string, unknown> = {};
    if (typeof fullName === "string") {
      if (!fullName.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
      updateData.fullName = fullName.trim();
    }
    if (userRole !== undefined) {
      if (!ROLES.includes(userRole)) return NextResponse.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
      updateData.userRole = userRole;
    }
    if (department !== undefined) updateData.department = typeof department === "string" ? department.trim() || null : null;
    if (phone !== undefined) updateData.phone = typeof phone === "string" ? phone.trim() || null : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (menuPermissions !== undefined) updateData.menuPermissions = cleanPermissions(menuPermissions);

    // กันล็อกตัวเองออก และกันระบบไม่เหลือผู้ดูแลระบบ
    const losingAdmin =
      existingUser.userRole === "admin" &&
      existingUser.isActive &&
      ((updateData.userRole !== undefined && updateData.userRole !== "admin") || updateData.isActive === false);
    if (losingAdmin && isSelf) {
      return NextResponse.json({ error: "ลดสิทธิ์หรือปิดใช้งานบัญชีตัวเองไม่ได้ ให้ผู้ดูแลระบบคนอื่นทำแทน" }, { status: 400 });
    }
    if (losingAdmin && (await otherActiveAdmins(userId)) === 0) {
      return NextResponse.json({ error: "ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน" }, { status: 400 });
    }

    if (password !== undefined && password !== "") {
      const pwError = passwordProblem(password);
      if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
      updateData.password = await hashPassword(password);
      updateData.mustChangePassword = true;
      updateData.lastPasswordChange = new Date();
      updateData.sessionToken = null;
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    if (unlock === true) {
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    if (updateData.isActive === false) {
      updateData.sessionToken = null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelect,
    });

    await writeAuditLog({
      userId: payload.userId,
      action: unlock === true ? "unlock" : password ? "reset_password" : "update",
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
    if (existingUser.userRole === "admin" && existingUser.isActive && (await otherActiveAdmins(userId)) === 0) {
      return NextResponse.json({ error: "ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน" }, { status: 400 });
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
