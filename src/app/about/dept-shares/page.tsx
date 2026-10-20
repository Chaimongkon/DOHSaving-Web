import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน",
  description: "บุคลากรฝ่ายทะเบียนหุ้นและติดตามหนี้สิน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-shares",
});

export default function DeptSharesPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-shares"
      title="ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน"
      breadcrumbLabel="ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน"
    />
  );
}
