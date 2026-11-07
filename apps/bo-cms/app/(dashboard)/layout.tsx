import { redirect } from "next/navigation";
import { ContactMessageStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { hasPermission } from "@/lib/permissions/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const newContactCount = hasPermission(session.user.permissions, "contact:view")
    ? await prisma.contactMessage.count({
        where: { status: ContactMessageStatus.NEW },
      })
    : 0;

  return (
    <DashboardShell
      permissions={session.user.permissions}
      userName={session.user.name}
      userEmail={session.user.email}
      userRoles={session.user.roles}
      newContactCount={newContactCount}
    >
      {children}
    </DashboardShell>
  );
}
