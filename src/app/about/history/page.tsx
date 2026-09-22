import type { Metadata } from "next";
import HistoryPageContent from "./HistoryPageContent";

export const metadata: Metadata = {
  title: "ประวัติสหกรณ์ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "ประวัติความเป็นมาของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ตั้งแต่ก่อตั้งจนถึงปัจจุบัน",
};

export default function HistoryPage() {
  return <HistoryPageContent />;
}
