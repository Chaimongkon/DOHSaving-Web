import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ข่าวสาร",
  description: "ข่าวประชาสัมพันธ์ ประกาศ และความเคลื่อนไหวล่าสุดของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/news",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
