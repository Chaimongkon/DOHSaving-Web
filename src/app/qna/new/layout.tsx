import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ตั้งคำถามใหม่",
  description: "ตั้งคำถามถึงเจ้าหน้าที่สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/qna/new",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
