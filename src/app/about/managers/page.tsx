import type { Metadata } from "next";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata: Metadata = {
  title: "ผู้จัดการใหญ่และรองผู้จัดการฯ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "ผู้จัดการใหญ่และรองผู้จัดการฯ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

const MANAGER_TIER_LABELS: Record<number, string> = {
  1: "ผู้จัดการใหญ่",
  2: "รองผู้จัดการ",
};

export default function ManagersPage() {
  return (
    <DepartmentStaffContent
      deptKey="managers"
      title="ผู้จัดการใหญ่และรองผู้จัดการฯ"
      breadcrumbLabel="ผู้จัดการใหญ่และรองผู้จัดการฯ"
      tierLabels={MANAGER_TIER_LABELS}
    />
  );
}
