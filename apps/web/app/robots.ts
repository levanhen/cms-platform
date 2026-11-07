import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl("/");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/sitemap.xml"],
        disallow: ["/api/"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: new URL(base).host,
  };
}
