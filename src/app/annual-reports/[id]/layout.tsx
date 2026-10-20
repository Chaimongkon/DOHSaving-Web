import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = /^\d+$/.test(id)
    ? await prisma.annualReport
        .findFirst({ where: { id: Number(id), isActive: true }, select: { title: true, coverUrl: true } })
        .catch(() => null)
    : null;
  return createPageMetadata({
    title: report?.title ?? "รายงานประจำปี",
    description: report ? `อ่าน${report.title}ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ในรูปแบบ eBook` : "รายงานประจำปีของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    path: `/annual-reports/${id}`,
    image: report?.coverUrl || undefined,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
