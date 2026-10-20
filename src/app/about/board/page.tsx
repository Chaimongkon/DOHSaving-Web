import { createPageMetadata } from "@/lib/seo";
import BoardContent from "./BoardContent";

export const metadata = createPageMetadata({
  title: "คณะกรรมการ",
  description: "รายชื่อคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/board",
});

export default function BoardPage() {
  return <BoardContent />;
}
