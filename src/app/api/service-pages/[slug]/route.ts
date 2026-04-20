import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface DownloadLink {
  label: string;
  url: string;
  formId?: number;
}

// GET /api/service-pages/[slug] — fetch active service page by slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await prisma.servicePage.findFirst({
      where: { slug, isActive: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Resolve formId references to current fileUrl from forms table
    if (page.downloadLinks) {
      try {
        const links: DownloadLink[] = JSON.parse(page.downloadLinks);
        const formIds = links.filter((l) => l.formId).map((l) => l.formId!);

        if (formIds.length > 0) {
          const forms = await prisma.form.findMany({
            where: { id: { in: formIds } },
            select: { id: true, fileUrl: true, title: true },
          });
          const formMap = new Map(forms.map((f) => [f.id, f]));

          const resolvedLinks = links.map((link) => {
            if (link.formId) {
              const form = formMap.get(link.formId);
              if (form) {
                return { label: link.label || form.title, url: form.fileUrl || "" };
              }
            }
            return { label: link.label, url: link.url };
          }).filter((l) => l.url); // remove links with no URL

          page.downloadLinks = JSON.stringify(resolvedLinks);
        }
      } catch { /* keep original downloadLinks if parse fails */ }
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Failed to fetch service page:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
