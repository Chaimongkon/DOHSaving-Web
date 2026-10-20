import { createPageMetadata } from "@/lib/seo";
import EthicsBoardContent from "./EthicsBoardContent";

export const metadata = createPageMetadata({
  title: "จรรยาบรรณคณะกรรมการ",
  description: "จรรยาบรรณคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/ethics-board",
});

export default function EthicsBoardPage() {
  return <EthicsBoardContent />;
}
