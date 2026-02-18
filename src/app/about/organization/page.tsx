import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "โครงสร้างองค์กร | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "โครงสร้างองค์กรของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function OrganizationPage() {
  return <AboutPageLayout pageKey="organization" breadcrumbLabel="โครงสร้างองค์กร" />;
}
