import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageForm } from "@/features/pages/page-form";
import { CONTENT_STATUS_LABELS } from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "page:update");

  const { id } = await params;
  const page = await prisma.page.findFirst({
    where: { id, deletedAt: null },
  });
  if (!page) notFound();

  const canPublish = hasPermission(session?.user.permissions, "page:publish");

  return (
    <div>
      <PageHeader
        title="Sửa trang"
        description={`${page.title} · ${CONTENT_STATUS_LABELS[page.status]}`}
      
        breadcrumbs={[{ label: "Trang", href: "/pages" }, { label: "Sửa" }]}
      />
      <PageForm
        canPublish={canPublish}
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          summary: page.summary,
          content: page.content,
          featuredImage: page.featuredImage,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          status: page.status,
        }}
      />
    </div>
  );
}
