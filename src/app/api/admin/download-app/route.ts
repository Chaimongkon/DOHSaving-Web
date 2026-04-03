import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

// GET — fetch current download app settings (single row)
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    let data = await prisma.downloadApp.findFirst();
    if (!data) {
      data = await prisma.downloadApp.create({
        data: {
          title: "ดาวน์โหลดแอป DOH Saving",
          description: "ดาวน์โหลดแอปพลิเคชัน DOH Saving เพื่อใช้บริการสหกรณ์ออมทรัพย์กรมทางหลวงได้ทุกที่ทุกเวลา",
          androidStoreUrl: "https://play.google.com/store/apps/details?id=com.dohsaving.mobile",
          iosStoreUrl: "https://apps.apple.com/th/app/id1663748261",
          huaweiStoreUrl: "https://appgallery.huawei.com/#/app/C107569233",
        },
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch download app:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PATCH — update download app settings
export async function PATCH(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();
    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");

    let existing = await prisma.downloadApp.findFirst();
    const previousValues = existing;
    if (!existing) {
      existing = await prisma.downloadApp.create({ data: { updatedBy } });
    }

    const data: Record<string, unknown> = { updatedBy };
    const fields = [
      "title", "description",
      "androidQrUrl", "androidStoreUrl",
      "iosQrUrl", "iosStoreUrl",
      "huaweiQrUrl", "huaweiStoreUrl",
      "infographicUrl", "infographic2Url",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] || null;
    }

    const updated = await prisma.downloadApp.update({
      where: { id: existing.id },
      data,
    });

    await writeAuditLog({
      userId: user.userId,
      action: previousValues ? "update" : "create",
      tableName: "download_app",
      recordId: updated.id,
      ipAddress,
      oldValues: previousValues ?? undefined,
      newValues: updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update download app:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}
