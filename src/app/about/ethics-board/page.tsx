import type { Metadata } from "next";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata: Metadata = {
  title: "จรรยาบรรณคณะกรรมการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "จรรยาบรรณคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function EthicsBoardPage() {
  return (
    <InfographicPageLayout
      pageKey="ethics-board"
      breadcrumbLabel="จรรยาบรรณคณะกรรมการ"
      pageTitle="จรรยาบรรณคณะกรรมการ"
    />
  );
}
