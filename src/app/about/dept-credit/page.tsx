import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายสินเชื่อ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายสินเชื่อ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptCreditPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-credit"
      title="ฝ่ายสินเชื่อ"
      breadcrumbLabel="ฝ่ายสินเชื่อ"
    />
  );
}
