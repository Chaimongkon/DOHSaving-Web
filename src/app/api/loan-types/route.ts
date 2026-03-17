import prisma from "@/lib/prisma";

// GET /api/loan-types — public: active loan types only
export async function GET() {
    try {
        const loanTypes = await prisma.loanType.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                name: true,
                code: true,
                category: true,
                interestRate: true,
                maxAmount: true,
                maxTerm: true,
                defaultTerm: true,
                description: true,
            },
        });

        return Response.json(
            { loanTypes },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
        );
    } catch (error) {
        console.error("Failed to get loan types:", error);
        return Response.json({ loanTypes: [] }, { status: 500 });
    }
}
