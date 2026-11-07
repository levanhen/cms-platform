import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/queries/published";
import { siteUrl } from "@/lib/utils";

type SeoInput = {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  /** Open Graph type — default website */
  type?: "website" | "article";
  noIndex?: boolean;
};

/** Make relative `/uploads/...` absolute for OG/Twitter crawlers. */
export function absoluteAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return siteUrl(url.startsWith("/") ? url : `/${url}`);
}

export async function buildMetadata(input: SeoInput = {}): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = settings.site_name || "CMS";
  const title = input.title || settings.default_seo_title || siteName;
  const description =
    input.description || settings.default_seo_description || settings.site_description || "";
  const path = input.path || "/";
  const url = siteUrl(path);
  const imageUrl = absoluteAssetUrl(input.image);
  const images = imageUrl ? [{ url: imageUrl, alt: title }] : undefined;
  const ogType = input.type || "website";

  const fullTitle =
    input.title && input.title !== siteName ? `${title} | ${siteName}` : title;

  return {
    metadataBase: new URL(siteUrl("/")),
    title: fullTitle,
    description: description || undefined,
    alternates: {
      canonical: url,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: description || undefined,
      url,
      siteName,
      images,
      locale: "vi_VN",
      type: ogType,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description: description || undefined,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
