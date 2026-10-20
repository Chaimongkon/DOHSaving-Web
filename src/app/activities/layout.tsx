import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ภาพกิจกรรม",
  description: "ภาพบรรยากาศกิจกรรมและโครงการต่าง ๆ ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/activities",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
