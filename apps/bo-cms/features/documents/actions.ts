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

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  });

const updateDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: optionalText,
  categoryId: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : null)),
});

export async function updateDocumentAction(
  input: z.infer<typeof updateDocumentSchema>,
) {
  try {
    const session = await assertPermission("document:update");
    const data = updateDocumentSchema.parse(input);

    const current = await prisma.document.findFirst({
      where: { id: data.id, deletedAt: null },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy tài liệu." };
    }

    if (data.categoryId) {
      const category = await prisma.documentCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { ok: false as const, message: "Không tìm thấy danh mục." };
      }
    }

    const updated = await prisma.document.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "DOCUMENT",
      resourceId: data.id,
      oldValue: {
        title: current.title,
        categoryId: current.categoryId,
        status: current.status,
      },
      newValue: {
        title: updated.title,
        categoryId: updated.categoryId,
        status: updated.status,
      },
    });

    if (current.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate(["web:documents", "web:sitemap"]);
    }

    revalidatePath("/documents");
    revalidatePath(`/documents/${data.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteDocumentAction(id: string) {
  try {
    const session = await assertPermission("document:delete");
    const doc = await prisma.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) {
      return { ok: false as const, message: "Không tìm thấy tài liệu." };
    }

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "DOCUMENT",
      resourceId: id,
      oldValue: { title: doc.title, status: doc.status },
    });

    if (doc.status === ContentStatus.PUBLISHED) {
      await triggerWebRevalidate(["web:documents", "web:sitemap"]);
    }

    revalidatePath("/documents");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

async function changeDocumentStatus(
  id: string,
  apply: typeof applyPublish | typeof applyUnpublish | typeof applyArchive,
  action: "PUBLISH" | "UNPUBLISH" | "STATUS_CHANGE",
) {
  const session = await assertPermission("document:publish");
  const doc = await prisma.document.findFirst({
    where: { id, deletedAt: null },
  });
  if (!doc) {
    return { ok: false as const, message: "Không tìm thấy tài liệu." };
  }

  // Document model has no publishedAt — map status only via lifecycle helpers' status field
  const next = apply({
    status: doc.status,
    publishedAt: null,
  });

  const updated = await prisma.document.update({
    where: { id },
    data: { status: next.status },
  });

  await writeAuditLog({
    userId: session.user.id,
    action,
    resource: "DOCUMENT",
    resourceId: id,
    oldValue: { status: doc.status },
    newValue: { status: updated.status },
  });

  await triggerWebRevalidate(["web:documents", "web:sitemap"]);
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  return { ok: true as const };
}

export async function publishDocumentAction(id: string) {
  try {
    return await changeDocumentStatus(id, applyPublish, "PUBLISH");
  } catch (error) {
    return toActionError(error);
  }
}

export async function unpublishDocumentAction(id: string) {
  try {
    return await changeDocumentStatus(id, applyUnpublish, "UNPUBLISH");
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveDocumentAction(id: string) {
  try {
    return await changeDocumentStatus(id, applyArchive, "STATUS_CHANGE");
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

export async function createDocumentCategoryAction(
  input: z.input<typeof categorySchema>,
) {
  try {
    const session = await assertPermission("document:create");
    const data = categorySchema.parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const exists = await prisma.documentCategory.findUnique({
      where: { slug: data.slug },
    });
    if (exists) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.documentCategory.create({ data });
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "DOCUMENT_CATEGORY",
      resourceId: category.id,
      newValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/documents/categories");
    revalidatePath("/documents");
    return { ok: true as const, id: category.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateDocumentCategoryAction(
  input: z.input<typeof categorySchema> & { id: string },
) {
  try {
    const session = await assertPermission("document:update");
    const data = categorySchema.extend({ id: z.string().min(1) }).parse({
      ...input,
      slug: slugify(input.slug || input.name),
    });

    const current = await prisma.documentCategory.findUnique({
      where: { id: data.id },
    });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }

    const duplicate = await prisma.documentCategory.findFirst({
      where: { slug: data.slug, id: { not: data.id } },
    });
    if (duplicate) {
      return { ok: false as const, message: "Slug danh mục đã tồn tại." };
    }

    const category = await prisma.documentCategory.update({
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
      resource: "DOCUMENT_CATEGORY",
      resourceId: category.id,
      oldValue: { name: current.name, slug: current.slug, status: current.status },
      newValue: {
        name: category.name,
        slug: category.slug,
        status: category.status,
      },
    });

    revalidatePath("/documents/categories");
    revalidatePath("/documents");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteDocumentCategoryAction(id: string) {
  try {
    const session = await assertPermission("document:delete");
    const category = await prisma.documentCategory.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    });
    if (!category) {
      return { ok: false as const, message: "Không tìm thấy danh mục." };
    }
    if (category._count.documents > 0) {
      return {
        ok: false as const,
        message:
          "Danh mục đang được dùng. Hãy chuyển tài liệu sang danh mục khác trước.",
      };
    }

    await prisma.documentCategory.delete({ where: { id } });
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "DOCUMENT_CATEGORY",
      resourceId: id,
      oldValue: { name: category.name, slug: category.slug },
    });

    revalidatePath("/documents/categories");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
