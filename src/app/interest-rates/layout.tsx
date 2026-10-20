import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "อัตราดอกเบี้ย",
  description: "อัตราดอกเบี้ยเงินฝากและเงินกู้ล่าสุดของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/interest-rates",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
