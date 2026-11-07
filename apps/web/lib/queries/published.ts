import { ContentStatus, prisma } from "@cms/db";
import { getOrSet } from "@/lib/cache/redis";

const PUBLIC_SETTING_KEYS = [
  "site_name",
  "site_description",
  "logo",
  "favicon",
  "default_seo_title",
  "default_seo_description",
  "contact_address",
  "contact_phone",
  "contact_email",
] as const;

export type PublicSettings = Record<(typeof PUBLIC_SETTING_KEYS)[number], string>;

function settingToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return String(value);
}

export async function getPublicSettings(): Promise<PublicSettings> {
  return getOrSet("web:settings:public", 1800, async () => {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
      select: { key: true, value: true },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, settingToString(r.value)]));
    return {
      site_name: map.site_name || "CMS Platform",
      site_description: map.site_description || "",
      logo: map.logo || "",
      favicon: map.favicon || "",
      default_seo_title: map.default_seo_title || map.site_name || "CMS Platform",
      default_seo_description: map.default_seo_description || "",
      contact_address:
        map.contact_address || "275 South Poal, 4th Floor Central Plaza, Main Town",
      contact_phone: map.contact_phone || "(+84) 0123 456 789",
      contact_email: map.contact_email || "info@example.com",
    };
  });
}

const publishedWhere = {
  status: ContentStatus.PUBLISHED,
  deletedAt: null,
} as const;

export async function getPublishedPageBySlug(slug: string) {
  return getOrSet(`web:page:${slug}`, 1800, () =>
    prisma.page.findFirst({
      where: { ...publishedWhere, slug },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        featuredImage: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
  );
}

export async function listPublishedServices() {
  return getOrSet("web:service:list", 900, () =>
    prisma.service.findMany({
      where: publishedWhere,
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        icon: true,
        featuredImage: true,
        category: true,
        displayOrder: true,
      },
    }),
  );
}

export async function getPublishedServiceBySlug(slug: string) {
  return getOrSet(`web:service:${slug}`, 1800, async () => {
    const service = await prisma.service.findFirst({
      where: { ...publishedWhere, slug },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        icon: true,
        featuredImage: true,
        category: true,
        price: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
      },
    });
    if (!service) return null;
    return {
      ...service,
      price: service.price == null ? null : Number(service.price),
    };
  });
}

export async function listPublishedProjects(limit = 24) {
  return getOrSet(`web:project:list:${limit}`, 900, () =>
    prisma.project.findMany({
      where: publishedWhere,
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        featuredImage: true,
        location: true,
        clientName: true,
        category: { select: { name: true, slug: true } },
        publishedAt: true,
      },
    }),
  );
}

export async function getPublishedProjectBySlug(slug: string) {
  return getOrSet(`web:project:${slug}`, 1800, () =>
    prisma.project.findFirst({
      where: { ...publishedWhere, slug },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        featuredImage: true,
        gallery: true,
        location: true,
        clientName: true,
        startDate: true,
        endDate: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  );
}

export async function listPublishedNews(page = 1, pageSize = 9) {
  const key = `web:news:list:${page}:${pageSize}`;
  return getOrSet(key, 180, async () => {
    const where = publishedWhere;
    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnail: true,
          featuredImage: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.news.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  });
}

export async function getPublishedNewsBySlug(slug: string) {
  return getOrSet(`web:news:${slug}`, 1800, () =>
    prisma.news.findFirst({
      where: { ...publishedWhere, slug },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        featuredImage: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
    }),
  );
}

export async function listPublishedDocuments(page = 1, pageSize = 12) {
  const key = `web:document:list:${page}:${pageSize}`;
  return getOrSet(key, 180, async () => {
    const where = publishedWhere;
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          category: { select: { name: true, slug: true } },
          updatedAt: true,
        },
      }),
      prisma.document.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  });
}

export async function getPublishedDocumentForDownload(id: string) {
  return prisma.document.findFirst({
    where: { ...publishedWhere, id },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileType: true,
      fileUrl: true,
      fileSize: true,
    },
  });
}

export async function getSitemapEntries() {
  return getOrSet("web:sitemap", 900, async () => {
    const [pages, services, projects, news] = await Promise.all([
      prisma.page.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
      }),
      prisma.service.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
      }),
      prisma.project.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
      }),
      prisma.news.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return { pages, services, projects, news };
  });
}
