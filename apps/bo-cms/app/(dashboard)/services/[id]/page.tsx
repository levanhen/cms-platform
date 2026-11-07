import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/features/services/service-form";
import { CONTENT_STATUS_LABELS } from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "service:update");

  const { id } = await params;
  const service = await prisma.service.findFirst({
    where: { id, deletedAt: null },
  });
  if (!service) notFound();

  return (
    <div>
      <PageHeader
        title="Sửa dịch vụ"
        description={`${service.name} · ${CONTENT_STATUS_LABELS[service.status]}`}
      
        breadcrumbs={[{ label: "Dịch vụ", href: "/services" }, { label: "Sửa" }]}
      />
      <ServiceForm
        canPublish={hasPermission(session?.user.permissions, "service:publish")}
        initial={{
          id: service.id,
          name: service.name,
          slug: service.slug,
          shortDescription: service.shortDescription,
          description: service.description,
          icon: service.icon,
          featuredImage: service.featuredImage,
          category: service.category,
          price: service.price != null ? String(service.price) : null,
          displayOrder: service.displayOrder,
          seoTitle: service.seoTitle,
          seoDescription: service.seoDescription,
          status: service.status,
        }}
      />
    </div>
  );
}
