import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายสารสนเทศ",
  description: "บุคลากรฝ่ายสารสนเทศ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-it",
});

export default function DeptItPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-it"
      title="ฝ่ายสารสนเทศ"
      breadcrumbLabel="ฝ่ายสารสนเทศ"
    />
  );
}
