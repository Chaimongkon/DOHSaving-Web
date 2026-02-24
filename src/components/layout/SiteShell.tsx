"use client";

import { usePathname } from "next/navigation";
import { TopBar, Navbar, Footer } from "@/components/layout";
import CookieConsentBanner from "@/components/CookieConsent";
import FestivalOverlay from "@/components/festival/FestivalOverlay";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <FestivalOverlay />
      <TopBar />
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
