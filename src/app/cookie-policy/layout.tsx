import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "นโยบายคุกกี้",
  description: "นโยบายการใช้คุกกี้ของเว็บไซต์สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด และวิธีจัดการความยินยอม",
  path: "/cookie-policy",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
