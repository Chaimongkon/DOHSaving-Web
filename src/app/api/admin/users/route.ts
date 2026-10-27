import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { ROLES, USERNAME_PATTERN, cleanPermissions, passwordProblem, userSelect } from "@/lib/adminUsers";

// GET /api/admin/users — รายชื่อผู้ใช้ + id ของผู้ที่กำลังใช้งาน (ใช้กันแก้บัญชีตัวเองผิดพลาด)
export async function GET(req: NextRequest) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  try {
    const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ users, currentUserId: payload.userId });
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
    const body = await req.json().catch(() => ({}));
    const userName = typeof body.userName === "string" ? body.userName.trim().toLowerCase() : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const userRole = ROLES.includes(body.userRole) ? body.userRole : "editor";

    if (!fullName) return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
    if (!USERNAME_PATTERN.test(userName)) {
      return NextResponse.json({ error: "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–50 ตัว" }, { status: 400 });
    }
    const pwError = passwordProblem(body.password);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { userName } });
    if (existing) return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        fullName,
        userName,
        password: await hashPassword(body.password),
        userRole,
        department: typeof body.department === "string" ? body.department.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        isActive: body.isActive !== false,
        menuPermissions: userRole === "admin" ? [] : cleanPermissions(body.menuPermissions),
        // รหัสผ่านที่ผู้ดูแลตั้งให้ = รหัสชั่วคราว
        mustChangePassword: true,
      },
      select: userSelect,
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
