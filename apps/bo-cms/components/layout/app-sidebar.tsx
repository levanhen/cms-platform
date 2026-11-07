"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Newspaper,
  Settings,
  Shield,
  Users,
  Briefcase,
  Images,
  ScrollText,
  X,
  KeyRound,
  FileDown,
  PanelLeftClose,
  PanelLeft,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions/constants";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  /** Show count badge (e.g. NEW contacts). */
  badgeKey?: "newContacts";
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Tổng quan",
    items: [{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    title: "Nội dung",
    items: [
      { href: "/pages", label: "Trang", icon: FileText, permission: "page:view" },
      { href: "/services", label: "Dịch vụ", icon: Briefcase, permission: "service:view" },
      { href: "/projects", label: "Dự án", icon: FolderKanban, permission: "project:view" },
      { href: "/news", label: "Tin tức", icon: Newspaper, permission: "news:view" },
    ],
  },
  {
    title: "Tài nguyên",
    items: [
      { href: "/documents", label: "Tài liệu", icon: FileDown, permission: "document:view" },
      { href: "/media", label: "Thư viện media", icon: Images, permission: "media:view" },
    ],
  },
  {
    title: "Quản trị",
    items: [
      { href: "/users", label: "Người dùng", icon: Users, permission: "user:view" },
      { href: "/roles", label: "Vai trò", icon: Shield, permission: "role:view" },
      { href: "/permissions", label: "Quyền", icon: KeyRound, permission: "role:view" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      {
        href: "/contacts",
        label: "Liên hệ",
        icon: MessageSquare,
        permission: "contact:view",
        badgeKey: "newContacts",
      },
      { href: "/newsletter", label: "Nhận tin", icon: Mail, permission: "newsletter:view" },
      { href: "/audit-logs", label: "Nhật ký", icon: ScrollText, permission: "audit_log:view" },
      { href: "/settings", label: "Cài đặt", icon: Settings, permission: "setting:view" },
    ],
  },
];

function SidebarNav({
  permissions,
  collapsed,
  onNavigate,
  newContactCount = 0,
}: {
  permissions: string[];
  collapsed: boolean;
  onNavigate?: () => void;
  newContactCount?: number;
}) {
  const pathname = usePathname();
  const badges: Record<string, number> = {
    newContacts: newContactCount,
  };

  return (
    <nav className={cn("flex-1 space-y-5 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.permission || hasPermission(permissions, item.permission),
        );
        if (!items.length) return null;
        return (
          <div key={group.title}>
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.title}
              </p>
            ) : (
              <div className="mx-auto mb-1.5 h-px w-6 bg-border" aria-hidden />
            )}
            <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;
                const badge = badgeCount > 0 ? badgeCount : 0;
                const title = collapsed
                  ? badge
                    ? `${item.label} (${badge} mới)`
                    : item.label
                  : undefined;
                return (
                  <li key={item.href} className={collapsed ? "w-full" : undefined}>
                    <Link
                      href={item.badgeKey === "newContacts" && badge ? "/contacts?status=NEW" : item.href}
                      title={title}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center rounded-lg text-sm transition-all",
                        collapsed
                          ? "justify-center px-0 py-2"
                          : "gap-2.5 px-3 py-2",
                        active
                          ? "bg-primary/10 font-medium text-primary shadow-sm ring-1 ring-primary/15"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-card group-hover:text-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {collapsed && badge ? (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </span>
                      {!collapsed ? (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {badge ? (
                            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AppSidebar({
  permissions,
  newContactCount = 0,
}: {
  permissions: string[];
  newContactCount?: number;
}) {
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const brand = (compact: boolean) => (
    <div
      className={cn(
        "flex h-14 items-center border-b border-border",
        compact ? "justify-center px-2" : "gap-2 px-3",
      )}
    >
      <Link
        href="/dashboard"
        className={cn("flex min-w-0 items-center gap-2", compact && "justify-center")}
        onClick={() => setMobileOpen(false)}
        title="Back Office"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
          CMS
        </span>
        {!compact ? (
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Back Office
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Content platform
            </span>
          </span>
        ) : null}
      </Link>
      {!compact ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto hidden h-8 w-8 shrink-0 md:inline-flex"
          onClick={toggle}
          title="Thu gọn sidebar"
          aria-label="Thu gọn sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/80 bg-card shadow-[1px_0_0_0_rgb(226_232_240)] transition-[width] duration-200 ease-out md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {brand(collapsed)}
        <SidebarNav
          permissions={permissions}
          collapsed={collapsed}
          newContactCount={newContactCount}
        />
        {collapsed ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="mx-auto flex h-8 w-8"
              onClick={toggle}
              title="Mở rộng sidebar"
              aria-label="Mở rộng sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </aside>

      <div className="fixed left-3 top-3 z-40 md:hidden">
        <Button
          size="icon"
          variant="outline"
          className="bg-card shadow-sm"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <Button size="icon" variant="ghost" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {brand(false)}
            <SidebarNav
              permissions={permissions}
              collapsed={false}
              newContactCount={newContactCount}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
