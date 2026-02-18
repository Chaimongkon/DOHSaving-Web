import type { Metadata } from "next";
import VisionPageContent from "./VisionPageContent";

export const metadata: Metadata = {
  title: "วิสัยทัศน์และพันธกิจ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "คำนิยม วิสัยทัศน์ และพันธกิจของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function VisionPage() {
  return <VisionPageContent />;
}
