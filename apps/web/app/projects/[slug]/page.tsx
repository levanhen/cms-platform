import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import {
  JsonLd,
  breadcrumbJsonLd,
  creativeWorkJsonLd,
} from "@/components/seo/json-ld";
import { getPublicSettings, getPublishedProjectBySlug } from "@/lib/queries/published";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    path: `/projects/${slug}`,
    image: project.featuredImage,
  });
}

function galleryUrls(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.filter((item): item is string => typeof item === "string");
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getPublishedProjectBySlug(slug),
    getPublicSettings(),
  ]);
  if (!project) notFound();

  const path = `/projects/${slug}`;
  const images = galleryUrls(project.gallery);

  return (
    <>
      <JsonLd
        data={creativeWorkJsonLd({
          title: project.title,
          description: project.summary,
          path,
          image: project.featuredImage,
          location: project.location,
          siteName: settings.site_name,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Dự án", path: "/projects" },
          { name: project.title, path },
        ])}
      />
      <PageHero
        eyebrow={project.category?.name || "Dự án"}
        title={project.title}
        description={project.summary}
      />
      <section className="container-site py-16 md:py-20">
        {project.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.featuredImage}
            alt={project.title}
            className="mb-10 aspect-[21/9] w-full object-cover"
          />
        ) : null}

        <dl className="mb-10 grid gap-4 border-y border-line py-6 text-sm sm:grid-cols-2 md:grid-cols-4">
          {project.clientName ? (
            <div>
              <dt className="text-muted">Khách hàng</dt>
              <dd className="mt-1 font-medium">{project.clientName}</dd>
            </div>
          ) : null}
          {project.location ? (
            <div>
              <dt className="text-muted">Địa điểm</dt>
              <dd className="mt-1 font-medium">{project.location}</dd>
            </div>
          ) : null}
          {project.startDate ? (
            <div>
              <dt className="text-muted">Bắt đầu</dt>
              <dd className="mt-1 font-medium">{formatDate(project.startDate)}</dd>
            </div>
          ) : null}
          {project.endDate ? (
            <div>
              <dt className="text-muted">Hoàn thành</dt>
              <dd className="mt-1 font-medium">{formatDate(project.endDate)}</dd>
            </div>
          ) : null}
        </dl>

        <div
          className="prose-cms mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.content) }}
        />

        {images.length > 0 ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
