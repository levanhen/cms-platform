import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCategoryForm } from "@/features/projects/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditProjectCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "project:update");

  const { id } = await params;
  const category = await prisma.projectCategory.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <PageHeader title="Sửa danh mục dự án" description={category.name} 
        breadcrumbs={[{ label: "Dự án", href: "/projects" }, { label: "Danh mục", href: "/projects/categories" }, { label: "Sửa" }]}
      />
      <ProjectCategoryForm
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          status: category.status,
        }}
      />
    </div>
  );
}
