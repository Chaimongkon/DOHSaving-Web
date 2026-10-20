import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "วิดีโอ",
  description: "วิดีโอแนะนำบริการ ความรู้ และกิจกรรมของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/videos",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
