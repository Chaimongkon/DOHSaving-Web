import { createPageMetadata } from "@/lib/seo";
import ChairmanMessageContent from "./ChairmanMessageContent";

export const metadata = createPageMetadata({
  title: "สารจากประธานกรรมการดำเนินการ",
  description: "สารจากประธานกรรมการดำเนินการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  path: "/about/chairman-message",
});

export default function ChairmanMessagePage() {
  return <ChairmanMessageContent />;
}
