import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "ถาม-ตอบ (Q&A)",
  description: "กระดานถาม-ตอบสำหรับสมาชิก สอบถามเรื่องเงินฝาก เงินกู้ สวัสดิการ และบริการต่าง ๆ ของสหกรณ์",
  path: "/qna",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
