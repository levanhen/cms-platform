"use server";

import { prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, toActionError } from "@/lib/permissions/assert";
import { SUPER_ADMIN_ROLE_NAME } from "@/lib/permissions/roles";

const roleSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(255).optional().or(z.literal("")),
  permissionIds: z.array(z.string()).default([]),
});

export async function createRoleAction(input: z.infer<typeof roleSchema>) {
  try {
    await assertPermission("role:create");
    const data = roleSchema.parse(input);

    if (data.name === SUPER_ADMIN_ROLE_NAME) {
      return {
        ok: false as const,
        message: "Không thể tạo vai trò trùng tên hệ thống Super Admin.",
      };
    }

    const exists = await prisma.role.findUnique({ where: { name: data.name } });
    if (exists) return { ok: false as const, message: "Tên vai trò đã tồn tại." };

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        isSystem: false,
        permissions: {
          create: data.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    });

    revalidatePath("/roles");
    return { ok: true as const, id: role.id };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateRoleAction(
  id: string,
  input: z.infer<typeof roleSchema>,
) {
  try {
    const session = await assertPermission("role:update");
    const data = roleSchema.parse(input);

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return { ok: false as const, message: "Không tìm thấy vai trò." };

    if (!role.isSystem) {
      const duplicate = await prisma.role.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (duplicate) return { ok: false as const, message: "Tên vai trò đã tồn tại." };
      if (data.name === SUPER_ADMIN_ROLE_NAME) {
        return {
          ok: false as const,
          message: "Không thể đổi tên thành Super Admin.",
        };
      }
    }

    if (role.isSystem) {
      // System roles: description only — permissions are locked.
      await prisma.role.update({
        where: { id },
        data: {
          description: data.description || null,
        },
      });
    } else {
      await prisma.$transaction([
        prisma.role.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description || null,
          },
        }),
        prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        }),
      ]);
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        resource: "ROLE",
        resourceId: id,
        newValue: role.isSystem
          ? { lockedPermissions: true }
          : { permissionCount: data.permissionIds.length },
      },
    });

    revalidatePath("/roles");
    revalidatePath(`/roles/${id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteRoleAction(id: string) {
  try {
    await assertPermission("role:delete");
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) return { ok: false as const, message: "Không tìm thấy vai trò." };
    if (role.isSystem) {
      return { ok: false as const, message: "Không thể xóa vai trò hệ thống." };
    }
    if (role._count.users > 0) {
      return { ok: false as const, message: "Không thể xóa vai trò đang được sử dụng." };
    }

    await prisma.role.delete({ where: { id } });
    revalidatePath("/roles");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
