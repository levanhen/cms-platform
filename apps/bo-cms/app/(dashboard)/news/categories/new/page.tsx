import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { NewsCategoryForm } from "@/features/news/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewNewsCategoryPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:create");

  return (
    <div>
      <PageHeader title="Thêm danh mục" description="Tạo category cho tin tức" 
        breadcrumbs={[{ label: "Tin tức", href: "/news" }, { label: "Danh mục", href: "/news/categories" }, { label: "Thêm" }]}
      />
      <NewsCategoryForm />
    </div>
  );
}
