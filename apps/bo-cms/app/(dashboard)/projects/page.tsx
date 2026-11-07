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
import { ProjectRowActions } from "@/features/projects/project-row-actions";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

const STATUS_FILTERS = ["ALL", ...Object.values(ContentStatus)] as const;

function formatDateOnly(value?: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(value);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "project:view");

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
            { clientName: { contains: search, mode: "insensitive" as const } },
            {
              category: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        clientName: true,
        location: true,
        featuredImage: true,
        startDate: true,
        endDate: true,
        displayOrder: true,
        status: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "project:create");
  const canUpdate = hasPermission(session?.user.permissions, "project:update");
  const canDelete = hasPermission(session?.user.permissions, "project:delete");
  const canPublishContent = hasPermission(
    session?.user.permissions,
    "project:publish",
  );
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    return `/projects?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Dự án"
        description="Quản lý dự án / portfolio"
        breadcrumbs={[{ label: "Dự án" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/projects/categories">Danh mục</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/projects/new">Thêm dự án</Link>
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
            placeholder: "Tìm theo tiêu đề, khách hàng, danh mục...",
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

      {projects.length === 0 ? (
        <EmptyState
          title="Chưa có dự án."
          actionHref={canCreate ? "/projects/new" : undefined}
          actionLabel="Thêm dự án"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((item) => {
                const start = formatDateOnly(item.startDate);
                const end = formatDateOnly(item.endDate);
                const timeline =
                  start || end ? [start ?? "…", end ?? "…"].join(" → ") : "—";
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.displayOrder}</TableCell>
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
                              href={`/projects/${item.id}`}
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
                    <TableCell>{item.clientName ?? "—"}</TableCell>
                    <TableCell>{item.category?.name ?? "—"}</TableCell>
                    <TableCell>{timeline}</TableCell>
                    <TableCell>
                      <Badge variant={contentStatusBadgeVariant(item.status)}>
                        {CONTENT_STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProjectRowActions
                        projectId={item.id}
                        status={item.status}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        canPublishContent={canPublishContent}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
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
