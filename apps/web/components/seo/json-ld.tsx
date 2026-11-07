import { absoluteAssetUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";

type JsonValue = Record<string, unknown> | Record<string, unknown>[];

export function JsonLd({ data }: { data: JsonValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(input: {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}) {
  const logo = absoluteAssetUrl(input.logo);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: siteUrl("/"),
    description: input.description || undefined,
    email: input.email || undefined,
    telephone: input.phone || undefined,
    logo: logo || undefined,
    address: input.address
      ? {
          "@type": "PostalAddress",
          streetAddress: input.address,
          addressCountry: "VN",
        }
      : undefined,
  };
}

export function webSiteJsonLd(input: { name: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: siteUrl("/"),
    description: input.description || undefined,
    inLanguage: "vi-VN",
    publisher: {
      "@type": "Organization",
      name: input.name,
      url: siteUrl("/"),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName?: string | null;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description || undefined,
    url: siteUrl(input.path),
    image: absoluteAssetUrl(input.image),
    datePublished: input.publishedAt
      ? new Date(input.publishedAt).toISOString()
      : undefined,
    dateModified: input.updatedAt
      ? new Date(input.updatedAt).toISOString()
      : input.publishedAt
        ? new Date(input.publishedAt).toISOString()
        : undefined,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@type": "Organization", name: input.siteName },
    publisher: {
      "@type": "Organization",
      name: input.siteName,
      url: siteUrl("/"),
    },
    mainEntityOfPage: siteUrl(input.path),
    inLanguage: "vi-VN",
  };
}

export function serviceJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  image?: string | null;
  category?: string | null;
  price?: number | null;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description || undefined,
    url: siteUrl(input.path),
    image: absoluteAssetUrl(input.image),
    category: input.category || undefined,
    provider: {
      "@type": "Organization",
      name: input.siteName,
      url: siteUrl("/"),
    },
    ...(input.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: input.price,
            priceCurrency: "VND",
          },
        }
      : {}),
  };
}

export function creativeWorkJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  location?: string | null;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    description: input.description || undefined,
    url: siteUrl(input.path),
    image: absoluteAssetUrl(input.image),
    contentLocation: input.location || undefined,
    creator: {
      "@type": "Organization",
      name: input.siteName,
      url: siteUrl("/"),
    },
    inLanguage: "vi-VN",
  };
}

export function webPageJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description || undefined,
    url: siteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: input.siteName,
      url: siteUrl("/"),
    },
    inLanguage: "vi-VN",
  };
}

export function contactPageJsonLd(input: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Liên hệ",
    url: siteUrl("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: input.name,
      email: input.email || undefined,
      telephone: input.phone || undefined,
      address: input.address
        ? {
            "@type": "PostalAddress",
            streetAddress: input.address,
            addressCountry: "VN",
          }
        : undefined,
    },
  };
}
