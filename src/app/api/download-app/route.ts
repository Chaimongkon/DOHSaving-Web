import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.downloadApp.findFirst();
    if (!data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch download app:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
