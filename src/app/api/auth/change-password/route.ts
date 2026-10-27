import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest, comparePassword, hashPassword } from "@/lib/auth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import { consumeRateLimit } from "@/lib/rateLimit";
import { passwordProblem } from "@/lib/adminUsers";

// POST /api/auth/change-password { currentPassword, newPassword } — ผู้ใช้เปลี่ยนรหัสผ่านของตัวเอง
// ใช้ได้แม้ยังต้องเปลี่ยนรหัสชั่วคราว (ไม่ผ่าน requireAdmin*) · เซสชันปัจจุบันยังใช้ต่อได้
export async function POST(req: NextRequest) {
  const payload = await authenticateRequest(req);
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // กันเดารหัสผ่านปัจจุบัน ด้วยเซสชันที่ค้างอยู่ในเครื่องคนอื่น
    const limit = await consumeRateLimit({ scope: "change-password", identifier: String(payload.userId), limit: 5, windowSeconds: 15 * 60 });
    if (limit.limited) {
      return Response.json({ error: "ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, userName: true, password: true },
    });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await comparePassword(currentPassword, user.password))) {
      return Response.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง", field: "currentPassword" }, { status: 400 });
    }
    const problem = passwordProblem(newPassword);
    if (problem) return Response.json({ error: problem, field: "newPassword" }, { status: 400 });
    if (newPassword.toLowerCase().includes(user.userName.toLowerCase())) {
      return Response.json({ error: "รหัสผ่านต้องไม่มีชื่อผู้ใช้อยู่ในนั้น", field: "newPassword" }, { status: 400 });
    }
    if (await comparePassword(newPassword, user.password)) {
      return Response.json({ error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม", field: "newPassword" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPassword),
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        tempPassword: null,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "change_password",
      tableName: "users",
      recordId: user.id,
      ipAddress: getAuditIpAddress(req),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
