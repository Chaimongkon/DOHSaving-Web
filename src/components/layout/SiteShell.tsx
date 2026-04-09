"use client";

import { usePathname } from "next/navigation";
import { TopBar, Navbar, Footer } from "@/components/layout";
import CookieConsentBanner from "@/components/CookieConsent";
import FestivalOverlay from "@/components/festival/FestivalOverlay";
import FestivalBanner from "@/components/festival/FestivalBanner";
import FestivalThemeProvider from "@/components/festival/FestivalThemeProvider";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <FestivalThemeProvider />
      <FestivalOverlay />
      <FestivalBanner />
      <TopBar />
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
