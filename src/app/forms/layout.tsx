import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ดาวน์โหลดแบบฟอร์ม",
  description: "ดาวน์โหลดแบบฟอร์มสมัครสมาชิก ฝาก-ถอนเงิน เงินกู้ สวัสดิการ ผู้รับผลประโยชน์ และแบบฟอร์มอื่น ๆ ของสหกรณ์",
  path: "/forms",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
