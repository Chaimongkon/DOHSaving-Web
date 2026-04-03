import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { key } = await params;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `page_${key}` },
    });

    return NextResponse.json({
      key,
      content: setting?.value || "",
      remark: setting?.remark || "",
      updatedAt: setting?.updatedAt || null,
    });
  } catch (error) {
    console.error("Failed to fetch page content:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  const { key } = await params;

  try {
    const ipAddress = getAuditIpAddress(req);
    const existingSetting = await prisma.siteSetting.findUnique({
      where: { key: `page_${key}` },
    });
    const body = await req.json();
    const { content, remark } = body;

    const setting = await prisma.siteSetting.upsert({
      where: { key: `page_${key}` },
      create: {
        key: `page_${key}`,
        value: content || "",
        remark: remark || `เนื้อหาหน้า ${key}`,
      },
      update: {
        value: content || "",
        ...(remark !== undefined && { remark }),
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: existingSetting ? "update" : "create",
      tableName: "site_settings",
      recordId: setting.id,
      ipAddress,
      oldValues: existingSetting ?? undefined,
      newValues: setting,
    });

    return NextResponse.json({
      key,
      content: setting.value,
      updatedAt: setting.updatedAt,
    });
  } catch (error) {
    console.error("Failed to save page content:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}