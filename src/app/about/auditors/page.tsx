import { createPageMetadata } from "@/lib/seo";
import AuditorsContent from "./AuditorsContent";

export const metadata = createPageMetadata({
  title: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ",
  description: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/auditors",
});

export default function AuditorsPage() {
  return <AuditorsContent />;
}
