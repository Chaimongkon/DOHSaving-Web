import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "เอกสารประกอบการประชุมใหญ่",
  description: "เอกสารประกอบการประชุมใหญ่สามัญประจำปีของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/reports/annual-meeting",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
