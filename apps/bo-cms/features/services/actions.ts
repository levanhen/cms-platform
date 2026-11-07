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

const optionalPrice = z.string().optional().transform((value, ctx) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (Number.isNaN(num) || num < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Giá không hợp lệ." });
    return z.NEVER;
  }
  return num;
});

const serviceFieldsSchema = z.object({
  name: z.string().min(1, "Tên dịch vụ là bắt buộc.").max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang."),
  shortDescription: optionalText,
  description: optionalText,
  icon: optionalText,
  featuredImage: optionalText,
  category: optionalText,
  price: optionalPrice,
  displayOrder: z.coerce.number().int().min(0).default(0),
  seoTitle: optionalText,
  seoDescription: optionalText,
});

const createServiceSchema = serviceFieldsSchema;
const updateServiceSchema = serviceFieldsSchema.extend({
  id: z.string().min(1),
});

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await prisma.service.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}

export async function createServiceAction(
  input: z.input<typeof createServiceSchema>,
) {
  try {
    const session = await assertPermission("service:create");
    const data = createServiceSchema.parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    if (!(await assertUniqueSlug(data.slug))) {
      return { ok: false as const, message: "Slug đã tồn tại. Vui lòng chọn slug khác." };
    }

    if (!isStoredMediaUrl(data.featuredImage)) {
      return {
        ok: false as const,
        message: "Ảnh phải được tải lên qua thư viện media, không dùng URL ngoài.",
      };
    }

    const service = await prisma.service.create({
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: sanitizeHtml(data.description),
        icon: data.icon,
        featuredImage: data.featuredImage,
        category: data.category,
        price: data.price,
        displayOrder: data.displayOrder,
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
      resource: "SERVICE",
      resourceId: service.id,
      newValue: { name: service.name, slug: service.slug, status: service.status },
    });

    revalidatePath("/services");
    return { ok: true as const, id: service.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateServiceAction(
  input: z.input<typeof updateServiceSchema>,
) {
  try {
    const session = await assertPermission("service:update");
    const data = updateServiceSchema.parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const current = await prisma.service.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    if (!(await assertUniqueSlug(data.slug, data.id))) {
      return { ok: false as const, message: "Slug đã tồn tại. Vui lòng chọn slug khác." };
    }

    if (!isStoredMediaUrl(data.featuredImage)) {
      return {
        ok: false as const,
        message: "Ảnh phải được tải lên qua thư viện media, không dùng URL ngoài.",
      };
    }

    const service = await prisma.service.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: sanitizeHtml(data.description),
        icon: data.icon,
        featuredImage: data.featuredImage,
        category: data.category,
        price: data.price,
        displayOrder: data.displayOrder,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "SERVICE",
      resourceId: service.id,
      oldValue: { name: current.name, slug: current.slug, status: current.status },
      newValue: { name: service.name, slug: service.slug, status: service.status },
    });

    if (current.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([
        `web:service:${current.slug}`,
        `web:service:${service.slug}`,
        "web:sitemap",
      ]);
    }

    revalidatePath("/services");
    revalidatePath(`/services/${service.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteServiceAction(id: string) {
  try {
    const session = await assertPermission("service:delete");
    const service = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: session.user.id },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "SERVICE",
      resourceId: id,
      oldValue: { name: service.name, slug: service.slug, status: service.status },
    });

    if (service.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([`web:service:${service.slug}`, "web:sitemap"]);
    }

    revalidatePath("/services");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function publishServiceAction(id: string) {
  try {
    const session = await assertPermission("service:publish");
    const service = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    const next = applyPublish({
      status: service.status,
      publishedAt: service.publishedAt,
    });

    const updated = await prisma.service.update({
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
      resource: "SERVICE",
      resourceId: id,
      oldValue: { status: service.status },
      newValue: { status: updated.status, publishedAt: updated.publishedAt },
    });

    await triggerWebRevalidate([`web:service:${updated.slug}`, "web:sitemap"]);
    revalidatePath("/services");
    revalidatePath(`/services/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unpublishServiceAction(id: string) {
  try {
    const session = await assertPermission("service:publish");
    const service = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    const next = applyUnpublish({
      status: service.status,
      publishedAt: service.publishedAt,
    });

    const updated = await prisma.service.update({
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
      resource: "SERVICE",
      resourceId: id,
      oldValue: { status: service.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:service:${service.slug}`, "web:sitemap"]);
    revalidatePath("/services");
    revalidatePath(`/services/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveServiceAction(id: string) {
  try {
    const session = await assertPermission("service:publish");
    const service = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    const next = applyArchive({
      status: service.status,
      publishedAt: service.publishedAt,
    });

    const updated = await prisma.service.update({
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
      resource: "SERVICE",
      resourceId: id,
      oldValue: { status: service.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:service:${service.slug}`, "web:sitemap"]);
    revalidatePath("/services");
    revalidatePath(`/services/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderServiceAction(id: string, direction: "up" | "down") {
  try {
    const session = await assertPermission("service:update");
    const current = await prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy dịch vụ." };
    }

    const neighbor = await prisma.service.findFirst({
      where: {
        deletedAt: null,
        ...(direction === "up"
          ? { displayOrder: { lt: current.displayOrder } }
          : { displayOrder: { gt: current.displayOrder } }),
      },
      orderBy:
        direction === "up"
          ? { displayOrder: "desc" }
          : { displayOrder: "asc" },
    });

    if (!neighbor) {
      return { ok: false as const, message: "Không thể đổi thứ tự thêm được." };
    }

    await prisma.$transaction([
      prisma.service.update({
        where: { id: current.id },
        data: {
          displayOrder: neighbor.displayOrder,
          updatedById: session.user.id,
        },
      }),
      prisma.service.update({
        where: { id: neighbor.id },
        data: {
          displayOrder: current.displayOrder,
          updatedById: session.user.id,
        },
      }),
    ]);

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "SERVICE",
      resourceId: id,
      oldValue: { displayOrder: current.displayOrder },
      newValue: { displayOrder: neighbor.displayOrder },
    });

    if (
      current.status === ContentStatus.PUBLISHED ||
      neighbor.status === ContentStatus.PUBLISHED
    ) {
      await triggerWebRevalidate([
        "web:service:list",
        "web:sitemap",
      ]);
    }

    revalidatePath("/services");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
