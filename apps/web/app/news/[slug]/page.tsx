import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import {
  JsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";
import { getPublicSettings, getPublishedNewsBySlug } from "@/lib/queries/published";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug);
  if (!news) return {};
  return buildMetadata({
    title: news.seoTitle || news.title,
    description: news.seoDescription || news.excerpt,
    path: `/news/${slug}`,
    image: news.featuredImage || news.thumbnail,
    type: "article",
  });
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [news, settings] = await Promise.all([
    getPublishedNewsBySlug(slug),
    getPublicSettings(),
  ]);
  if (!news) notFound();

  const path = `/news/${slug}`;
  const meta = [news.category?.name, formatDate(news.publishedAt), news.author?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: news.title,
          description: news.excerpt,
          path,
          image: news.featuredImage || news.thumbnail,
          publishedAt: news.publishedAt,
          authorName: news.author?.name,
          siteName: settings.site_name,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Tin tức", path: "/news" },
          { name: news.title, path },
        ])}
      />
      <PageHero eyebrow="Tin tức" title={news.title} description={news.excerpt} />
      <section className="container-site py-16 md:py-20">
        {meta ? <p className="mb-8 text-sm tracking-wide text-muted">{meta}</p> : null}
        {(news.featuredImage || news.thumbnail) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.featuredImage || news.thumbnail || ""}
            alt={news.title}
            className="mb-10 aspect-[21/9] w-full object-cover"
          />
        )}
        <div
          className="prose-cms mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.content) }}
        />
      </section>
    </>
  );
}
