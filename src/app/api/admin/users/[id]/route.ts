import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/users/[id] — ดึงข้อมูลผู้ใช้รายคน
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
      select: {
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
      },
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

// PUT /api/admin/users/[id] — แก้ไขผู้ใช้
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const { id } = await params;

  try {
    const body = await req.json();
    const { fullName, userRole, department, phone, isActive, menuPermissions, password } = body;

    const updateData: Record<string, unknown> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (userRole !== undefined) updateData.userRole = userRole;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (menuPermissions !== undefined) updateData.menuPermissions = menuPermissions;

    // ถ้าส่ง password มาด้วย ให้ hash ใหม่
    if (password && password.trim()) {
      updateData.password = await hashPassword(password);
      updateData.mustChangePassword = true;
      updateData.sessionToken = null;
    }

    if (isActive === false) {
      updateData.sessionToken = null;
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        userName: true,
        userRole: true,
        department: true,
        phone: true,
        isActive: true,
        menuPermissions: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — ลบผู้ใช้
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const { id } = await params;
  const userId = Number(id);

  // ห้ามลบตัวเอง
  if (userId === payload.userId) {
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีตัวเองได้" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
