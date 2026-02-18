import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายบริหารทั่วไป | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายบริหารทั่วไป สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptGeneralPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-general"
      title="ฝ่ายบริหารทั่วไป"
      breadcrumbLabel="ฝ่ายบริหารทั่วไป"
    />
  );
}
