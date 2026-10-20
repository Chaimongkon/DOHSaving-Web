import { createPageMetadata } from "@/lib/seo";
import DepartmentStaffContent from "@/components/about/DepartmentStaffContent";

export const metadata = createPageMetadata({
  title: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ",
  description: "บุคลากรฝ่ายสมาชิกสัมพันธ์และสวัสดิการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/dept-welfare",
});

export default function DeptWelfarePage() {
  return (
    <DepartmentStaffContent
      deptKey="dept-welfare"
      title="ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ"
      breadcrumbLabel="ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ"
    />
  );
}
