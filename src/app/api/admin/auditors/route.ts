import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_auditors";

export interface Auditor {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  order: number;
}

// GET /api/admin/auditors
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const auditors: Auditor[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ auditors });
  } catch (error) {
    console.error("Failed to fetch auditors:", error);
    return NextResponse.json({ auditors: [] }, { status: 500 });
  }
}

// PUT /api/admin/auditors — bulk save
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { auditors } = body as { auditors: Auditor[] };

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(auditors || []),
        remark: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ",
      },
      update: { value: JSON.stringify(auditors || []) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save auditors:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
