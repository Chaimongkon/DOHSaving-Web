import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายบริหารทั่วไป",
  description: "บุคลากรฝ่ายบริหารทั่วไป สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-general",
});

export default function DeptGeneralPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-general"
      title="ฝ่ายบริหารทั่วไป"
      breadcrumbLabel="ฝ่ายบริหารทั่วไป"
    />
  );
}
