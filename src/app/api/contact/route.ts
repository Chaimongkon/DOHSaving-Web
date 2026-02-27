import prisma from "@/lib/prisma";

// GET /api/contact — public: fetch all contact data
export async function GET() {
  try {
    const [info, departments, lineContacts] = await Promise.all([
      prisma.contactInfo.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.department.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.lineContact.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // Convert info array to key-value map
    const infoMap: Record<string, string> = {};
    for (const item of info) {
      infoMap[item.key] = item.value;
    }

    return Response.json({ info: infoMap, departments, lineContacts });
  } catch (error) {
    console.error("Contact fetch error:", error);
    return Response.json(
      { info: {}, departments: [], lineContacts: [] },
      { status: 500 }
    );
  }
}
