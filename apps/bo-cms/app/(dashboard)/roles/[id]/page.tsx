import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RoleForm } from "@/features/roles/role-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "role:update");

  const { id } = await params;
  const [role, permissions] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    }),
    prisma.permission.findMany({
      orderBy: [{ groupName: "asc" }, { code: "asc" }],
    }),
  ]);

  if (!role) notFound();

  return (
    <div>
      <PageHeader title="Sửa vai trò" description={role.name} 
        breadcrumbs={[{ label: "Vai trò", href: "/roles" }, { label: "Sửa" }]}
      />
      <RoleForm
        permissions={permissions}
        lockName={role.isSystem}
        lockPermissions={role.isSystem}
        initial={{
          id: role.id,
          name: role.name,
          description: role.description,
          permissionIds: role.permissions.map((item) => item.permissionId),
        }}
      />
    </div>
  );
}
