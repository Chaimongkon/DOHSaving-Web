import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ดาวน์โหลดแอป DOHSaving",
  description: "ดาวน์โหลดแอป DOHSaving ตรวจสอบยอดเงินฝาก หุ้น เงินกู้ และทำธุรกรรมได้ทุกที่ทุกเวลา",
  path: "/download-app",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
