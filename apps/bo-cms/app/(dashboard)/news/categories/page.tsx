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
import { CategoryRowActions } from "@/features/news/category-row-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewsCategoriesPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:view");

  const categories = await prisma.newsCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { news: true } } },
  });

  const canCreate = hasPermission(session?.user.permissions, "news:create");
  const canUpdate = hasPermission(session?.user.permissions, "news:update");
  const canDelete = hasPermission(session?.user.permissions, "news:delete");

  return (
    <div>
      <PageHeader
        title="Danh mục tin tức"
        description="Quản lý category cho module News"
        breadcrumbs={[{ label: "Tin tức", href: "/news" }, { label: "Danh mục" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/news">← Tin tức</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/news/categories/new">Thêm danh mục</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục."
          actionHref={canCreate ? "/news/categories/new" : undefined}
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
                <TableHead>Số tin</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {canUpdate ? (
                      <Link
                        href={`/news/categories/${category.id}`}
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
                  <TableCell>{category._count.news}</TableCell>
                  <TableCell>
                    <CategoryRowActions
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
