import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายทะเบียนหุ้นและติดตามหนี้สิน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptSharesPage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-shares"
      title="ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน"
      breadcrumbLabel="ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน"
    />
  );
}
