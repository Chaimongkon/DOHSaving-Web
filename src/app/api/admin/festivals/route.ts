import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/festivals — ดึงรายการ theme ทั้งหมด
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const themes = await prisma.festivalTheme.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(themes);
  } catch (error) {
    console.error("Failed to fetch festival themes:", error);
    return NextResponse.json({ error: "Failed to fetch festival themes" }, { status: 500 });
  }
}

// POST /api/admin/festivals — สร้าง theme ใหม่
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, themeKey, isActive, startDate, endDate, colorPrimary, colorBg, effect, effectUrl, intensity, effectScale, effectColor, effectCount, effectDelay, animation, animationUrl, animationScale } = body;

    if (!name || !themeKey || !startDate || !endDate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น" }, { status: 400 });
    }

    const parsedStart = new Date(startDate + "T00:00:00");
    const parsedEnd = new Date(endDate + "T00:00:00");

    // ถ้าเปิด active ให้ปิด theme อื่นที่ช่วงวันซ้อนกัน
    if (isActive) {
      await prisma.festivalTheme.updateMany({
        where: {
          isActive: true,
          startDate: { lte: parsedEnd },
          endDate: { gte: parsedStart },
        },
        data: { isActive: false },
      });
    }

    const theme = await prisma.festivalTheme.create({
      data: {
        name,
        themeKey,
        isActive: isActive ?? false,
        startDate: parsedStart,
        endDate: parsedEnd,
        colorPrimary: colorPrimary || null,
        colorBg: colorBg || null,
        effect: effect || "none",
        effectUrl: effectUrl || null,
        intensity: intensity ?? 50,
        effectScale: effectScale ?? 50,
        effectColor: effectColor || null,
        effectCount: effectCount ?? 2,
        effectDelay: effectDelay ?? 1500,
        animation: animation || "none",
        animationUrl: animationUrl || null,
        animationScale: animationScale ?? 50,
        createdBy: user.userName,
        updatedBy: user.userName,
      },
    });

    return NextResponse.json(theme, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to create festival theme:", msg, error);
    return NextResponse.json({ error: "Failed to create festival theme: " + msg }, { status: 500 });
  }
}
