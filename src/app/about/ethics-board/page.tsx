import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "จรรยาบรรณคณะกรรมการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "จรรยาบรรณคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function EthicsBoardPage() {
  return <AboutPageLayout pageKey="ethics-board" breadcrumbLabel="จรรยาบรรณคณะกรรมการ" />;
}
