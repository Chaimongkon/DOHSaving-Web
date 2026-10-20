import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

const TYPES: Record<string, { title: string; description: string }> = {
  statute: { title: "ข้อบังคับ", description: "ข้อบังคับของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ฉบับปัจจุบันและฉบับแก้ไขเพิ่มเติม" },
  rules: { title: "ระเบียบ", description: "ระเบียบว่าด้วยเงินฝาก เงินกู้ สวัสดิการ และการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด" },
  announcements: { title: "ประกาศ", description: "ประกาศของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด แยกตามประเภทสมาชิก" },
};

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const info = TYPES[type] ?? { title: "ข้อบังคับ / ระเบียบ / ประกาศ", description: TYPES.statute.description };
  return createPageMetadata({ ...info, path: `/regulations/${type}` });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
