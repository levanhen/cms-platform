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
import { ServiceRowActions } from "@/features/services/service-row-actions";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime, formatNumber } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(ContentStatus)] as const;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "service:view");

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
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, services] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        featuredImage: true,
        price: true,
        displayOrder: true,
        status: true,
        updatedAt: true,
      },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "service:create");
  const canUpdate = hasPermission(session?.user.permissions, "service:update");
  const canDelete = hasPermission(session?.user.permissions, "service:delete");
  const canPublishContent = hasPermission(
    session?.user.permissions,
    "service:publish",
  );
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    return `/services?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Dịch vụ"
        description="Quản lý danh mục dịch vụ"
        breadcrumbs={[{ label: "Dịch vụ" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/services/new">Thêm dịch vụ</Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        fields={[
          {
            type: "search",
            defaultValue: search,
            placeholder: "Tìm theo tên, slug, danh mục...",
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

      {services.length === 0 ? (
        <EmptyState
          title="Chưa có dịch vụ."
          actionHref={canCreate ? "/services/new" : undefined}
          actionLabel="Thêm dịch vụ"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.displayOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ListThumb
                        src={item.featuredImage}
                        alt={item.name}
                        label={item.name}
                      />
                      <div className="min-w-0">
                        {canUpdate ? (
                          <Link
                            href={`/services/${item.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <div className="font-medium">{item.name}</div>
                        )}
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell>
                    {item.price != null ? formatNumber(Number(item.price)) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={contentStatusBadgeVariant(item.status)}>
                      {CONTENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                  <TableCell>
                    <ServiceRowActions
                      serviceId={item.id}
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
