import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const question = /^\d+$/.test(id)
    ? await prisma.qnaQuestion
        .findFirst({ where: { id: Number(id), isActive: true }, select: { title: true } })
        .catch(() => null)
    : null;
  // หัวข้อกระทู้อาจมีเบอร์โทร/เลขสมาชิกปน — ปิดตัวเลขยาว ๆ ก่อนส่งให้ search engine
  const title = question ? question.title.replace(/\d[\d\s-]{4,}\d/g, "•••").slice(0, 90) : "กระทู้ถาม-ตอบ";
  return createPageMetadata({
    title,
    description: "คำถามและคำตอบจากเจ้าหน้าที่สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    path: `/qna/${id}`,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
