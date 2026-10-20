import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "สื่อสำหรับสมาชิก",
  description: "อินโฟกราฟิกและสื่อประชาสัมพันธ์สำหรับสมาชิกสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/services/member-media",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
