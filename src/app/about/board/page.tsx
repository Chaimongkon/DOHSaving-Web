import type { Metadata } from "next";
import AboutPageLayout from "@/components/about/AboutPageLayout";

export const metadata: Metadata = {
  title: "คณะกรรมการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "รายชื่อคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function BoardPage() {
  return <AboutPageLayout pageKey="board" breadcrumbLabel="คณะกรรมการ" />;
}
