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
import { PageRowActions } from "@/features/pages/page-row-actions";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(ContentStatus)] as const;

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "page:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
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
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, pages] = await Promise.all([
    prisma.page.count({ where }),
    prisma.page.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "page:create");
  const canUpdate = hasPermission(session?.user.permissions, "page:update");
  const canDelete = hasPermission(session?.user.permissions, "page:delete");
  const canPublishContent = hasPermission(
    session?.user.permissions,
    "page:publish",
  );
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    return `/pages?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Trang"
        description="Quản lý trang nội dung tĩnh"
        breadcrumbs={[{ label: "Trang" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/pages/new">Thêm trang</Link>
            </Button>
          ) : null
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
        ]}
      />

      {pages.length === 0 ? (
        <EmptyState
          title="Chưa có trang."
          actionHref={canCreate ? "/pages/new" : undefined}
          actionLabel="Thêm trang"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xuất bản</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ListThumb
                        src={item.featuredImage}
                        alt={item.title}
                        label={item.title}
                      />
                      <div className="min-w-0">
                        {canUpdate ? (
                          <Link
                            href={`/pages/${item.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <div className="font-medium">{item.title}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                  <TableCell>
                    <Badge variant={contentStatusBadgeVariant(item.status)}>
                      {CONTENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.publishedAt ? formatDateTime(item.publishedAt) : "—"}
                  </TableCell>
                  <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                  <TableCell>
                    <PageRowActions
                      pageId={item.id}
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
