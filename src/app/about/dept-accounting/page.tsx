import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายบัญชี",
  description: "บุคลากรฝ่ายบัญชี สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-accounting",
});

export default function DeptAccountingPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-accounting"
      title="ฝ่ายบัญชี"
      breadcrumbLabel="ฝ่ายบัญชี"
    />
  );
}
