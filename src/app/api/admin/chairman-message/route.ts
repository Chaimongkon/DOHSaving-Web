import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_chairman_message";

export interface ChairmanMessageData {
  portraitUrl: string;
  messageUrl: string;
  name: string;
  title: string;
}

// GET /api/admin/chairman-message
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const data: ChairmanMessageData = setting?.value
      ? JSON.parse(setting.value)
      : { portraitUrl: "", messageUrl: "", name: "", title: "" };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch chairman message:", error);
    return NextResponse.json(
      { portraitUrl: "", messageUrl: "", name: "", title: "" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/chairman-message
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ChairmanMessageData;

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(body),
        remark: "สารจากประธานกรรมการดำเนินการ",
      },
      update: {
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save chairman message:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
