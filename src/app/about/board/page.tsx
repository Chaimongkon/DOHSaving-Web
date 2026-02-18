import type { Metadata } from "next";
import BoardContent from "./BoardContent";

export const metadata: Metadata = {
  title: "คณะกรรมการ | สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
  description: "รายชื่อคณะกรรมการดำเนินการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
};

export default function BoardPage() {
  return <BoardContent />;
}
