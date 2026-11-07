import Link from "next/link";
import { ContentStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { ListThumb } from "@/components/layout/list-thumb";
import {
  CONTENT_STATUS_FILTER_OPTIONS,
  FilterBar,
} from "@/components/layout/filter-bar";
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
import { NewsRowActions } from "@/features/news/news-row-actions";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(ContentStatus)] as const;

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    status?: string;
    categoryId?: string;
  }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const categoryId = params.categoryId?.trim() || "";
  const statusParam = params.status?.toUpperCase() ?? "ALL";
  const statusFilter = STATUS_FILTERS.includes(
    statusParam as (typeof STATUS_FILTERS)[number],
  )
    ? (statusParam as (typeof STATUS_FILTERS)[number])
    : "ALL";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 20;

  const where = {
    deletedAt: null,
    ...(statusFilter !== "ALL"
      ? { status: statusFilter as ContentStatus }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { excerpt: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items, categories] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "news:create");
  const canUpdate = hasPermission(session?.user.permissions, "news:update");
  const canDelete = hasPermission(session?.user.permissions, "news:delete");
  const canPublishContent = hasPermission(
    session?.user.permissions,
    "news:publish",
  );
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (categoryId) query.set("categoryId", categoryId);
    return `/news?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Tin tức"
        description="Quản lý bài viết / tin tức"
        breadcrumbs={[{ label: "Tin tức" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/news/categories">Danh mục</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/news/new">Thêm tin</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <FilterBar
        fields={[
          {
            type: "search",
            defaultValue: search,
            placeholder: "Tìm theo tiêu đề, slug...",
          },
          {
            type: "select",
            name: "status",
            defaultValue: statusFilter,
            options: CONTENT_STATUS_FILTER_OPTIONS,
            "aria-label": "Trạng thái",
          },
          {
            type: "select",
            name: "categoryId",
            defaultValue: categoryId,
            "aria-label": "Danh mục",
            options: [
              { value: "", label: "Tất cả danh mục" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ],
          },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có tin tức."
          actionHref={canCreate ? "/news/new" : undefined}
          actionLabel="Thêm tin"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xuất bản</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ListThumb
                        src={item.thumbnail || item.featuredImage}
                        alt={item.title}
                        label={item.title}
                      />
                      <div className="min-w-0">
                        {canUpdate ? (
                          <Link
                            href={`/news/${item.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <div className="font-medium">{item.title}</div>
                        )}
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.category?.name ?? "—"}</TableCell>
                  <TableCell>{item.author.name}</TableCell>
                  <TableCell>
                    <Badge variant={contentStatusBadgeVariant(item.status)}>
                      {CONTENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.publishedAt ? formatDateTime(item.publishedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <NewsRowActions
                      newsId={item.id}
                      status={item.status}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      canPublishContent={canPublishContent}
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
            <Link className="text-primary hover:underline" href={hrefFor(page - 1)}>
              Trước
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className="text-primary hover:underline" href={hrefFor(page + 1)}>
              Sau
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
