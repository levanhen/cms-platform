import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/features/projects/project-form";
import { CONTENT_STATUS_LABELS } from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

function toDateInput(value?: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function galleryToText(gallery: unknown) {
  if (!Array.isArray(gallery)) return "";
  return gallery.filter((item) => typeof item === "string").join("\n");
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "project:update");

  const { id } = await params;
  const [project, categories] = await Promise.all([
    prisma.project.findFirst({
      where: { id, deletedAt: null },
    }),
    prisma.projectCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!project) notFound();

  return (
    <div>
      <PageHeader
        title="Sửa dự án"
        description={`${project.title} · ${CONTENT_STATUS_LABELS[project.status]}`}
      
        breadcrumbs={[{ label: "Dự án", href: "/projects" }, { label: "Sửa" }]}
      />
      <ProjectForm
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "project:publish")}
        initial={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          content: project.content,
          clientName: project.clientName,
          location: project.location,
          startDate: toDateInput(project.startDate),
          endDate: toDateInput(project.endDate),
          featuredImage: project.featuredImage,
          gallery: galleryToText(project.gallery),
          categoryId: project.categoryId,
          displayOrder: project.displayOrder,
          seoTitle: project.seoTitle,
          seoDescription: project.seoDescription,
          status: project.status,
        }}
      />
    </div>
  );
}
