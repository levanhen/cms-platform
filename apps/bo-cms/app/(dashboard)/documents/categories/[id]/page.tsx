import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentCategoryForm } from "@/features/documents/category-form";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditDocumentCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:update");

  const { id } = await params;
  const category = await prisma.documentCategory.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <PageHeader title="Sửa danh mục tài liệu" description={category.name} 
        breadcrumbs={[{ label: "Tài liệu", href: "/documents" }, { label: "Danh mục", href: "/documents/categories" }, { label: "Sửa" }]}
      />
      <DocumentCategoryForm
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
