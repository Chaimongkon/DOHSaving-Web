import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  try {
    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const { fullName, userName, password, userRole, department, phone, menuPermissions } = body;

    if (!userName || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { userName } });
    if (existing) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        userName,
        password: hashedPassword,
        userRole: userRole || "editor",
        department,
        phone,
        menuPermissions: menuPermissions || [],
      },
      select: {
        id: true,
        fullName: true,
        userName: true,
        userRole: true,
        department: true,
        menuPermissions: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      userId: payload.userId,
      action: "create",
      tableName: "users",
      recordId: user.id,
      ipAddress,
      newValues: user,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}