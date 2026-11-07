import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { isSuperAdmin, SUPER_ADMIN_ROLE_NAME } from "@/lib/permissions/roles";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { UserForm } from "@/features/users/user-form";

export default async function NewUserPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "user:create");

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const assignableRoles = isSuperAdmin(session?.user.roles)
    ? roles
    : roles.filter((role) => role.name !== SUPER_ADMIN_ROLE_NAME);

  return (
    <div>
      <PageHeader title="Thêm người dùng" description="Tạo tài khoản nội bộ mới" 
        breadcrumbs={[{ label: "Người dùng", href: "/users" }, { label: "Thêm" }]}
      />
      <UserForm roles={assignableRoles} />
    </div>
  );
}
