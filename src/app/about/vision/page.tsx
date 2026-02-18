import type { Metadata } from "next";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata: Metadata = {
  title: "วิสัยทัศน์และพันธกิจ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "คำนิยม วิสัยทัศน์ และพันธกิจของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function VisionPage() {
  return (
    <InfographicPageLayout
      pageKey="vision"
      breadcrumbLabel="วิสัยทัศน์และพันธกิจ"
      pageTitle="คำนิยม วิสัยทัศน์ พันธกิจ"
    />
  );
}
