"use server";

import { prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, toActionError } from "@/lib/permissions/assert";
import { getStorage } from "@/lib/storage";
import { keyFromPublicUrl } from "@/lib/storage/validate";

const updateAltSchema = z.object({
  id: z.string().min(1),
  altText: z.string().max(300).optional(),
});

const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Tên thư mục là bắt buộc.").max(100),
  parentId: z.string().min(1).optional().nullable(),
});

const moveMediaSchema = z.object({
  id: z.string().min(1),
  folderId: z.string().min(1).nullable(),
});

export async function createMediaFolderAction(
  input: z.infer<typeof createFolderSchema>,
) {
  try {
    const session = await assertPermission("media:create");
    const data = createFolderSchema.parse(input);

    if (data.parentId) {
      const parent = await prisma.mediaFolder.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        return { ok: false as const, message: "Không tìm thấy thư mục cha." };
      }
    }

    const duplicate = await prisma.mediaFolder.findFirst({
      where: {
        name: data.name,
        parentId: data.parentId ?? null,
      },
    });
    if (duplicate) {
      return { ok: false as const, message: "Thư mục cùng tên đã tồn tại trong cấp này." };
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "MEDIA_FOLDER",
      resourceId: folder.id,
      newValue: { name: folder.name, parentId: folder.parentId },
    });

    revalidatePath("/media");
    return { ok: true as const, id: folder.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMediaFolderAction(id: string) {
  try {
    const session = await assertPermission("media:delete");
    const folder = await prisma.mediaFolder.findUnique({
      where: { id },
      include: { _count: { select: { children: true, media: true } } },
    });
    if (!folder) {
      return { ok: false as const, message: "Không tìm thấy thư mục." };
    }
    if (folder._count.children > 0) {
      return {
        ok: false as const,
        message: "Hãy xóa hoặc di chuyển thư mục con trước.",
      };
    }

    await prisma.$transaction([
      prisma.media.updateMany({
        where: { folderId: id },
        data: { folderId: null },
      }),
      prisma.mediaFolder.delete({ where: { id } }),
    ]);

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "MEDIA_FOLDER",
      resourceId: id,
      oldValue: { name: folder.name },
    });

    revalidatePath("/media");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveMediaAction(input: z.infer<typeof moveMediaSchema>) {
  try {
    const session = await assertPermission("media:update");
    const data = moveMediaSchema.parse(input);

    const media = await prisma.media.findUnique({ where: { id: data.id } });
    if (!media) {
      return { ok: false as const, message: "Không tìm thấy media." };
    }

    if (data.folderId) {
      const folder = await prisma.mediaFolder.findUnique({
        where: { id: data.folderId },
      });
      if (!folder) {
        return { ok: false as const, message: "Không tìm thấy thư mục." };
      }
    }

    await prisma.media.update({
      where: { id: data.id },
      data: { folderId: data.folderId },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "MEDIA",
      resourceId: data.id,
      oldValue: { folderId: media.folderId },
      newValue: { folderId: data.folderId },
    });

    revalidatePath("/media");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMediaAltAction(input: z.infer<typeof updateAltSchema>) {
  try {
    const session = await assertPermission("media:update");
    const data = updateAltSchema.parse(input);
    const media = await prisma.media.findUnique({ where: { id: data.id } });
    if (!media) {
      return { ok: false as const, message: "Không tìm thấy media." };
    }

    const updated = await prisma.media.update({
      where: { id: data.id },
      data: {
        altText: data.altText?.trim() ? data.altText.trim() : null,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "MEDIA",
      resourceId: data.id,
      oldValue: { altText: media.altText },
      newValue: { altText: updated.altText },
    });

    revalidatePath("/media");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMediaAction(id: string) {
  try {
    const session = await assertPermission("media:delete");
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return { ok: false as const, message: "Không tìm thấy media." };
    }

    const key = keyFromPublicUrl(media.fileUrl);
    if (key) {
      await getStorage().delete(key);
    }

    await prisma.media.delete({ where: { id } });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "MEDIA",
      resourceId: id,
      oldValue: { fileName: media.fileName, fileUrl: media.fileUrl },
    });

    revalidatePath("/media");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
