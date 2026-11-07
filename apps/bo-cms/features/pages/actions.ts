"use server";

import { ContentStatus, prisma } from "@cms/db";
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

function assertStoredImage(url: string | null) {
  if (!isStoredMediaUrl(url)) {
    return {
      ok: false as const,
      message: "Ảnh phải được tải lên qua thư viện media, không dùng URL ngoài.",
    };
  }
  return null;
}

const pageFieldsSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc.").max(200),
  slug: z
    .string()
    .min(1, "Slug là bắt buộc.")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang."),
  summary: optionalText,
  content: optionalText,
  featuredImage: optionalText,
  seoTitle: optionalText,
  seoDescription: optionalText,
});

const createPageSchema = pageFieldsSchema;
const updatePageSchema = pageFieldsSchema.extend({
  id: z.string().min(1),
});

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await prisma.page.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    return false;
  }
  return true;
}

export async function createPageAction(input: z.infer<typeof createPageSchema>) {
  try {
    const session = await assertPermission("page:create");
    const data = createPageSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
    });

    if (!(await assertUniqueSlug(data.slug))) {
      return { ok: false as const, message: "Slug đã tồn tại. Vui lòng chọn slug khác." };
    }

    const imageError = assertStoredImage(data.featuredImage);
    if (imageError) return imageError;

    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: sanitizeHtml(data.content),
        featuredImage: data.featuredImage,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: ContentStatus.DRAFT,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "PAGE",
      resourceId: page.id,
      newValue: { title: page.title, slug: page.slug, status: page.status },
    });

    revalidatePath("/pages");
    return { ok: true as const, id: page.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePageAction(input: z.infer<typeof updatePageSchema>) {
  try {
    const session = await assertPermission("page:update");
    const data = updatePageSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
    });

    const current = await prisma.page.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy trang." };
    }

    if (!(await assertUniqueSlug(data.slug, data.id))) {
      return { ok: false as const, message: "Slug đã tồn tại. Vui lòng chọn slug khác." };
    }

    const imageError = assertStoredImage(data.featuredImage);
    if (imageError) return imageError;

    const page = await prisma.page.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: sanitizeHtml(data.content),
        featuredImage: data.featuredImage,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "PAGE",
      resourceId: page.id,
      oldValue: {
        title: current.title,
        slug: current.slug,
        status: current.status,
      },
      newValue: {
        title: page.title,
        slug: page.slug,
        status: page.status,
      },
    });

    if (current.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([`web:page:${current.slug}`, `web:page:${page.slug}`, "web:sitemap"]);
    }

    revalidatePath("/pages");
    revalidatePath(`/pages/${page.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePageAction(id: string) {
  try {
    const session = await assertPermission("page:delete");
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) {
      return { ok: false as const, message: "Không tìm thấy trang." };
    }

    await prisma.page.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "PAGE",
      resourceId: id,
      oldValue: { title: page.title, slug: page.slug, status: page.status },
    });

    if (page.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([`web:page:${page.slug}`, "web:sitemap"]);
    }

    revalidatePath("/pages");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function publishPageAction(id: string) {
  try {
    const session = await assertPermission("page:publish");
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) {
      return { ok: false as const, message: "Không tìm thấy trang." };
    }

    const next = applyPublish({
      status: page.status,
      publishedAt: page.publishedAt,
    });

    const updated = await prisma.page.update({
      where: { id },
      data: {
        status: next.status,
        publishedAt: next.publishedAt,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "PUBLISH",
      resource: "PAGE",
      resourceId: id,
      oldValue: { status: page.status },
      newValue: { status: updated.status, publishedAt: updated.publishedAt },
    });

    await triggerWebRevalidate([`web:page:${updated.slug}`, "web:sitemap"]);
    revalidatePath("/pages");
    revalidatePath(`/pages/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unpublishPageAction(id: string) {
  try {
    const session = await assertPermission("page:publish");
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) {
      return { ok: false as const, message: "Không tìm thấy trang." };
    }

    const next = applyUnpublish({
      status: page.status,
      publishedAt: page.publishedAt,
    });

    const updated = await prisma.page.update({
      where: { id },
      data: {
        status: next.status,
        publishedAt: next.publishedAt,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UNPUBLISH",
      resource: "PAGE",
      resourceId: id,
      oldValue: { status: page.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:page:${page.slug}`, "web:sitemap"]);
    revalidatePath("/pages");
    revalidatePath(`/pages/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archivePageAction(id: string) {
  try {
    const session = await assertPermission("page:publish");
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) {
      return { ok: false as const, message: "Không tìm thấy trang." };
    }

    const next = applyArchive({
      status: page.status,
      publishedAt: page.publishedAt,
    });

    const updated = await prisma.page.update({
      where: { id },
      data: {
        status: next.status,
        publishedAt: next.publishedAt,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      resource: "PAGE",
      resourceId: id,
      oldValue: { status: page.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:page:${page.slug}`, "web:sitemap"]);
    revalidatePath("/pages");
    revalidatePath(`/pages/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
