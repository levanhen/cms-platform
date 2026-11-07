import Link from "next/link";
import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/layout/filter-bar";
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
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";
import { UserRowActions } from "@/features/users/user-row-actions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "user:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 20;
  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        status: true,
        createdAt: true,
        roles: { select: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "user:create");
  const canUpdate = hasPermission(session?.user.permissions, "user:update");
  const canDelete = hasPermission(session?.user.permissions, "user:delete");
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản nội bộ"
        breadcrumbs={[{ label: "Người dùng" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/users/new">Thêm người dùng</Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        fields={[
          {
            type: "search",
            defaultValue: search,
            placeholder: "Tìm theo tên, email, username...",
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState title="Chưa có người dùng." actionHref={canCreate ? "/users/new" : undefined} actionLabel="Thêm người dùng" />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {canUpdate ? (
                      <Link
                        href={`/users/${user.id}`}
                        className="text-foreground hover:text-primary hover:underline"
                      >
                        {user.name}
                      </Link>
                    ) : (
                      user.name
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {user.roles.map((item) => item.role.name).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "muted"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>
                    <UserRowActions
                      userId={user.id}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Trang {page}/{totalPages} · {total} bản ghi
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="text-primary hover:underline" href={`/users?page=${page - 1}&search=${encodeURIComponent(search)}`}>
              Trước
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className="text-primary hover:underline" href={`/users?page=${page + 1}&search=${encodeURIComponent(search)}`}>
              Sau
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
