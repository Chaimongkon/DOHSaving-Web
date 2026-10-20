import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.servicePage
    .findFirst({ where: { slug, isActive: true }, select: { title: true, category: true } })
    .catch(() => null);
  return createPageMetadata({
    title: page?.title ?? "บริการ",
    description: page
      ? `${page.title} — ขั้นตอน เอกสารที่ต้องใช้ และแบบฟอร์มที่เกี่ยวข้อง (${page.category}) สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด`
      : "บริการสำหรับสมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    path: `/services/${slug}`,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
