import prisma from "@/lib/prisma";

// GET /api/bank-accounts — public: fetch active bank accounts
export async function GET() {
  try {
    const banks = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return Response.json(banks);
  } catch (error) {
    console.error("Bank accounts fetch error:", error);
    return Response.json([], { status: 500 });
  }
}
