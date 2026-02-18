import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_ethics_board_items";

export interface EthicsBoardItem {
  id: string;
  text: string;
}

// GET /api/admin/ethics-board-items
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const items: EthicsBoardItem[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch ethics-board items:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

// PUT /api/admin/ethics-board-items
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items } = body as { items: EthicsBoardItem[] };

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(items || []),
        remark: "จรรยาบรรณคณะกรรมการ",
      },
      update: {
        value: JSON.stringify(items || []),
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Failed to save ethics-board items:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
