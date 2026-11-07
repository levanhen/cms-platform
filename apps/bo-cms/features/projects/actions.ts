"use server";

import { CategoryStatus, ContentStatus, Prisma, prisma } from "@cms/db";
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

const optionalDate = z.string().optional().transform((value, ctx) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngày không hợp lệ." });
    return z.NEVER;
  }
  return date;
});

const gallerySchema = z.string().optional().transform((value, ctx) => {
  const lines = (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  for (const url of lines) {
    if (!isStoredMediaUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gallery chỉ chấp nhận ảnh đã tải lên thư viện media.",
      });
      return z.NEVER;
    }
  }
  return lines.length > 0 ? lines : null;
});

const projectFieldsSchema = z
  .object({
    title: z.string().min(1, "Tiêu đề là bắt buộc.").max(200),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug chỉ gồm chữ thường, số và dấu gạch ngang.",
      ),
    summary: optionalText,
    content: optionalText,
    clientName: optionalText,
    location: optionalText,
    startDate: optionalDate,
    endDate: optionalDate,
    featuredImage: optionalText,
    gallery: gallerySchema,
    categoryId: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value.trim() : null)),
    displayOrder: z.coerce.number().int().min(0).default(0),
    seoTitle: optionalText,
    seoDescription: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Ngày kết thúc không được trước ngày bắt đầu.",
      });
    }
  });

const createProjectSchema = projectFieldsSchema;
const updateProjectSchema = projectFieldsSchema.and(
  z.object({ id: z.string().min(1) }),
);

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await prisma.project.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}

export async function createProjectAction(
  input: z.input<typeof createProjectSchema>,
) {
  try {
    const session = await assertPermission("project:create");
    const data = createProjectSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
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

    if (data.categoryId) {
      const category = await prisma.projectCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { ok: false as const, message: "Không tìm thấy danh mục." };
      }
    }

    const project = await prisma.project.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: sanitizeHtml(data.content),
        clientName: data.clientName,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        featuredImage: data.featuredImage,
        gallery: data.gallery ?? undefined,
        categoryId: data.categoryId,
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
      resource: "PROJECT",
      resourceId: project.id,
      newValue: { title: project.title, slug: project.slug, status: project.status },
    });

    revalidatePath("/projects");
    return { ok: true as const, id: project.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProjectAction(
  input: z.input<typeof updateProjectSchema>,
) {
  try {
    const session = await assertPermission("project:update");
    const data = updateProjectSchema.parse({
      ...input,
      slug: slugify(input.slug || input.title),
    });

    const current = await prisma.project.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
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

    if (data.categoryId) {
      const category = await prisma.projectCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { ok: false as const, message: "Không tìm thấy danh mục." };
      }
    }

    const project = await prisma.project.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: sanitizeHtml(data.content),
        clientName: data.clientName,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        featuredImage: data.featuredImage,
        gallery: data.gallery === null ? Prisma.DbNull : data.gallery,
        categoryId: data.categoryId,
        displayOrder: data.displayOrder,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedById: session.user.id,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "PROJECT",
      resourceId: project.id,
      oldValue: { title: current.title, slug: current.slug, status: current.status },
      newValue: { title: project.title, slug: project.slug, status: project.status },
    });

    if (current.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([
        `web:project:${current.slug}`,
        `web:project:${project.slug}`,
        "web:sitemap",
      ]);
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const session = await assertPermission("project:delete");
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: session.user.id },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "PROJECT",
      resourceId: id,
      oldValue: { title: project.title, slug: project.slug, status: project.status },
    });

    if (project.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate([`web:project:${project.slug}`, "web:sitemap"]);
    }

    revalidatePath("/projects");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function publishProjectAction(id: string) {
  try {
    const session = await assertPermission("project:publish");
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
    }

    const next = applyPublish({
      status: project.status,
      publishedAt: project.publishedAt,
    });

    const updated = await prisma.project.update({
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
      resource: "PROJECT",
      resourceId: id,
      oldValue: { status: project.status },
      newValue: { status: updated.status, publishedAt: updated.publishedAt },
    });

    await triggerWebRevalidate([`web:project:${updated.slug}`, "web:sitemap"]);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unpublishProjectAction(id: string) {
  try {
    const session = await assertPermission("project:publish");
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
    }

    const next = applyUnpublish({
      status: project.status,
      publishedAt: project.publishedAt,
    });

    const updated = await prisma.project.update({
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
      resource: "PROJECT",
      resourceId: id,
      oldValue: { status: project.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:project:${project.slug}`, "web:sitemap"]);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveProjectAction(id: string) {
  try {
    const session = await assertPermission("project:publish");
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
    }

    const next = applyArchive({
      status: project.status,
      publishedAt: project.publishedAt,
    });

    const updated = await prisma.project.update({
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
      resource: "PROJECT",
      resourceId: id,
      oldValue: { status: project.status },
      newValue: { status: updated.status },
    });

    await triggerWebRevalidate([`web:project:${project.slug}`, "web:sitemap"]);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderProjectAction(id: string, direction: "up" | "down") {
  try {
    const session = await assertPermission("project:update");
    const current = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy dự án." };
    }

    const neighbor = await prisma.project.findFirst({
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
      prisma.project.update({
        where: { id: current.id },
        data: {
          displayOrder: neighbor.displayOrder,
          updatedById: session.user.id,
        },
      }),
      prisma.project.update({
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
      resource: "PROJECT",
      resourceId: id,
      oldValue: { displayOrder: current.displayOrder },
      newValue: { displayOrder: neighbor.displayOrder },
    });

    if (
      current.status === ContentStatus.PUBLISHED ||
      neighbor.status === ContentStatus.PUBLISHED
    ) {
      await triggerWebRevalidate([
        "web:project:list",
        "web:sitemap",
      ]);
    }

    revalidatePath("/projects");
    return { ok: true as const };
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

export async function createProjectCategoryAction(
  input: z.input<typeof categorySchema>,
) {
  try {
    const session = await assertPermission("project:create");
    const data = categorySchema.parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const exists = await prisma.projectCategory.findUnique({
      where: { slug: data.slug },
    });
    if (exists) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.projectCategory.create({ data });
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "PROJECT_CATEGORY",
      resourceId: category.id,
      newValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/projects/categories");
    revalidatePath("/projects");
    return { ok: true as const, id: category.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProjectCategoryAction(
  input: z.input<typeof categorySchema> & { id: string },
) {
  try {
    const session = await assertPermission("project:update");
    const data = categorySchema.extend({ id: z.string().min(1) }).parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const current = await prisma.projectCategory.findUnique({
      where: { id: data.id },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }

    const duplicate = await prisma.projectCategory.findFirst({
      where: { slug: data.slug, id: { not: data.id } },
    });
    if (duplicate) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.projectCategory.update({
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
      resource: "PROJECT_CATEGORY",
      resourceId: category.id,
      oldValue: { name: current.name, slug: current.slug, status: current.status },
      newValue: {
        name: category.name,
        slug: category.slug,
        status: category.status,
      },
    });

    revalidatePath("/projects/categories");
    revalidatePath("/projects");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProjectCategoryAction(id: string) {
  try {
    const session = await assertPermission("project:delete");
    const category = await prisma.projectCategory.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!category) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }
    if (category._count.projects > 0) {
      return {
        ok: false as const,
        message:
          "Danh mục đang được dùng. Hãy chuyển dự án sang danh mục khác trước.",
      };
    }

    await prisma.projectCategory.delete({ where: { id } });
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "PROJECT_CATEGORY",
      resourceId: id,
      oldValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/projects/categories");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
