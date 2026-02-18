import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DB_KEY = "page_chairman_message";

// GET /api/chairman-message — public
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const data = setting?.value
      ? JSON.parse(setting.value)
      : { portraitUrl: "", messageUrl: "", name: "", title: "" };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch chairman message:", error);
    return NextResponse.json(
      { portraitUrl: "", messageUrl: "", name: "", title: "" },
      { status: 500 }
    );
  }
}
