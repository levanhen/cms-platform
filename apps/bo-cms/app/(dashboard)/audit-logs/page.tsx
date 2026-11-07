import Link from "next/link";
import { AuditAction, prisma } from "@cms/db";
import { auth } from "@/auth";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/layout/filter-bar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditLogDetailButton } from "@/features/audit-logs/audit-log-detail-button";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  auditResourceLabel,
} from "@/features/audit-logs/labels";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";

const RESOURCES = [
  "USER",
  "ROLE",
  "PAGE",
  "SERVICE",
  "PROJECT",
  "NEWS",
  "NEWS_CATEGORY",
  "PROJECT_CATEGORY",
  "DOCUMENT_CATEGORY",
  "DOCUMENT",
  "MEDIA",
  "MEDIA_FOLDER",
  "SETTING",
  "NEWSLETTER",
] as const;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    action?: string;
    resource?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "audit_log:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const actionParam = params.action?.toUpperCase() ?? "ALL";
  const resourceParam = params.resource?.toUpperCase() ?? "ALL";
  const actionFilter = AUDIT_ACTIONS.includes(actionParam as AuditAction)
    ? (actionParam as AuditAction)
    : null;
  const resourceFilter = RESOURCES.includes(
    resourceParam as (typeof RESOURCES)[number],
  )
    ? resourceParam
    : null;

  const fromDate = params.from ? new Date(params.from) : null;
  const toDate = params.to ? new Date(params.to) : null;
  const fromValid = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null;
  const toValid = toDate && !Number.isNaN(toDate.getTime()) ? toDate : null;
  if (toValid) toValid.setHours(23, 59, 59, 999);

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 20;

  const where = {
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(resourceFilter ? { resource: resourceFilter } : {}),
    ...(fromValid || toValid
      ? {
          createdAt: {
            ...(fromValid ? { gte: fromValid } : {}),
            ...(toValid ? { lte: toValid } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { resourceId: { contains: search, mode: "insensitive" as const } },
            { resource: { contains: search, mode: "insensitive" as const } },
            {
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (actionFilter) query.set("action", actionFilter);
    if (resourceFilter) query.set("resource", resourceFilter);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return `/audit-logs?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Nhật ký hệ thống"
        description="Theo dõi thao tác quan trọng (chỉ xem)"
      
        breadcrumbs={[{ label: "Nhật ký" }]}
      />

      <FilterBar
        fields={[
          {
            type: "search",
            defaultValue: search,
            placeholder: "Tìm user, resource ID...",
            className: "xl:min-w-[240px]",
          },
          {
            type: "select",
            name: "action",
            defaultValue: actionFilter ?? "ALL",
            "aria-label": "Hành động",
            options: [
              { value: "ALL", label: "Tất cả hành động" },
              ...AUDIT_ACTIONS.map((action) => ({
                value: action,
                label: AUDIT_ACTION_LABELS[action],
              })),
            ],
          },
          {
            type: "select",
            name: "resource",
            defaultValue: resourceFilter ?? "ALL",
            "aria-label": "Tài nguyên",
            options: [
              { value: "ALL", label: "Tất cả tài nguyên" },
              ...RESOURCES.map((resource) => ({
                value: resource,
                label: auditResourceLabel(resource),
              })),
            ],
          },
          {
            type: "date",
            name: "from",
            label: "Từ ngày",
            defaultValue: params.from ?? "",
          },
          {
            type: "date",
            name: "to",
            label: "Đến ngày",
            defaultValue: params.to ?? "",
          },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState title="Chưa có nhật ký." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Tài nguyên</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.user?.name ?? "Hệ thống"}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.user?.email ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">{AUDIT_ACTION_LABELS[item.action]}</Badge>
                  </TableCell>
                  <TableCell>{auditResourceLabel(item.resource)}</TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs">
                    {item.resourceId ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AuditLogDetailButton
                      log={{
                        id: item.id,
                        action: item.action,
                        resource: item.resource,
                        resourceId: item.resourceId,
                        oldValue: item.oldValue,
                        newValue: item.newValue,
                        ipAddress: item.ipAddress,
                        userAgent: item.userAgent,
                        createdAt: item.createdAt.toISOString(),
                        userName: item.user?.name ?? null,
                        userEmail: item.user?.email ?? null,
                      }}
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
