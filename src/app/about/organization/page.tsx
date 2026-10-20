import { createPageMetadata } from "@/lib/seo";
import InfographicPageLayout from "@/components/about/InfographicPageLayout";

export const metadata = createPageMetadata({
  title: "โครงสร้างองค์กร",
  description: "โครงสร้างองค์กรของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/organization",
});

export default function OrganizationPage() {
  return (
    <InfographicPageLayout
      pageKey="organization"
      pageTitle="โครงสร้างองค์กร"
      breadcrumbLabel="โครงสร้างองค์กร"
      eyebrow="ORGANIZATION"
      lead="แผนผังการบริหารงานของสหกรณ์ พร้อมลิงก์ไปทำความรู้จักผู้บริหารและบุคลากรของแต่ละฝ่าย"
      showTeamLinks
    />
  );
}
