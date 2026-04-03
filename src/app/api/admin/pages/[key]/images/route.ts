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
      where: { key: `page_${key}_image` },
    });

    let images: string[] = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (typeof parsed === "string") {
          images = [parsed];
        }
      } catch {
        images = setting.value ? [setting.value] : [];
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return NextResponse.json({ images: [] }, { status: 500 });
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
      where: { key: `page_${key}_image` },
    });
    const body = await req.json();
    const { images } = body as { images: string[] };

    const setting = await prisma.siteSetting.upsert({
      where: { key: `page_${key}_image` },
      create: {
        key: `page_${key}_image`,
        value: JSON.stringify(images || []),
        remark: `รูป infographic หน้า ${key}`,
      },
      update: {
        value: JSON.stringify(images || []),
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

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Failed to save image:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}