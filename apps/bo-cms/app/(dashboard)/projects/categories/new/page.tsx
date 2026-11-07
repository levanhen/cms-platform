import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCategoryForm } from "@/features/projects/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewProjectCategoryPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "project:create");

  return (
    <div>
      <PageHeader title="Thêm danh mục dự án" description="Tạo category cho dự án" 
        breadcrumbs={[{ label: "Dự án", href: "/projects" }, { label: "Danh mục", href: "/projects/categories" }, { label: "Thêm" }]}
      />
      <ProjectCategoryForm />
    </div>
  );
}
