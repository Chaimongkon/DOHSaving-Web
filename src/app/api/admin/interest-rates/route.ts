import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

// GET /api/admin/interest-rates — list all (including inactive)
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const rates = await prisma.interestRate.findMany({
      orderBy: [{ interestType: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Failed to get interest rates:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/interest-rates — create or bulk update
export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const body = await req.json();

    // Bulk update mode: { rates: [...] }
    if (Array.isArray(body.rates)) {
      const ids = body.rates
        .map((rate: Record<string, unknown>) => rate.id)
        .filter((id: unknown): id is number => typeof id === "number");
      const existingRates = ids.length > 0
        ? await prisma.interestRate.findMany({ where: { id: { in: ids } } })
        : [];
      const existingById = new Map(existingRates.map((rate) => [rate.id, rate]));

      const ops = body.rates.map((r: Record<string, unknown>) => {
        const data = {
          interestType: r.interestType as string || "deposit",
          name: r.name as string || "",
          interestDate: r.interestDate ? new Date(r.interestDate as string) : null,
          conditions: (r.conditions as string) || null,
          interestRate: (r.interestRate as string) || null,
          interestRateDual: (r.interestRateDual as string) || null,
          isActive: r.isActive !== false,
          updatedBy: user.fullName || user.userName,
        };

        if (r.id && typeof r.id === "number") {
          return prisma.interestRate.update({
            where: { id: r.id },
            data,
          });
        } else {
          return prisma.interestRate.create({
            data: {
              ...data,
              createdBy: user.fullName || user.userName,
            },
          });
        }
      });

      const rates = await prisma.$transaction(ops);

      await Promise.all(
        rates.map((rate) =>
          writeAuditLog({
            userId: user.userId,
            action: existingById.has(rate.id) ? "update" : "create",
            tableName: "interest_rates",
            recordId: rate.id,
            ipAddress,
            oldValues: existingById.get(rate.id),
            newValues: rate,
          })
        )
      );

      return NextResponse.json({ ok: true });
    }

    // Single create
    const rate = await prisma.interestRate.create({
      data: {
        interestType: body.interestType || "deposit",
        name: body.name || "",
        interestDate: body.interestDate ? new Date(body.interestDate) : null,
        conditions: body.conditions || null,
        interestRate: body.interestRate || null,
        interestRateDual: body.interestRateDual || null,
        isActive: body.isActive !== false,
        createdBy: user.fullName || user.userName,
        updatedBy: user.fullName || user.userName,
      },
    });

    await writeAuditLog({
      userId: user.userId,
      action: "create",
      tableName: "interest_rates",
      recordId: rate.id,
      ipAddress,
      newValues: rate,
    });

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Failed to save interest rate:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/interest-rates — delete by id
export async function DELETE(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) return user;

  try {
    const ipAddress = getAuditIpAddress(req);
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existingRate = await prisma.interestRate.findUnique({ where: { id } });
    if (!existingRate) {
      return NextResponse.json({ error: "Interest rate not found" }, { status: 404 });
    }

    await prisma.interestRate.delete({ where: { id } });

    await writeAuditLog({
      userId: user.userId,
      action: "delete",
      tableName: "interest_rates",
      recordId: id,
      ipAddress,
      oldValues: existingRate,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete interest rate:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
