import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import AntdProvider from "./AntdProvider";
import SiteShell from "@/components/layout/SiteShell";
import VisitorTracker from "@/components/VisitorTracker";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_SHORT_NAME,
  getSiteUrl,
} from "@/lib/seo";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: `${SITE_NAME} | ${SITE_SHORT_NAME}`,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_SHORT_NAME,
  keywords: [
    "Department of Highways Saving Cooperative",
    "DOHSaving",
    "saving cooperative",
    "deposit",
    "loan",
    "member services",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_SHORT_NAME}`,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_SHORT_NAME}`,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
