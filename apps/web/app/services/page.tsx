import { ContentCard } from "@/components/content/content-card";
import { PageHero } from "@/components/content/page-hero";
import { listPublishedServices } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Dịch vụ",
    description: "Danh sách dịch vụ đã xuất bản",
    path: "/services",
  });
}

export default async function ServicesPage() {
  const services = await listPublishedServices();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Dịch vụ"
        description="Các hạng mục chuyên môn được cập nhật từ hệ thống quản trị."
      />
      <section className="container-site py-16 md:py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ContentCard
              key={service.id}
              href={`/services/${service.slug}`}
              title={service.name}
              description={service.shortDescription}
              imageUrl={service.featuredImage}
              meta={service.category}
            />
          ))}
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-muted">Chưa có dịch vụ đã xuất bản.</p>
        ) : null}
      </section>
    </>
  );
}
