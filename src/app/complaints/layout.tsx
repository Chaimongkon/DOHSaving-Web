import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ร้องเรียน / เสนอแนะ",
  description: "ส่งเรื่องร้องเรียน ข้อเสนอแนะ หรือคำชมถึงสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด และติดตามสถานะด้วยเลขที่เรื่อง",
  path: "/complaints",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
