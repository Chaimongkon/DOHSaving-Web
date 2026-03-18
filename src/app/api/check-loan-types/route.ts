import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Update any existing special category loans to have proper names
        const result = await prisma.loanType.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                category: true,
                interestRate: true,
            },
            orderBy: { id: 'asc' }
        });

        return NextResponse.json({ 
            message: "Current loan types",
            loanTypes: result 
        });
    } catch (error) {
        console.error("Failed to get loan types:", error);
        return NextResponse.json({ error: "Failed to get loan types" }, { status: 500 });
    }
}
