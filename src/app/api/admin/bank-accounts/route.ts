import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/bank-accounts
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const banks = await prisma.bankAccount.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(banks);
  } catch (error) {
    console.error("Admin bank fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/bank-accounts — create
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { bankName, bankNameSub, accountNumber, accountType, brandColor, abbr, sortOrder } = await req.json();
    if (!bankName || !accountNumber) {
      return NextResponse.json({ error: "ต้องระบุชื่อธนาคารและเลขบัญชี" }, { status: 400 });
    }

    const bank = await prisma.bankAccount.create({
      data: {
        bankName,
        bankNameSub: bankNameSub || null,
        accountNumber,
        accountType: accountType || "ออมทรัพย์",
        brandColor: brandColor || "#1a2d4a",
        abbr: abbr || null,
        sortOrder: sortOrder ?? 0,
        updatedBy: user.userName,
      },
    });
    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error("Admin bank create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/bank-accounts — update
export async function PATCH(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, bankName, bankNameSub, accountNumber, accountType, brandColor, abbr, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.userName };
    if (bankName !== undefined) data.bankName = bankName;
    if (bankNameSub !== undefined) data.bankNameSub = bankNameSub || null;
    if (accountNumber !== undefined) data.accountNumber = accountNumber;
    if (accountType !== undefined) data.accountType = accountType;
    if (brandColor !== undefined) data.brandColor = brandColor;
    if (abbr !== undefined) data.abbr = abbr || null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const bank = await prisma.bankAccount.update({ where: { id }, data });
    return NextResponse.json(bank);
  } catch (error) {
    console.error("Admin bank update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/bank-accounts?id=X
export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(new URL(req.url).searchParams.get("id") || "");
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.bankAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin bank delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
