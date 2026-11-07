import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries/published";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/services"), changeFrequency: "weekly", priority: 0.8 },
    { url: siteUrl("/projects"), changeFrequency: "weekly", priority: 0.8 },
    { url: siteUrl("/news"), changeFrequency: "daily", priority: 0.8 },
    { url: siteUrl("/documents"), changeFrequency: "weekly", priority: 0.6 },
    { url: siteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: siteUrl("/llms.txt"), changeFrequency: "weekly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...entries.pages.map((p) => ({
      url: siteUrl(`/pages/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...entries.services.map((p) => ({
      url: siteUrl(`/services/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.projects.map((p) => ({
      url: siteUrl(`/projects/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.news.map((p) => ({
      url: siteUrl(`/news/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
