import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/auth/me — ดึงข้อมูล user ปัจจุบัน
export async function GET(req: NextRequest) {
  const payload = authenticateRequest(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        userName: true,
        fullName: true,
        userRole: true,
        avatarPath: true,
        department: true,
        phone: true,
        menuPermissions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
