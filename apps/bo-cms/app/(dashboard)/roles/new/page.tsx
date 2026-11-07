import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { RoleForm } from "@/features/roles/role-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewRolePage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "role:create");

  const permissions = await prisma.permission.findMany({
    orderBy: [{ groupName: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Thêm vai trò" 
        breadcrumbs={[{ label: "Vai trò", href: "/roles" }, { label: "Thêm" }]}
      />
      <RoleForm permissions={permissions} />
    </div>
  );
}
