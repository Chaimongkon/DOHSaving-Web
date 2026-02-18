import type { Metadata } from "next";
import prisma from "@/lib/prisma";
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
      where: { id: parseInt(id) },
      select: { title: true, details: true, imagePath: true },
    });

    if (!news) {
      return { title: "ไม่พบข่าว | สหกรณ์ออมทรัพย์กรมทางหลวง" };
    }

    const title = news.title || "ข่าวประชาสัมพันธ์";
    const description = news.details
      ? stripHtml(news.details).slice(0, 160)
      : "ข่าวสารจากสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด";

    return {
      title: `${title} | สหกรณ์ออมทรัพย์กรมทางหลวง`,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        ...(news.imagePath ? { images: [{ url: news.imagePath }] } : {}),
      },
    };
  } catch {
    return { title: "ข่าวประชาสัมพันธ์ | สหกรณ์ออมทรัพย์กรมทางหลวง" };
  }
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
