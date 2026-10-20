import { createPageMetadata } from "@/lib/seo";
import VisionPageContent from "./VisionPageContent";

export const metadata = createPageMetadata({
  title: "วิสัยทัศน์และพันธกิจ",
  description: "ค่านิยม วิสัยทัศน์ และพันธกิจของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/vision",
});

export default function VisionPage() {
  return <VisionPageContent />;
}
