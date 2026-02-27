import prisma from "@/lib/prisma";

// GET /api/interest-rates — public interest rates
export async function GET() {
  try {
    const rates = await prisma.interestRate.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        interestType: true,
        name: true,
        interestDate: true,
        conditions: true,
        interestRate: true,
        interestRateDual: true,
      },
    });

    return Response.json(
      { rates },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to get interest rates:", error);
    return Response.json({ rates: [] }, { status: 500 });
  }
}
