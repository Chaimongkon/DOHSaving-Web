import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายบัญชี | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายบัญชี สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptAccountingPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-accounting"
      title="ฝ่ายบัญชี"
      breadcrumbLabel="ฝ่ายบัญชี"
    />
  );
}
