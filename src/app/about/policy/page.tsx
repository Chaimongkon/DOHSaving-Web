import { createPageMetadata } from "@/lib/seo";
import PolicyPageContent from "./PolicyPageContent";

export const metadata = createPageMetadata({
  title: "นโยบายสหกรณ์",
  description: "นโยบายการดำเนินงานของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/policy",
});

export default function PolicyPage() {
  return <PolicyPageContent />;
}
