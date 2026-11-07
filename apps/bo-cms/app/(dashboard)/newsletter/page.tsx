import Link from "next/link";
import { NewsletterStatus, prisma } from "@cms/db";
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
import { NewsletterRowActions } from "@/features/newsletter/newsletter-row-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(NewsletterStatus)] as const;

const STATUS_LABELS: Record<NewsletterStatus, string> = {
  ACTIVE: "Đang nhận",
  UNSUBSCRIBED: "Đã hủy",
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "newsletter:view");
  const canDelete = hasPermission(session?.user.permissions, "newsletter:delete");

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
    ...(statusFilter !== "ALL"
      ? { status: statusFilter as NewsletterStatus }
      : {}),
    ...(search
      ? { email: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [total, rows, activeCount] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({
      where: { status: NewsletterStatus.ACTIVE },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (statusFilter !== "ALL") query.set("status", statusFilter);
  const qs = query.toString();

  return (
    <div>
      <PageHeader
        title="Đăng ký nhận tin"
        description={`${activeCount} email đang nhận tin · quản lý subscriber từ footer website.`}
        actions={
          <Button asChild variant="outline">
            <a href={`/newsletter/export${qs ? `?${qs}` : ""}`}>Xuất CSV</a>
          </Button>
        }
      />

      <FilterBar
        fields={[
          {
            type: "search",
            placeholder: "Tìm theo email…",
            defaultValue: search,
          },
          {
            type: "select",
            name: "status",
            defaultValue: statusFilter,
            "aria-label": "Trạng thái",
            options: [
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "ACTIVE", label: "Đang nhận" },
              { value: "UNSUBSCRIBED", label: "Đã hủy" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState title="Chưa có đăng ký nhận tin" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Đăng ký lúc</TableHead>
                <TableHead>Hủy lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === NewsletterStatus.ACTIVE ? "success" : "muted"
                      }
                    >
                      {STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.source || "—"}
                  </TableCell>
                  <TableCell>{formatDateTime(row.subscribedAt)}</TableCell>
                  <TableCell>
                    {row.unsubscribedAt ? formatDateTime(row.unsubscribedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <NewsletterRowActions
                      id={row.id}
                      email={row.email}
                      canDelete={canDelete}
                      isActive={row.status === NewsletterStatus.ACTIVE}
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
            <Link
              className="text-primary hover:underline"
              href={`/newsletter?page=${page - 1}${qs ? `&${qs}` : ""}`}
            >
              Trước
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              className="text-primary hover:underline"
              href={`/newsletter?page=${page + 1}${qs ? `&${qs}` : ""}`}
            >
              Sau
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
