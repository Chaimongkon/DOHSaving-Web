import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// PUT /api/admin/loan-types/[id] — update loan type
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const numId = Number(id);
        if (!numId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

        const body = await req.json();
        const loanType = await prisma.loanType.update({
            where: { id: numId },
            data: {
                name: body.name,
                code: body.code,
                interestRate: body.interestRate,
                maxAmount: body.maxAmount ?? null,
                maxTerm: body.maxTerm,
                defaultTerm: body.defaultTerm,
                description: body.description ?? null,
                sortOrder: body.sortOrder ?? 0,
                isActive: body.isActive,
                updatedBy: user.fullName || user.userName,
            },
        });
        return NextResponse.json({ loanType });
    } catch (error) {
        console.error("Failed to update loan type:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE /api/admin/loan-types/[id] — delete
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const numId = Number(id);
        if (!numId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

        await prisma.loanType.delete({ where: { id: numId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to delete loan type:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
