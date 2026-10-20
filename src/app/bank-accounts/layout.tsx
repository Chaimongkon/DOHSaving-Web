import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "บัญชีธนาคารสหกรณ์",
  description: "เลขที่บัญชีธนาคารของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด สำหรับโอนเงินชำระหนี้ ฝากเงิน และธุรกรรมอื่น ๆ",
  path: "/bank-accounts",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
