import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Check database connectivity
        await prisma.$queryRawUnsafe("SELECT 1");

        return Response.json({ status: "healthy" }, { status: 200 });
    } catch (error) {
        console.error("Health check failed:", error);
        return Response.json({ status: "unhealthy" }, { status: 503 });
    }
}
