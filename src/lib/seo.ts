import type { Metadata } from "next";

export const SITE_NAME = "Department of Highways Saving Cooperative Ltd.";
export const SITE_SHORT_NAME = "DOHSaving";
export const DEFAULT_DESCRIPTION =
  "Official website of the Department of Highways Saving Cooperative with news, services, forms, rates, and member information.";
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
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : undefined,
  };
}