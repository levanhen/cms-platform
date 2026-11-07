import Link from "next/link";
import {
  Activity,
  Briefcase,
  FileText,
  FolderKanban,
  MessageSquare,
  Newspaper,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import { ContactMessageStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AUDIT_ACTION_LABELS,
  auditResourceLabel,
} from "@/features/audit-logs/labels";
import {
  CONTENT_STATUS_LABELS,
  contentStatusBadgeVariant,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { formatDateTime, formatNumber } from "@/lib/utils";

type RecentContent = {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  status: ContentStatusValue;
  updatedAt: Date;
  href: string;
};

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return formatDateTime(date);
}

export default async function DashboardPage() {
  const session = await auth();
  const permissions = session?.user.permissions ?? [];

  const canViewUsers = hasPermission(permissions, "user:view");
  const canViewPages = hasPermission(permissions, "page:view");
  const canViewServices = hasPermission(permissions, "service:view");
  const canViewProjects = hasPermission(permissions, "project:view");
  const canViewNews = hasPermission(permissions, "news:view");
  const canViewDocuments = hasPermission(permissions, "document:view");
  const canViewContacts = hasPermission(permissions, "contact:view");
  const canViewAudit = hasPermission(permissions, "audit_log:view");
  const hasAnyContentView =
    canViewPages ||
    canViewServices ||
    canViewProjects ||
    canViewNews ||
    canViewDocuments;

  const [
    usersCount,
    servicesCount,
    projectsCount,
    newsCount,
    documentsCount,
    newContactsCount,
    recentLogs,
    recentPages,
    recentServices,
    recentProjects,
    recentNews,
    recentDocuments,
  ] = await Promise.all([
    canViewUsers
      ? prisma.user.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    canViewServices
      ? prisma.service.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    canViewProjects
      ? prisma.project.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    canViewNews
      ? prisma.news.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    canViewDocuments
      ? prisma.document.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    canViewContacts
      ? prisma.contactMessage.count({
          where: { status: ContactMessageStatus.NEW },
        })
      : Promise.resolve(null),
    canViewAudit
      ? prisma.auditLog.findMany({
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    canViewPages
      ? prisma.page.findMany({
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewServices
      ? prisma.service.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewProjects
      ? prisma.project.findMany({
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewNews
      ? prisma.news.findMany({
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewDocuments
      ? prisma.document.findMany({
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const cards = [
    {
      label: "Người dùng",
      value: usersCount,
      href: "/users",
      icon: Users,
      show: usersCount !== null,
      tone: "bg-sky-50 text-sky-700",
      accent: "border-l-sky-500",
    },
    {
      label: "Dịch vụ",
      value: servicesCount,
      href: "/services",
      icon: Briefcase,
      show: servicesCount !== null,
      tone: "bg-indigo-50 text-indigo-700",
      accent: "border-l-indigo-500",
    },
    {
      label: "Dự án",
      value: projectsCount,
      href: "/projects",
      icon: FolderKanban,
      show: projectsCount !== null,
      tone: "bg-violet-50 text-violet-700",
      accent: "border-l-violet-500",
    },
    {
      label: "Tin tức",
      value: newsCount,
      href: "/news",
      icon: Newspaper,
      show: newsCount !== null,
      tone: "bg-cyan-50 text-cyan-700",
      accent: "border-l-cyan-500",
    },
    {
      label: "Tài liệu",
      value: documentsCount,
      href: "/documents",
      icon: FileText,
      show: documentsCount !== null,
      tone: "bg-teal-50 text-teal-700",
      accent: "border-l-teal-500",
    },
    {
      label: "Liên hệ mới",
      value: newContactsCount,
      href: "/contacts?status=NEW",
      icon: MessageSquare,
      show: newContactsCount !== null,
      tone: "bg-rose-50 text-rose-700",
      accent: "border-l-rose-500",
    },
  ].filter((card) => card.show);

  const recentContent: RecentContent[] = [
    ...recentPages.map((item) => ({
      id: item.id,
      title: item.title,
      type: "PAGE",
      typeLabel: "Trang",
      status: item.status as ContentStatusValue,
      updatedAt: item.updatedAt,
      href: `/pages/${item.id}`,
    })),
    ...recentServices.map((item) => ({
      id: item.id,
      title: item.name,
      type: "SERVICE",
      typeLabel: "Dịch vụ",
      status: item.status as ContentStatusValue,
      updatedAt: item.updatedAt,
      href: `/services/${item.id}`,
    })),
    ...recentProjects.map((item) => ({
      id: item.id,
      title: item.title,
      type: "PROJECT",
      typeLabel: "Dự án",
      status: item.status as ContentStatusValue,
      updatedAt: item.updatedAt,
      href: `/projects/${item.id}`,
    })),
    ...recentNews.map((item) => ({
      id: item.id,
      title: item.title,
      type: "NEWS",
      typeLabel: "Tin tức",
      status: item.status as ContentStatusValue,
      updatedAt: item.updatedAt,
      href: `/news/${item.id}`,
    })),
    ...recentDocuments.map((item) => ({
      id: item.id,
      title: item.title,
      type: "DOCUMENT",
      typeLabel: "Tài liệu",
      status: item.status as ContentStatusValue,
      updatedAt: item.updatedAt,
      href: `/documents/${item.id}`,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10);

  const quickActions = [
    hasPermission(permissions, "news:create")
      ? { href: "/news/new", label: "Thêm tin tức", icon: Plus }
      : null,
    hasPermission(permissions, "page:create")
      ? { href: "/pages/new", label: "Thêm trang", icon: Plus }
      : null,
    hasPermission(permissions, "project:create")
      ? { href: "/projects/new", label: "Thêm dự án", icon: Plus }
      : null,
    hasPermission(permissions, "service:create")
      ? { href: "/services/new", label: "Thêm dịch vụ", icon: Plus }
      : null,
    hasPermission(permissions, "document:create")
      ? { href: "/documents/new", label: "Tải tài liệu", icon: Upload }
      : null,
    canViewContacts
      ? {
          href: "/contacts?status=NEW",
          label:
            newContactsCount && newContactsCount > 0
              ? `Liên hệ mới (${newContactsCount})`
              : "Hộp thư liên hệ",
          icon: MessageSquare,
        }
      : null,
  ].filter(Boolean) as { href: string; label: string; icon: typeof Plus }[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tổng quan"
        description={`Xin chào, ${session?.user.name ?? "bạn"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group">
              <Card
                className={`h-full overflow-hidden border-l-4 ${card.accent} transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md`}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`rounded-lg p-2.5 ${card.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatNumber(card.value ?? 0)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-primary opacity-80 group-hover:opacity-100">
                    Xem tất cả →
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {canViewAudit ? (
          <Card className="overflow-hidden border-l-4 border-l-violet-500">
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/90 to-transparent px-6 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                  <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  Hoạt động gần đây
                </h2>
                <Link
                  href="/audit-logs"
                  className="text-sm font-medium text-violet-700 hover:underline"
                >
                  Xem nhật ký
                </Link>
              </div>
            </div>
            <CardContent className="p-6 pt-4">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có hoạt động.
                </p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {recentLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-start justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div>
                        <div className="font-medium">
                          {AUDIT_ACTION_LABELS[log.action]} ·{" "}
                          {auditResourceLabel(log.resource)}
                        </div>
                        <div className="text-muted-foreground">
                          {log.user?.name ?? "Hệ thống"}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
                        {relativeTime(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {hasAnyContentView ? (
          <Card className="overflow-hidden border-l-4 border-l-sky-500">
            <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50/90 to-transparent px-6 py-3.5">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <span className="rounded-md bg-sky-100 p-1.5 text-sky-700">
                  <Newspaper className="h-3.5 w-3.5" />
                </span>
                Nội dung mới cập nhật
              </h2>
            </div>
            <CardContent className="p-6 pt-4">
              {recentContent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có nội dung.
                </p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {recentContent.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 text-sm transition-colors hover:bg-sky-50/60"
                      >
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge variant="muted">{item.typeLabel}</Badge>
                            <Badge
                              variant={contentStatusBadgeVariant(item.status)}
                            >
                              {CONTENT_STATUS_LABELS[item.status]}
                            </Badge>
                          </div>
                          <div className="font-medium">{item.title}</div>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {relativeTime(item.updatedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {quickActions.length > 0 ? (
        <Card className="overflow-hidden border-l-4 border-l-primary border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-sky-50/40">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="rounded-md bg-primary/15 p-1.5 text-primary">
                <Plus className="h-3.5 w-3.5" />
              </span>
              Thao tác nhanh
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    asChild
                    variant="secondary"
                    size="sm"
                    className="border border-primary/15 bg-white/80 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <Link href={action.href}>
                      <Icon className="mr-1.5 h-4 w-4 text-primary" />
                      {action.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
