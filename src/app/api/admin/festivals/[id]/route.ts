import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// PUT /api/admin/festivals/[id] — อัปเดต theme
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const themeId = parseInt(id, 10);
    const body = await req.json();
    const { name, themeKey, isActive, startDate, endDate, colorPrimary, colorBg, effect, effectUrl, intensity, effectScale, effectColor, effectCount, effectDelay, animation, animationUrl, animationScale } = body;

    // ถ้าเปิด active ให้ปิด theme อื่นที่ช่วงวันซ้อนกัน
    if (isActive && startDate && endDate) {
      const parsedStart = new Date(startDate + "T00:00:00");
      const parsedEnd = new Date(endDate + "T00:00:00");
      await prisma.festivalTheme.updateMany({
        where: {
          isActive: true,
          id: { not: themeId },
          startDate: { lte: parsedEnd },
          endDate: { gte: parsedStart },
        },
        data: { isActive: false },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.userName };
    if (name !== undefined) data.name = name;
    if (themeKey !== undefined) data.themeKey = themeKey;
    if (isActive !== undefined) data.isActive = isActive;
    if (startDate !== undefined) data.startDate = new Date(startDate + "T00:00:00");
    if (endDate !== undefined) data.endDate = new Date(endDate + "T00:00:00");
    if (colorPrimary !== undefined) data.colorPrimary = colorPrimary || null;
    if (colorBg !== undefined) data.colorBg = colorBg || null;
    if (effect !== undefined) data.effect = effect;
    if (effectUrl !== undefined) data.effectUrl = effectUrl || null;
    if (intensity !== undefined) data.intensity = intensity;
    if (effectScale !== undefined) data.effectScale = effectScale;
    if (effectColor !== undefined) data.effectColor = effectColor || null;
    if (effectCount !== undefined) data.effectCount = effectCount;
    if (effectDelay !== undefined) data.effectDelay = effectDelay;
    if (animation !== undefined) data.animation = animation;
    if (animationUrl !== undefined) data.animationUrl = animationUrl || null;
    if (animationScale !== undefined) data.animationScale = animationScale;

    const theme = await prisma.festivalTheme.update({
      where: { id: themeId },
      data,
    });

    return NextResponse.json(theme);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to update festival theme:", msg, error);
    return NextResponse.json({ error: "Failed to update festival theme: " + msg }, { status: 500 });
  }
}

// DELETE /api/admin/festivals/[id] — ลบ theme
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.festivalTheme.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete festival theme:", error);
    return NextResponse.json({ error: "Failed to delete festival theme" }, { status: 500 });
  }
}
