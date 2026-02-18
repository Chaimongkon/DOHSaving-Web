import type { Metadata } from "next";
import PolicyPageContent from "./PolicyPageContent";

export const metadata: Metadata = {
  title: "นโยบายสหกรณ์ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "นโยบายการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function PolicyPage() {
  return <PolicyPageContent />;
}
