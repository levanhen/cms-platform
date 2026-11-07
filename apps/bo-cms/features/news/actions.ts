"use server";

import { CategoryStatus, ContentStatus, prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import {
  applyArchive,
  applyPublish,
  applyUnpublish,
} from "@/lib/content/lifecycle";
import { slugify } from "@/lib/content/slug";
import { assertPermission, toActionError } from "@/lib/permissions/assert";
import { triggerWebRevalidate } from "@/lib/revalidate";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { isStoredMediaUrl } from "@/lib/storage/validate";

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  });

const newsFieldsSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc.").max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug không hợp lệ."),
  excerpt: optionalText,
  content: optionalText,
  /** Single cover image; persisted to both thumbnail + featuredImage. */
  featuredImage: optionalText,
  categoryId: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : null)),
  tagNames: z.array(z.string().trim().min(1)).default([]),
  seoTitle: optionalText,
  seoDescription: optionalText,
});

const createNewsSchema = newsFieldsSchema;
const updateNewsSchema = newsFieldsSchema.extend({ id: z.string().min(1) });

async function assertUniqueNewsSlug(slug: string, excludeId?: string) {
  const existing = await prisma.news.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}

async function syncTags(newsId: string, tagNames: string[]) {
  const uniqueNames = Array.from(
    new Set(tagNames.map((name) => name.trim()).filter(Boolean)),
  );

  const tags = await Promise.all(
    uniqueNames.map(async (name) => {
      const slug = slugify(name);
      return prisma.newsTag.upsert({
        where: { slug },
        create: { name, slug },
        update: { name },
      });
    }),
  );

  await prisma.newsTagRelation.deleteMany({ where: { newsId } });
  if (tags.length > 0) {
    await prisma.newsTagRelation.createMany({
      data: tags.map((tag) => ({ newsId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }
}

export async function createNewsAction(input: z.input<typeof createNewsSchema>) {
  try {
    const session = await assertPermission("news:create");
    const data = createNewsSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
    });

    if (!(await assertUniqueNewsSlug(data.slug))) {
      return { ok: false as const, message: "Slug đã tồn tại." };
    }

    if (data.categoryId) {
      const category = await prisma.newsCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { ok: false as const, message: "Không tìm thấy danh mục." };
      }
    }

    if (!isStoredMediaUrl(data.featuredImage)) {
      return {
        ok: false as const,
        message: "Ảnh phải được tải lên qua thư viện media, không dùng URL ngoài.",
      };
    }

    const news = await prisma.news.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: sanitizeHtml(data.content),
        thumbnail: data.featuredImage,
        featuredImage: data.featuredImage,
        categoryId: data.categoryId,
        authorId: session.user.id,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: ContentStatus.DRAFT,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });

    await syncTags(news.id, data.tagNames);

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "NEWS",
      resourceId: news.id,
      newValue: { title: news.title, slug: news.slug, status: news.status },
    });

    revalidatePath("/news");
    return { ok: true as const, id: news.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateNewsAction(input: z.input<typeof updateNewsSchema>) {
  try {
    const session = await assertPermission("news:update");
    const data = updateNewsSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
    });

    const current = await prisma.news.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy tin tức." };
    }

    if (!(await assertUniqueNewsSlug(data.slug, data.id))) {
      return { ok: false as const, message: "Slug đã tồn tại." };
    }

    if (data.categoryId) {
      const category = await prisma.newsCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { ok: false as const, message: "Không tìm thấy danh mục." };
      }
    }

    if (!isStoredMediaUrl(data.featuredImage)) {
      return {
        ok: false as const,
        message: "Ảnh phải được tải lên qua thư viện media, không dùng URL ngoài.",
      };
    }

    const news = await prisma.news.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: sanitizeHtml(data.content),
        thumbnail: data.featuredImage,
        featuredImage: data.featuredImage,
        categoryId: data.categoryId,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedById: session.user.id,
      },
    });

    await syncTags(news.id, data.tagNames);

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "NEWS",
      resourceId: news.id,
      oldValue: { title: current.title, slug: current.slug, status: current.status },
      newValue: { title: news.title, slug: news.slug, status: news.status },
    });

    if (current.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([
        `web:news:${current.slug}`,
        `web:news:${news.slug}`,
        "web:sitemap",
      ]);
    }

    revalidatePath("/news");
    revalidatePath(`/news/${news.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteNewsAction(id: string) {
  try {
    const session = await assertPermission("news:delete");
    const news = await prisma.news.findFirst({ where: { id, deletedAt: null } });
    if (!news) {
      return { ok: false as const, message: "Không tìm thấy tin tức." };
    }

    await prisma.news.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: session.user.id },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "NEWS",
      resourceId: id,
      oldValue: { title: news.title, slug: news.slug, status: news.status },
    });

    if (news.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([`web:news:${news.slug}`, "web:sitemap"]);
    }

    revalidatePath("/news");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

async function changeNewsStatus(
  id: string,
  permission: "news:publish",
  apply: typeof applyPublish | typeof applyUnpublish | typeof applyArchive,
  action: "PUBLISH" | "UNPUBLISH" | "STATUS_CHANGE",
) {
  const session = await assertPermission(permission);
  const news = await prisma.news.findFirst({ where: { id, deletedAt: null } });
  if (!news) {
    return { ok: false as const, message: "Không tìm thấy tin tức." };
  }

  const next = apply({ status: news.status, publishedAt: news.publishedAt });
  const updated = await prisma.news.update({
    where: { id },
    data: {
      status: next.status,
      publishedAt: next.publishedAt,
      updatedById: session.user.id,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action,
    resource: "NEWS",
    resourceId: id,
    oldValue: { status: news.status },
    newValue: { status: updated.status, publishedAt: updated.publishedAt },
  });

  await triggerWebRevalidate([`web:news:${news.slug}`, "web:sitemap"]);
  revalidatePath("/news");
  revalidatePath(`/news/${id}`);
  return { ok: true as const };
}

export async function publishNewsAction(id: string) {
  try {
    return await changeNewsStatus(id, "news:publish", applyPublish, "PUBLISH");
  } catch (error) {
    return toActionError(error);
  }
}

export async function unpublishNewsAction(id: string) {
  try {
    return await changeNewsStatus(id, "news:publish", applyUnpublish, "UNPUBLISH");
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveNewsAction(id: string) {
  try {
    return await changeNewsStatus(id, "news:publish", applyArchive, "STATUS_CHANGE");
  } catch (error) {
    return toActionError(error);
  }
}

const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText,
  status: z.nativeEnum(CategoryStatus).default(CategoryStatus.ACTIVE),
});

export async function createNewsCategoryAction(
  input: z.input<typeof categorySchema>,
) {
  try {
    const session = await assertPermission("news:create");
    const data = categorySchema.parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const exists = await prisma.newsCategory.findUnique({
      where: { slug: data.slug },
    });
    if (exists) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.newsCategory.create({ data });
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "NEWS_CATEGORY",
      resourceId: category.id,
      newValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/news/categories");
    revalidatePath("/news");
    return { ok: true as const, id: category.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateNewsCategoryAction(
  input: z.input<typeof categorySchema> & { id: string },
) {
  try {
    const session = await assertPermission("news:update");
    const data = categorySchema.extend({ id: z.string().min(1) }).parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const current = await prisma.newsCategory.findUnique({ where: { id: data.id } });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }

    const duplicate = await prisma.newsCategory.findFirst({
      where: { slug: data.slug, id: { not: data.id } },
    });
    if (duplicate) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.newsCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "NEWS_CATEGORY",
      resourceId: category.id,
      oldValue: { name: current.name, slug: current.slug, status: current.status },
      newValue: { name: category.name, slug: category.slug, status: category.status },
    });

    revalidatePath("/news/categories");
    revalidatePath("/news");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteNewsCategoryAction(id: string) {
  try {
    const session = await assertPermission("news:delete");
    const category = await prisma.newsCategory.findUnique({
      where: { id },
      include: { _count: { select: { news: true } } },
    });
    if (!category) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }
    if (category._count.news > 0) {
      return {
        ok: false as const,
        message: "Danh mục đang được dùng. Hãy chuyển tin sang danh mục khác trước.",
      };
    }

    await prisma.newsCategory.delete({ where: { id } });
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "NEWS_CATEGORY",
      resourceId: id,
      oldValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/news/categories");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
