import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "คำนวณเงินกู้",
  description: "คำนวณค่างวดและดอกเบี้ยเงินกู้แต่ละประเภทของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/services/loan-calculator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
