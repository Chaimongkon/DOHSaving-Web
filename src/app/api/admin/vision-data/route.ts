import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_vision_data";

export interface MissionItem {
  id: string;
  text: string;
}

export interface VisionData {
  coreValues: string;
  vision: string;
  missions: MissionItem[];
}

// GET /api/admin/vision-data
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const data: VisionData = setting?.value
      ? JSON.parse(setting.value)
      : { coreValues: "", vision: "", missions: [] };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch vision data:", error);
    return NextResponse.json(
      { coreValues: "", vision: "", missions: [] },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vision-data
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as VisionData;

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(body),
        remark: "ค่านิยม วิสัยทัศน์ พันธกิจ",
      },
      update: {
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save vision data:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
