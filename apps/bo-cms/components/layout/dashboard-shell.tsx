"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export function DashboardShell({
  permissions,
  userName,
  userEmail,
  userRoles,
  newContactCount = 0,
  children,
}: {
  permissions: string[];
  userName: string;
  userEmail?: string | null;
  userRoles?: string[];
  newContactCount?: number;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar permissions={permissions} newContactCount={newContactCount} />
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader
            userName={userName}
            userEmail={userEmail}
            userRoles={userRoles}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
