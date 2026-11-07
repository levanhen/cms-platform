import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import {
  JsonLd,
  breadcrumbJsonLd,
  serviceJsonLd,
} from "@/components/seo/json-ld";
import { getPublicSettings, getPublishedServiceBySlug } from "@/lib/queries/published";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.seoTitle || service.name,
    description: service.seoDescription || service.shortDescription,
    path: `/services/${slug}`,
    image: service.featuredImage,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([
    getPublishedServiceBySlug(slug),
    getPublicSettings(),
  ]);
  if (!service) notFound();

  const path = `/services/${slug}`;
  const price =
    service.price != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
          Number(service.price),
        )
      : null;

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: service.name,
          description: service.shortDescription,
          path,
          image: service.featuredImage,
          category: service.category,
          price: service.price,
          siteName: settings.site_name,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Dịch vụ", path: "/services" },
          { name: service.name, path },
        ])}
      />
      <PageHero
        eyebrow={service.category || "Dịch vụ"}
        title={service.name}
        description={service.shortDescription}
      />
      <section className="container-site py-16 md:py-20">
        {service.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.featuredImage}
            alt={service.name}
            className="mb-10 aspect-[21/9] w-full object-cover"
          />
        ) : null}
        {price ? <p className="mb-6 text-sm text-muted">Giá tham khảo: {price}</p> : null}
        <div
          className="prose-cms mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.description) }}
        />
      </section>
    </>
  );
}
