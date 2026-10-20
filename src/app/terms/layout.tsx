import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ข้อกำหนดการใช้งาน",
  description: "ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/terms",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
