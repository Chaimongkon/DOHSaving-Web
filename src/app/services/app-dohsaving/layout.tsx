import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "วิธีใช้งานแอป DOHSaving",
  description: "คู่มือการใช้งานแอป DOHSaving ตั้งแต่ติดตั้ง ลงทะเบียน ลืมรหัสผ่าน จนถึงการทำธุรกรรม พร้อมภาพประกอบทีละขั้นตอน",
  path: "/services/app-dohsaving",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
