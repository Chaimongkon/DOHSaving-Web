import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "จรรยาบรรณเจ้าหน้าที่ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "จรรยาบรรณเจ้าหน้าที่ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function EthicsStaffPage() {
  return <AboutPageLayout pageKey="ethics-staff" breadcrumbLabel="จรรยาบรรณเจ้าหน้าที่" />;
}
