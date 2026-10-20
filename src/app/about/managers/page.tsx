import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ผู้จัดการใหญ่และรองผู้จัดการฯ",
  description: "ผู้จัดการใหญ่และรองผู้จัดการฯ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/managers",
});

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
