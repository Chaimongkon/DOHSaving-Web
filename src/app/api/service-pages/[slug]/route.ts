import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseSteps } from "@/lib/serviceSteps";

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

    let steps = parseSteps(page.steps);

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

          const mapped = links.map((link) => {
            if (link.formId) {
              const form = formMap.get(link.formId);
              if (form) {
                return { label: link.label || form.title, url: form.fileUrl || "" };
              }
            }
            return { label: link.label, url: link.url };
          });

          // ตัดลิงก์ที่ไม่มีไฟล์ออก แล้วเลื่อน docIndex ของขั้นตอนให้ชี้เอกสารตัวเดิม
          const newIndex = new Map<number, number>();
          const resolvedLinks = mapped.filter((l, i) => {
            if (!l.url) return false;
            newIndex.set(i, newIndex.size);
            return true;
          });
          steps = steps.map((st) => {
            if (st.docIndex === undefined) return st;
            const { docIndex, ...rest } = st;
            return newIndex.has(docIndex) ? { ...rest, docIndex: newIndex.get(docIndex) } : rest;
          });

          page.downloadLinks = JSON.stringify(resolvedLinks);
        }
      } catch { /* keep original downloadLinks if parse fails */ }
    }

    // บริการอื่นในหมวดเดียวกัน — ให้สมาชิกไปต่อได้โดยไม่ต้องกลับเมนู
    const related = await prisma.servicePage.findMany({
      where: { category: page.category, isActive: true, NOT: { id: page.id } },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { slug: true, title: true },
      take: 8,
    });

    return NextResponse.json({ ...page, steps, related });
  } catch (error) {
    console.error("Failed to fetch service page:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
