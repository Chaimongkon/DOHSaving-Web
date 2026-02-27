import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/auth/me — ดึงข้อมูล user ปัจจุบัน
export async function GET(req: NextRequest) {
  const payload = authenticateRequest(req);

  if (!payload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Auth me error:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
