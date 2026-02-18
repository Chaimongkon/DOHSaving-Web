import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "ประวัติสหกรณ์ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "ประวัติความเป็นมาของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ตั้งแต่ก่อตั้งจนถึงปัจจุบัน",
};

export default function HistoryPage() {
  return <AboutPageLayout pageKey="history" breadcrumbLabel="ประวัติสหกรณ์" />;
}
