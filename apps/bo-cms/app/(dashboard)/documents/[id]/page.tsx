import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentForm } from "@/features/documents/document-form";
import { CONTENT_STATUS_LABELS } from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "document:update");

  const { id } = await params;
  const [doc, categories] = await Promise.all([
    prisma.document.findFirst({
      where: { id, deletedAt: null },
    }),
    prisma.documentCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!doc) notFound();

  return (
    <div>
      <PageHeader
        title="Sửa tài liệu"
        description={`${doc.title} · ${CONTENT_STATUS_LABELS[doc.status]}`}
      
        breadcrumbs={[{ label: "Tài liệu", href: "/documents" }, { label: "Sửa" }]}
      />
      <DocumentForm
        mode="edit"
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "document:publish")}
        initial={{
          id: doc.id,
          title: doc.title,
          description: doc.description,
          categoryId: doc.categoryId,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          status: doc.status,
        }}
      />
    </div>
  );
}
