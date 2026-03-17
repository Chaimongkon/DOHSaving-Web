import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/loan-types — list all (including inactive)
export async function GET(req: NextRequest) {
    const user = authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const loanTypes = await prisma.loanType.findMany({
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });
        return NextResponse.json({ loanTypes });
    } catch (error) {
        console.error("Failed to get loan types:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// POST /api/admin/loan-types — create new loan type
export async function POST(req: NextRequest) {
    const user = authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const loanType = await prisma.loanType.create({
            data: {
                name: body.name || "",
                code: body.code || "",
                interestRate: body.interestRate || 0,
                maxAmount: body.maxAmount || null,
                maxTerm: body.maxTerm || 12,
                defaultTerm: body.defaultTerm || 12,
                description: body.description || null,
                sortOrder: body.sortOrder || 0,
                isActive: body.isActive !== false,
                createdBy: user.fullName || user.userName,
                updatedBy: user.fullName || user.userName,
            },
        });
        return NextResponse.json({ loanType });
    } catch (error) {
        console.error("Failed to create loan type:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE /api/admin/loan-types?id=... — delete by id
export async function DELETE(req: NextRequest) {
    const user = authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = Number(searchParams.get("id"));
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await prisma.loanType.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to delete loan type:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
