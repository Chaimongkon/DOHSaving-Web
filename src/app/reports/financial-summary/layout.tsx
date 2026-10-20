import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "รายการย่อแสดงสินทรัพย์และหนี้สิน",
  description: "รายการย่อแสดงสินทรัพย์และหนี้สินรายเดือนของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/reports/financial-summary",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
