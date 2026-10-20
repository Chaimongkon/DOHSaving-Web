import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const section = /^\d+$/.test(id)
    ? await prisma.appGuideSection
        .findFirst({ where: { id: Number(id), isActive: true }, select: { title: true, coverUrl: true } })
        .catch(() => null)
    : null;
  return createPageMetadata({
    title: section ? `${section.title} — วิธีใช้งานแอป DOHSaving` : "วิธีใช้งานแอป DOHSaving",
    description: "คู่มือการใช้งานแอป DOHSaving ทีละขั้นตอน พร้อมภาพประกอบ",
    path: `/services/app-dohsaving/${id}`,
    image: section?.coverUrl || undefined,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
