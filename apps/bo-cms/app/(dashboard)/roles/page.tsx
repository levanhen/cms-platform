import Link from "next/link";
import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleRowActions } from "@/features/roles/role-row-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function RolesPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "role:view");

  const roles = await prisma.role.findMany({
    include: {
      _count: { select: { users: true, permissions: true } },
    },
    orderBy: { name: "asc" },
  });

  const canCreate = hasPermission(session?.user.permissions, "role:create");
  const canUpdate = hasPermission(session?.user.permissions, "role:update");
  const canDelete = hasPermission(session?.user.permissions, "role:delete");

  return (
    <div>
      <PageHeader
        title="Vai trò"
        description="Quản lý role và gán permission"
        breadcrumbs={[{ label: "Vai trò" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/roles/new">Thêm vai trò</Link>
            </Button>
          ) : null
        }
      />

      {roles.length === 0 ? (
        <EmptyState title="Chưa có vai trò." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Hệ thống</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {canUpdate ? (
                      <Link
                        href={`/roles/${role.id}`}
                        className="text-foreground hover:text-primary hover:underline"
                      >
                        {role.name}
                      </Link>
                    ) : (
                      role.name
                    )}
                  </TableCell>
                  <TableCell>{role.description || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? "default" : "muted"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>{role._count.users}</TableCell>
                  <TableCell>{role._count.permissions}</TableCell>
                  <TableCell>
                    <RoleRowActions
                      roleId={role.id}
                      canUpdate={canUpdate}
                      canDelete={canDelete && !role.isSystem && role._count.users === 0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
