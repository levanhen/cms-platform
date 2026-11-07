"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const FRONTEND_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
).replace(/\/$/, "");

const ROUTE_TITLES: { match: RegExp; title: string; subtitle?: string }[] = [
  { match: /^\/dashboard\/?$/, title: "Tổng quan", subtitle: "Bảng điều khiển" },
  { match: /^\/pages(\/|$)/, title: "Trang", subtitle: "Quản lý trang nội dung" },
  { match: /^\/services(\/|$)/, title: "Dịch vụ", subtitle: "Quản lý dịch vụ" },
  {
    match: /^\/projects\/categories(\/|$)/,
    title: "Danh mục dự án",
    subtitle: "Phân loại dự án",
  },
  { match: /^\/projects(\/|$)/, title: "Dự án", subtitle: "Quản lý dự án" },
  {
    match: /^\/news\/categories(\/|$)/,
    title: "Danh mục tin",
    subtitle: "Phân loại tin tức",
  },
  { match: /^\/news(\/|$)/, title: "Tin tức", subtitle: "Quản lý bài viết" },
  {
    match: /^\/documents\/categories(\/|$)/,
    title: "Danh mục tài liệu",
    subtitle: "Phân loại tài liệu",
  },
  {
    match: /^\/documents(\/|$)/,
    title: "Tài liệu",
    subtitle: "Quản lý tài liệu",
  },
  { match: /^\/media(\/|$)/, title: "Thư viện media", subtitle: "Ảnh & tệp" },
  { match: /^\/users(\/|$)/, title: "Người dùng", subtitle: "Quản trị tài khoản" },
  { match: /^\/roles(\/|$)/, title: "Vai trò", subtitle: "Phân quyền theo vai trò" },
  {
    match: /^\/permissions(\/|$)/,
    title: "Quyền",
    subtitle: "Danh sách permission",
  },
  {
    match: /^\/audit-logs(\/|$)/,
    title: "Nhật ký",
    subtitle: "Lịch sử hoạt động",
  },
  { match: /^\/settings(\/|$)/, title: "Cài đặt", subtitle: "Cấu hình hệ thống" },
  {
    match: /^\/contacts(\/|$)/,
    title: "Liên hệ",
    subtitle: "Tin nhắn từ form website",
  },
  {
    match: /^\/newsletter(\/|$)/,
    title: "Nhận tin",
    subtitle: "Đăng ký newsletter · export CSV",
  },
  {
    match: /^\/forbidden\/?$/,
    title: "Không có quyền",
    subtitle: "Truy cập bị từ chối",
  },
];

function resolveRoute(pathname: string) {
  for (const route of ROUTE_TITLES) {
    if (route.match.test(pathname)) return route;
  }
  return { title: "Back Office", subtitle: "Quản trị nội dung hệ thống" };
}

export function SiteHeader({
  userName,
  userEmail,
  userRoles,
}: {
  userName?: string;
  userEmail?: string | null;
  userRoles?: string[];
}) {
  const pathname = usePathname();
  const { title, subtitle } = resolveRoute(pathname);
  const initial = (userName ?? "?").charAt(0).toUpperCase();
  const roleLabel = userRoles?.length ? userRoles.join(", ") : null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/80 bg-card/80 px-4 shadow-sm backdrop-blur-md md:px-6">
      <div className="ml-12 min-w-0 md:ml-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={FRONTEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground",
            "transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          title="Mở website công khai"
        >
          <ExternalLink className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">Xem website</span>
        </a>

      {userName ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-border bg-muted/60 py-1.5 pl-1.5 pr-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu tài khoản"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {initial}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-xs font-medium leading-tight">
                  {userName}
                </span>
                {userEmail ? (
                  <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                    {userEmail}
                  </span>
                ) : null}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2.5 px-0.5 py-0.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {userName}
                  </p>
                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </p>
                  ) : null}
                  {roleLabel ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {roleLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-red-50 focus:text-destructive"
              onSelect={() => {
                void signOut({ callbackUrl: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      </div>
    </header>
  );
}
