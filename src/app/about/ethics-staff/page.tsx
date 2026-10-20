import { createPageMetadata } from "@/lib/seo";
import EthicsStaffContent from "./EthicsStaffContent";

export const metadata = createPageMetadata({
  title: "จรรยาบรรณเจ้าหน้าที่",
  description: "จรรยาบรรณเจ้าหน้าที่ของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/ethics-staff",
});

export default function EthicsStaffPage() {
  return <EthicsStaffContent />;
}
