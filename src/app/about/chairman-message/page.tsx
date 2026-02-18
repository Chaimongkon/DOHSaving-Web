import type { Metadata } from "next";
import ChairmanMessageContent from "./ChairmanMessageContent";

export const metadata: Metadata = {
  title: "สารจากประธานกรรมการดำเนินการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "สารจากประธานกรรมการดำเนินการ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function ChairmanMessagePage() {
  return <ChairmanMessageContent />;
}
