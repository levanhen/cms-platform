import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentCategoryForm } from "@/features/documents/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewDocumentCategoryPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:create");

  return (
    <div>
      <PageHeader
        title="Thêm danh mục tài liệu"
        description="Tạo category cho tài liệu"
      
        breadcrumbs={[{ label: "Tài liệu", href: "/documents" }, { label: "Danh mục", href: "/documents/categories" }, { label: "Thêm" }]}
      />
      <DocumentCategoryForm />
    </div>
  );
}
