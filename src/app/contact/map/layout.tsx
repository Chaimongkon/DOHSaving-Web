import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "แผนที่และการเดินทาง",
  description: "แผนที่และวิธีเดินทางมายังสำนักงานสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ทั้งรถไฟฟ้า รถโดยสาร และรถยนต์ส่วนตัว",
  path: "/contact/map",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
