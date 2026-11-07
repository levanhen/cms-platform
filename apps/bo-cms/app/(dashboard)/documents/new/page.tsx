import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentForm } from "@/features/documents/document-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewDocumentPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:create");

  const categories = await prisma.documentCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Tải lên tài liệu" description="Upload file nghiệp vụ mới" 
        breadcrumbs={[{ label: "Tài liệu", href: "/documents" }, { label: "Thêm" }]}
      />
      <DocumentForm
        mode="create"
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "document:publish")}
      />
    </div>
  );
}
