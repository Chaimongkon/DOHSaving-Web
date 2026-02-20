import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/financial-summary — fetch all (with inactive)
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.financialSummary.findMany({
      orderBy: [{ year: "desc" }, { month: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch financial summaries:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/financial-summary — create or upsert
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const year = Number(body.year);
    const month = Number(body.month);
    if (!year || !month) {
      return NextResponse.json({ error: "กรุณาระบุปีและเดือน" }, { status: 400 });
    }

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data = {
      title: body.title || null,
      fileUrl: body.fileUrl || null,
      totalAssets: body.totalAssets ?? null,
      totalLiabilities: body.totalLiabilities ?? null,
      totalEquity: body.totalEquity ?? null,
      totalMembers: body.totalMembers ?? null,
      isActive: body.isActive ?? true,
      updatedBy,
    };

    const item = await prisma.financialSummary.upsert({
      where: { year_month: { year, month } },
      create: { year, month, ...data },
      update: data,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create financial summary:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/financial-summary — update existing
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updatedBy = String((user as unknown as Record<string, unknown>).userId ?? "");
    const data = {
      year: body.year ? Number(body.year) : undefined,
      month: body.month ? Number(body.month) : undefined,
      title: body.title || null,
      fileUrl: body.fileUrl || null,
      totalAssets: body.totalAssets ?? null,
      totalLiabilities: body.totalLiabilities ?? null,
      totalEquity: body.totalEquity ?? null,
      totalMembers: body.totalMembers ?? null,
      isActive: body.isActive ?? true,
      updatedBy,
    };

    const item = await prisma.financialSummary.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update financial summary:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/financial-summary?id=1
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.financialSummary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete financial summary:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
