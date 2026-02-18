import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายสารสนเทศ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายสารสนเทศ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptItPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-it"
      title="ฝ่ายสารสนเทศ"
      breadcrumbLabel="ฝ่ายสารสนเทศ"
    />
  );
}
