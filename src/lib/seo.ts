import type { Metadata } from "next";

export const SITE_NAME = "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด";
export const SITE_NAME_EN = "Department of Highways Saving Cooperative Ltd.";
export const SITE_SHORT_NAME = "DOHSaving";
export const DEFAULT_DESCRIPTION =
  "เว็บไซต์ทางการของสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — ข่าวสาร บริการเงินฝาก เงินกู้ สวัสดิการ ดาวน์โหลดแบบฟอร์ม อัตราดอกเบี้ย และข้อมูลสำหรับสมาชิก";
export const DEFAULT_OG_IMAGE = "/images/logo/logo.png";

function normalizeUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (rawUrl) {
    try {
      const parsedUrl = new URL(rawUrl);

      if (isProduction && parsedUrl.protocol !== "https:") {
        throw new Error("NEXT_PUBLIC_SITE_URL must use https in production");
      }

      return normalizeUrl(parsedUrl.toString());
    } catch (error) {
      if (isProduction) {
        throw new Error(
          `Invalid NEXT_PUBLIC_SITE_URL for production: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        );
      }
    }
  }

  if (isProduction) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    // absolute: layout ซ้อนกัน (เช่น /qna → /qna/new) ทำให้ template ของ root ไม่ถูกส่งต่อ — ต่อชื่อเว็บเองให้แน่นอน
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "th_TH",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    // ไม่ใส่ robots เลยเมื่อให้ index — ใส่ undefined จะลบค่าจาก root (max-image-preview ฯลฯ) ทิ้ง
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
    }),
  };
}