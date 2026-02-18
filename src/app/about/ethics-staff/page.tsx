import type { Metadata } from "next";
import EthicsStaffContent from "./EthicsStaffContent";

export const metadata: Metadata = {
  title: "จรรยาบรรณเจ้าหน้าที่ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "จรรยาบรรณเจ้าหน้าที่ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function EthicsStaffPage() {
  return <EthicsStaffContent />;
}
