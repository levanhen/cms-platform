import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactMessageStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactDetailActions } from "@/features/contacts/contact-detail-actions";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { formatDateTime } from "@/lib/utils";
import { markContactReadOnView } from "@/features/contacts/mark-read-on-view";

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "Mới",
  READ: "Đã đọc",
  ARCHIVED: "Lưu trữ",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "contact:view");

  const { id } = await params;
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) notFound();

  const canUpdate = hasPermission(session?.user.permissions, "contact:update");
  const canDelete = hasPermission(session?.user.permissions, "contact:delete");

  if (canUpdate && message.status === ContactMessageStatus.NEW) {
    await markContactReadOnView(message.id);
    message.status = ContactMessageStatus.READ;
  }

  return (
    <div>
      <PageHeader
        title={message.subject}
        description={`${message.name} · ${formatDateTime(message.createdAt)}`}
        breadcrumbs={[
          { label: "Liên hệ", href: "/contacts" },
          { label: "Chi tiết" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/contacts">Quay lại</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>{STATUS_LABELS[message.status]}</Badge>
        {message.emailSent ? (
          <Badge variant="muted">SMTP đã gửi</Badge>
        ) : (
          <Badge variant="muted">SMTP chưa gửi</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên" value={message.name} />
            <Field label="Email" value={message.email} />
            <Field label="Điện thoại" value={message.phone || "—"} />
            <Field label="Chủ đề" value={message.subject} />
          </dl>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nội dung
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.message}
            </p>
          </div>
          {message.emailError ? (
            <p className="text-xs text-muted-foreground">
              Ghi chú SMTP: {message.emailError}
            </p>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>IP: {message.ipAddress || "—"}</p>
            <p className="break-all">UA: {message.userAgent || "—"}</p>
            <p>Tạo: {formatDateTime(message.createdAt)}</p>
          </div>
          <ContactDetailActions
            id={message.id}
            status={message.status}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
          <a
            className="inline-flex text-sm text-primary hover:underline"
            href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
          >
            Trả lời qua email
          </a>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
