import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "รายงานประจำปี",
  description: "อ่านรายงานประจำปีของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ย้อนหลังทุกปี ในรูปแบบ eBook และดาวน์โหลด PDF",
  path: "/annual-reports",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
