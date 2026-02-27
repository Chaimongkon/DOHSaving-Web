import prisma from "@/lib/prisma";

// GET /api/app-guide — fetch active sections for public page
export async function GET() {
  try {
    const items = await prisma.appGuideSection.findMany({
      where: { isActive: true },
      orderBy: [{ groupOrder: "asc" }, { sortOrder: "asc" }],
    });
    return Response.json(items);
  } catch (error) {
    console.error("Failed to fetch app guide:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
