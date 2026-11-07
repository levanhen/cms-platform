import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { isSuperAdmin, SUPER_ADMIN_ROLE_NAME } from "@/lib/permissions/roles";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { UserForm } from "@/features/users/user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "user:update");

  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: true },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!user) notFound();

  const assignableRoles = isSuperAdmin(session?.user.roles)
    ? roles
    : roles.filter((role) => role.name !== SUPER_ADMIN_ROLE_NAME);

  return (
    <div>
      <PageHeader title="Sửa người dùng" description={user.email} 
        breadcrumbs={[{ label: "Người dùng", href: "/users" }, { label: "Sửa" }]}
      />
      <UserForm
        roles={assignableRoles}
        initial={{
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          status: user.status,
          roleId: user.roles[0]?.roleId ?? assignableRoles[0]?.id ?? "",
        }}
      />
    </div>
  );
}
