import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import {
  JsonLd,
  breadcrumbJsonLd,
  webPageJsonLd,
} from "@/components/seo/json-ld";
import { getPublicSettings, getPublishedPageBySlug } from "@/lib/queries/published";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary,
    path: `/pages/${slug}`,
    image: page.featuredImage,
  });
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([
    getPublishedPageBySlug(slug),
    getPublicSettings(),
  ]);
  if (!page) notFound();

  const path = `/pages/${slug}`;

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: page.title,
          description: page.summary,
          path,
          siteName: settings.site_name,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: page.title, path },
        ])}
      />
      <PageHero title={page.title} description={page.summary} eyebrow="Trang" />
      <section className="container-site py-16 md:py-20">
        {page.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.featuredImage}
            alt={page.title}
            className="mb-10 aspect-[21/9] w-full object-cover"
          />
        ) : null}
        <div
          className="prose-cms mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
        />
      </section>
    </>
  );
}
