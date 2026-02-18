"use client";

import { usePathname } from "next/navigation";
import { TopBar, Navbar, Footer } from "@/components/layout";
import CookieConsentBanner from "@/components/CookieConsent";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
