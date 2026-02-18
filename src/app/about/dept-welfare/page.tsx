import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายสมาชิกสัมพันธ์และสวัสดิการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptWelfarePage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-welfare"
      title="ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ"
      breadcrumbLabel="ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ"
    />
  );
}
