import Link from "next/link";
import { ContentStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
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
import { DocumentRowActions } from "@/features/documents/document-row-actions";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime, formatNumber } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(ContentStatus)] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:view");

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
            { fileName: { contains: search, mode: "insensitive" as const } },
            {
              category: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        uploadedBy: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "document:create");
  const canUpdate = hasPermission(session?.user.permissions, "document:update");
  const canDelete = hasPermission(session?.user.permissions, "document:delete");
  const canPublishContent = hasPermission(
    session?.user.permissions,
    "document:publish",
  );
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    return `/documents?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Tài liệu"
        description="Upload và xuất bản tài liệu nghiệp vụ"
        breadcrumbs={[{ label: "Tài liệu" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/documents/categories">Danh mục</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/documents/new">Tải lên tài liệu</Link>
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
            placeholder: "Tìm theo tiêu đề, tên file, danh mục...",
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

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có tài liệu."
          actionHref={canCreate ? "/documents/new" : undefined}
          actionLabel="Tải lên tài liệu"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tải</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {canUpdate ? (
                      <Link
                        href={`/documents/${item.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <div className="font-medium">{item.title}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {item.fileName}
                    </div>
                  </TableCell>
                  <TableCell className="uppercase">{item.fileType}</TableCell>
                  <TableCell>{item.category?.name ?? "—"}</TableCell>
                  <TableCell>{formatNumber(item.fileSize)}</TableCell>
                  <TableCell>
                    <Badge variant={contentStatusBadgeVariant(item.status)}>
                      {CONTENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{item.uploadedBy.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DocumentRowActions
                      documentId={item.id}
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
