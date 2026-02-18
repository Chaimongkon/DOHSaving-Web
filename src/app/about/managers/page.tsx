import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ผู้จัดการใหญ่และรองผู้จัดการฯ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "ผู้จัดการใหญ่และรองผู้จัดการฯ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function ManagersPage() {
  return (
    <DepartmentStaffContent
      deptKey="managers"
      title="ผู้จัดการใหญ่และรองผู้จัดการฯ"
      breadcrumbLabel="ผู้จัดการใหญ่และรองผู้จัดการฯ"
    />
  );
}
