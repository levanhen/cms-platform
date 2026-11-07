import { ContentCard } from "@/components/content/content-card";
import { PageHero } from "@/components/content/page-hero";
import { listPublishedProjects } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Dự án",
    description: "Danh sách dự án đã xuất bản",
    path: "/projects",
  });
}

export default async function ProjectsPage() {
  const projects = await listPublishedProjects(48);

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Dự án"
        description="Các công trình và hạng mục đã được xuất bản."
      />
      <section className="container-site py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ContentCard
              key={project.id}
              href={`/projects/${project.slug}`}
              title={project.title}
              description={project.summary}
              imageUrl={project.featuredImage}
              meta={project.category?.name || project.location}
            />
          ))}
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted">Chưa có dự án đã xuất bản.</p>
        ) : null}
      </section>
    </>
  );
}
