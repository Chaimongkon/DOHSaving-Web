import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "นโยบายความเป็นส่วนตัว",
  description: "นโยบายการคุ้มครองข้อมูลส่วนบุคคลของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/privacy-policy",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
