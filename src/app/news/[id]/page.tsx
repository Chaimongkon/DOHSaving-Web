import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from "@/lib/seo";
import NewsDetailClient from "./NewsDetailClient";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        title: true,
        details: true,
        imagePath: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!news) {
      return {
        title: `News Not Found | ${SITE_NAME}`,
        robots: { index: false, follow: false },
      };
    }

    const title = news.title || "News";
    const description = news.details
      ? stripHtml(news.details).slice(0, 160)
      : "News and announcements from the Department of Highways Saving Cooperative.";
    const image = news.imagePath || DEFAULT_OG_IMAGE;
    const canonicalPath = `/news/${id}`;

    return {
      title: `${title} | ${SITE_NAME}`,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title,
        description,
        url: absoluteUrl(canonicalPath),
        type: "article",
        publishedTime: news.createdAt.toISOString(),
        modifiedTime: news.updatedAt.toISOString(),
        images: [{ url: image }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: `News | ${SITE_NAME}` };
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
