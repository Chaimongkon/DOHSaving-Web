import type { Metadata } from "next";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata: Metadata = {
  title: "นโยบายสหกรณ์ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "นโยบายการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function PolicyPage() {
  return (
    <InfographicPageLayout
      pageKey="policy"
      breadcrumbLabel="นโยบายสหกรณ์"
      pageTitle="นโยบายสหกรณ์"
    />
  );
}
