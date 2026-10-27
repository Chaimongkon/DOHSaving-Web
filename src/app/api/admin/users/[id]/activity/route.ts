import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { ACTION_LABELS, TABLE_LABELS } from "@/lib/auditLabels";

const LIMIT = 40;

// GET /api/admin/users/:id/activity — ประวัติล่าสุดของผู้ใช้ (ผู้ดูแลระบบเท่านั้น)
//   ผู้ใช้ทำอะไร (เข้าสู่ระบบ แก้ไขเนื้อหา) + ผู้ดูแลระบบทำอะไรกับบัญชีนี้ (รีเซ็ตรหัสผ่าน แก้สิทธิ์)
//   รายการเดียวกันที่ติดกัน (เช่น อัปโหลดไฟล์ 10 ครั้ง) รวมเป็นแถวเดียว
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAdmin(req);
  if (payload instanceof NextResponse) return payload;

  const userId = Number((await params).id);
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId },
          // ผู้ดูแลระบบคนอื่นแก้บัญชีนี้ (การกระทำของเจ้าของบัญชีเองอยู่ในเงื่อนไขแรกแล้ว)
          { tableName: "users", recordId: userId, userId: { not: userId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        userId: true,
        action: true,
        tableName: true,
        ipAddress: true,
        createdAt: true,
        user: { select: { fullName: true, userName: true } },
      },
    });

    const items: {
      id: number;
      at: string;
      action: string;
      label: string;
      section: string;
      by: string | null;
      ip: string | null;
      count: number;
      kind: "self" | "account";
    }[] = [];

    for (const log of logs) {
      const onAccount = log.userId !== userId;
      const by = onAccount ? log.user?.fullName || log.user?.userName || "ระบบ" : null;
      const label = ACTION_LABELS[log.action] ?? log.action;
      const section = log.tableName === "auth_sessions" ? "" : TABLE_LABELS[log.tableName] ?? log.tableName;
      const prev = items[items.length - 1];
      if (prev && prev.action === log.action && prev.section === section && prev.by === by && log.action !== "login_success") {
        prev.count += 1;
        continue;
      }
      if (items.length === LIMIT) break;
      items.push({
        id: log.id,
        at: log.createdAt.toISOString(),
        action: log.action,
        label,
        section,
        by,
        ip: log.tableName === "auth_sessions" ? log.ipAddress : null,
        count: 1,
        kind: onAccount ? "account" : "self",
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("User activity error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
