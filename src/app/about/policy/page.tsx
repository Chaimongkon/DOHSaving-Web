import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "นโยบายสหกรณ์ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "นโยบายการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function PolicyPage() {
  return <AboutPageLayout pageKey="policy" breadcrumbLabel="นโยบายสหกรณ์" />;
}
