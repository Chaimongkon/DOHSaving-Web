import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ฝ่ายการเงินและการลงทุน | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "บุคลากรฝ่ายการเงินและการลงทุน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function DeptFinancePage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-finance"
      title="ฝ่ายการเงินและการลงทุน"
      breadcrumbLabel="ฝ่ายการเงินและการลงทุน"
    />
  );
}
