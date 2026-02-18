import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import AntdProvider from "./AntdProvider";
import SiteShell from "@/components/layout/SiteShell";
import VisitorTracker from "@/components/VisitorTracker";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด | DOHSaving",
  description:
    "เว็บไซต์สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด - บริการเงินฝาก สินเชื่อ และสวัสดิการสมาชิก",
  keywords: ["สหกรณ์ออมทรัพย์", "กรมทางหลวง", "DOHSaving", "เงินฝาก", "สินเชื่อ"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={notoSansThai.variable}>
        <AntdProvider>
          <VisitorTracker />
          <SiteShell>{children}</SiteShell>
        </AntdProvider>
      </body>
    </html>
  );
}
