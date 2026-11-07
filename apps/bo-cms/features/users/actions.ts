"use server";

import { hash } from "bcryptjs";
import { prisma, UserStatus } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, toActionError } from "@/lib/permissions/assert";
import {
  isSuperAdmin,
  SUPER_ADMIN_ROLE_NAME,
} from "@/lib/permissions/roles";

async function assertAssignableRole(
  actorRoles: string[],
  roleId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { ok: false, message: "Vai trò không hợp lệ." };
  if (role.name === SUPER_ADMIN_ROLE_NAME && !isSuperAdmin(actorRoles)) {
    return {
      ok: false,
      message: "Chỉ Super Admin mới được gán vai trò Super Admin.",
    };
  }
  return { ok: true };
}

async function userHasSuperAdminRole(userId: string) {
  const count = await prisma.userRole.count({
    where: { userId, role: { name: SUPER_ADMIN_ROLE_NAME } },
  });
  return count > 0;
}

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(100),
  roleId: z.string().min(1),
  status: z.nativeEnum(UserStatus),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(100).optional().or(z.literal("")),
  roleId: z.string().min(1),
  status: z.nativeEnum(UserStatus),
});

export async function createUserAction(input: z.infer<typeof createUserSchema>) {
  try {
    const session = await assertPermission("user:create");
    const data = createUserSchema.parse(input);

    const roleCheck = await assertAssignableRole(session.user.roles, data.roleId);
    if (!roleCheck.ok) return { ok: false as const, message: roleCheck.message };

    const exists = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: data.email }, { username: data.username }],
      },
    });
    if (exists) {
      return { ok: false as const, message: "Email hoặc tên đăng nhập đã tồn tại." };
    }

    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        name: data.name,
        passwordHash,
        status: data.status,
        roles: { create: [{ roleId: data.roleId }] },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        resource: "USER",
        resourceId: user.id,
        newValue: { email: user.email, username: user.username, status: user.status },
      },
    });

    revalidatePath("/users");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateUserAction(input: z.infer<typeof updateUserSchema>) {
  try {
    const session = await assertPermission("user:update");
    const data = updateUserSchema.parse(input);

    const current = await prisma.user.findFirst({
      where: { id: data.id, deletedAt: null },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!current) return { ok: false as const, message: "Không tìm thấy người dùng." };

    if (current.id === session.user.id && data.status === UserStatus.INACTIVE) {
      return { ok: false as const, message: "Bạn không thể vô hiệu hóa chính mình." };
    }

    const targetWasSuperAdmin = current.roles.some(
      (item) => item.role.name === SUPER_ADMIN_ROLE_NAME,
    );
    if (targetWasSuperAdmin && !isSuperAdmin(session.user.roles)) {
      return {
        ok: false as const,
        message: "Chỉ Super Admin mới được sửa tài khoản Super Admin.",
      };
    }

    const roleCheck = await assertAssignableRole(session.user.roles, data.roleId);
    if (!roleCheck.ok) return { ok: false as const, message: roleCheck.message };

    const duplicate = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        id: { not: data.id },
        OR: [{ email: data.email }, { username: data.username }],
      },
    });
    if (duplicate) {
      return { ok: false as const, message: "Email hoặc tên đăng nhập đã tồn tại." };
    }

    const passwordHash = data.password
      ? await hash(data.password, 12)
      : undefined;

    const oldRoleId = current.roles[0]?.roleId;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email,
          username: data.username,
          name: data.name,
          status: data.status,
          ...(passwordHash ? { passwordHash } : {}),
        },
      }),
      prisma.userRole.deleteMany({ where: { userId: data.id } }),
      prisma.userRole.create({
        data: { userId: data.id, roleId: data.roleId },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: oldRoleId !== data.roleId ? "ROLE_CHANGE" : "UPDATE",
        resource: "USER",
        resourceId: data.id,
        oldValue: {
          email: current.email,
          status: current.status,
          roleId: oldRoleId,
        },
        newValue: {
          email: data.email,
          status: data.status,
          roleId: data.roleId,
        },
      },
    });

    revalidatePath("/users");
    revalidatePath(`/users/${data.id}`);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteUserAction(id: string) {
  try {
    const session = await assertPermission("user:delete");
    if (session.user.id === id) {
      return { ok: false as const, message: "Bạn không thể xóa chính mình." };
    }

    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) return { ok: false as const, message: "Không tìm thấy người dùng." };

    if (
      (await userHasSuperAdminRole(id)) &&
      !isSuperAdmin(session.user.roles)
    ) {
      return {
        ok: false as const,
        message: "Chỉ Super Admin mới được xóa tài khoản Super Admin.",
      };
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        resource: "USER",
        resourceId: id,
      },
    });

    revalidatePath("/users");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
