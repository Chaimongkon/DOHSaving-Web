import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายสินเชื่อ",
  description: "บุคลากรฝ่ายสินเชื่อ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-credit",
});

export default function DeptCreditPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-credit"
      title="ฝ่ายสินเชื่อ"
      breadcrumbLabel="ฝ่ายสินเชื่อ"
    />
  );
}
