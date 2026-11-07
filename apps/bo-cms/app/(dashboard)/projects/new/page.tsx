import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/features/projects/project-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewProjectPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "project:create");

  const categories = await prisma.projectCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Thêm dự án" description="Tạo dự án / case study mới" 
        breadcrumbs={[{ label: "Dự án", href: "/projects" }, { label: "Thêm" }]}
      />
      <ProjectForm
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "project:publish")}
      />
    </div>
  );
}
