"use client";

import { usePathname } from "next/navigation";
import { TopBar, Navbar, Footer } from "@/components/layout";
import CookieConsentBanner from "@/components/CookieConsent";
import FestivalOverlay from "@/components/festival/FestivalOverlay";
import FestivalBanner from "@/components/festival/FestivalBanner";
import FestivalThemeProvider from "@/components/festival/FestivalThemeProvider";
import FestivalDecor from "@/components/festival/FestivalDecor";
import MourningMode from "@/components/MourningMode";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* ใส่ grayscale ที่ <html> เอง — ไม่ต้องมี wrapper (ดูเหตุผลใน MourningMode) */}
      <MourningMode />
      <FestivalThemeProvider />
      <FestivalOverlay />
      <FestivalBanner />
      {/* ชุดตกแต่งเต็มหน้า (เช่น ลอยกระทง) — เปิดเองตามธีมที่ใช้อยู่ หรือโหมดดูตัวอย่างของเจ้าหน้าที่ */}
      <FestivalDecor />
      <TopBar />
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
