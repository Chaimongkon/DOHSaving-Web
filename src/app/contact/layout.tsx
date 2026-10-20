import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ติดต่อเรา",
  description: "ที่อยู่ เบอร์โทรศัพท์แต่ละฝ่าย เวลาทำการ และช่องทางออนไลน์ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
