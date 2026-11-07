import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NewsCategoryForm } from "@/features/news/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditNewsCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:update");

  const { id } = await params;
  const category = await prisma.newsCategory.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <PageHeader title="Sửa danh mục" description={category.name} 
        breadcrumbs={[{ label: "Tin tức", href: "/news" }, { label: "Danh mục", href: "/news/categories" }, { label: "Sửa" }]}
      />
      <NewsCategoryForm
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
