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
import { DocumentCategoryRowActions } from "@/features/documents/category-row-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function DocumentCategoriesPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:view");

  const categories = await prisma.documentCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  const canCreate = hasPermission(session?.user.permissions, "document:create");
  const canUpdate = hasPermission(session?.user.permissions, "document:update");
  const canDelete = hasPermission(session?.user.permissions, "document:delete");

  return (
    <div>
      <PageHeader
        title="Danh mục tài liệu"
        description="Quản lý category cho module Documents"
        breadcrumbs={[{ label: "Tài liệu", href: "/documents" }, { label: "Danh mục" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/documents">← Tài liệu</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/documents/categories/new">Thêm danh mục</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục."
          actionHref={canCreate ? "/documents/categories/new" : undefined}
          actionLabel="Thêm danh mục"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tài liệu</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {canUpdate ? (
                      <Link
                        href={`/documents/categories/${category.id}`}
                        className="text-foreground hover:text-primary hover:underline"
                      >
                        {category.name}
                      </Link>
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant={category.status === "ACTIVE" ? "success" : "muted"}
                    >
                      {category.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{category._count.documents}</TableCell>
                  <TableCell>
                    <DocumentCategoryRowActions
                      categoryId={category.id}
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
    </div>
  );
}
