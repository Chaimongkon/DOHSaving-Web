import type { Metadata } from "next";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata: Metadata = {
  title: "โครงสร้างองค์กร | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "โครงสร้างองค์กรของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function OrganizationPage() {
  return (
    <InfographicPageLayout
      pageKey="organization"
      pageTitle="โครงสร้างองค์กร"
      breadcrumbLabel="โครงสร้างองค์กร"
    />
  );
}
