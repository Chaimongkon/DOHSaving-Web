import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "",
  "/about/history",
  "/about/chairman-message",
  "/about/vision",
  "/about/policy",
  "/about/organization",
  "/about/board",
  "/about/managers",
  "/about/auditors",
  "/about/ethics-board",
  "/about/ethics-staff",
  "/activities",
  "/annual-reports",
  "/bank-accounts",
  "/contact",
  "/contact/map",
  "/cookie-policy",
  "/download-app",
  "/forms",
  "/interest-rates",
  "/news",
  "/privacy-policy",
  "/qna",
  "/reports/annual-meeting",
  "/reports/financial-summary",
  "/services/app-dohsaving",
  "/services/loan-calculator",
  "/services/member-media",
  "/terms",
  "/videos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [newsItems, servicePages, annualReports] = await Promise.all([
      prisma.news.findMany({
        where: { isActive: true },
        select: { id: true, createdAt: true, updatedAt: true },
      }),
      prisma.servicePage.findMany({
        where: { isActive: true },
        select: { slug: true, createdAt: true, updatedAt: true },
      }),
      prisma.businessReport.findMany({
        where: { isActive: true },
        select: { id: true, createdAt: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticEntries,
      ...newsItems.map((item) => ({
        url: absoluteUrl(`/news/${item.id}`),
        lastModified: item.updatedAt ?? item.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...servicePages.map((item) => ({
        url: absoluteUrl(`/services/${item.slug}`),
        lastModified: item.updatedAt ?? item.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...annualReports.map((item) => ({
        url: absoluteUrl(`/annual-reports/${item.id}`),
        lastModified: item.updatedAt ?? item.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
