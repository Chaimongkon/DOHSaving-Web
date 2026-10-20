import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายการเงินและการลงทุน",
  description: "บุคลากรฝ่ายการเงินและการลงทุน สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-finance",
});

export default function DeptFinancePage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-finance"
      title="ฝ่ายการเงินและการลงทุน"
      breadcrumbLabel="ฝ่ายการเงินและการลงทุน"
    />
  );
}
