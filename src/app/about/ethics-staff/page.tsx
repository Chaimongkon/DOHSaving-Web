import type { Metadata } from "next";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata: Metadata = {
  title: "จรรยาบรรณเจ้าหน้าที่ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "จรรยาบรรณเจ้าหน้าที่ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function EthicsStaffPage() {
  return (
    <InfographicPageLayout
      pageKey="ethics-staff"
      breadcrumbLabel="จรรยาบรรณเจ้าหน้าที่"
      pageTitle="จรรยาบรรณเจ้าหน้าที่"
    />
  );
}
