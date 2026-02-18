import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_ethics_staff_items";

export interface EthicsStaffItem {
  id: string;
  text: string;
}

// GET /api/admin/ethics-staff-items
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const items: EthicsStaffItem[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch ethics-staff items:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

// PUT /api/admin/ethics-staff-items
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body as { items: EthicsStaffItem[] };

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(items || []),
        remark: "จรรยาบรรณเจ้าหน้าที่",
      },
      update: {
        value: JSON.stringify(items || []),
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Failed to save ethics-staff items:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
