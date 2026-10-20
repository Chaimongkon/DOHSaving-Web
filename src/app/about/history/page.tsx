import { createPageMetadata } from "@/lib/seo";
import HistoryPageContent from "./HistoryPageContent";

export const metadata = createPageMetadata({
  title: "ประวัติสหกรณ์",
  description: "ประวัติความเป็นมาของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ตั้งแต่ก่อตั้งจนถึงปัจจุบัน",
  path: "/about/history",
});

export default function HistoryPage() {
  return <HistoryPageContent />;
}
