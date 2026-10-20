import prisma from "@/lib/prisma";
import { getUploadFileSize } from "@/lib/uploadFileSize";

// GET /api/meeting-documents — public: fetch active documents
export async function GET() {
  try {
    const items = await prisma.meetingDocument.findMany({
      where: { isActive: true },
      orderBy: [{ year: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        year: true,
        title: true,
        fileUrl: true,
        coverUrl: true,
        category: true,
        description: true,
      },
    });
    const withSize = await Promise.all(
      items.map(async (item) => ({ ...item, fileSize: await getUploadFileSize(item.fileUrl) }))
    );
    return Response.json(withSize);
  } catch (error) {
    console.error("Failed to fetch meeting documents:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
