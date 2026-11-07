import Link from "next/link";
import { ContactMessageStatus, prisma } from "@cms/db";
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
import { ContactRowActions } from "@/features/contacts/contact-row-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", ...Object.values(ContactMessageStatus)] as const;

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "Mới",
  READ: "Đã đọc",
  ARCHIVED: "Lưu trữ",
};

function statusVariant(status: ContactMessageStatus) {
  if (status === "NEW") return "default" as const;
  if (status === "READ") return "success" as const;
  return "muted" as const;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "contact:view");
  const canUpdate = hasPermission(session?.user.permissions, "contact:update");
  const canDelete = hasPermission(session?.user.permissions, "contact:delete");

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
      ? { status: statusFilter as ContactMessageStatus }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows, newCount] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({
      where: { status: ContactMessageStatus.NEW },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    return `/contacts?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Liên hệ"
        description={`${newCount} tin nhắn mới · form website.`}
        breadcrumbs={[{ label: "Liên hệ" }]}
      />

      <FilterBar
        fields={[
          {
            type: "search",
            defaultValue: search,
            placeholder: "Tìm tên, email, chủ đề...",
          },
          {
            type: "select",
            name: "status",
            defaultValue: statusFilter,
            options: [
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "NEW", label: "Mới" },
              { value: "READ", label: "Đã đọc" },
              { value: "ARCHIVED", label: "Lưu trữ" },
            ],
            "aria-label": "Trạng thái",
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState title="Chưa có tin nhắn liên hệ." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người gửi</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Email SMTP</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/contacts/${item.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{item.email}</div>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">{item.subject}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.emailSent ? (
                      <span className="text-xs text-emerald-700">Đã gửi</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa gửi</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>
                    <ContactRowActions
                      id={item.id}
                      status={item.status}
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
