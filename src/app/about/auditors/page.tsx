import type { Metadata } from "next";
import AuditorsContent from "./AuditorsContent";

export const metadata: Metadata = {
  title: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "ผู้ตรวจสอบบัญชีและผู้ตรวจสอบกิจการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function AuditorsPage() {
  return <AuditorsContent />;
}
