import { ContentCard } from "@/components/content/content-card";
import { PageHero } from "@/components/content/page-hero";
import { Pagination } from "@/components/content/pagination";
import { listPublishedNews } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata() {
  return buildMetadata({
    title: "Tin tức",
    description: "Tin tức và bài viết đã xuất bản",
    path: "/news",
  });
}

export default async function NewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const data = await listPublishedNews(page, 9);

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Tin tức"
        description="Cập nhật mới nhất từ đội ngũ biên tập."
      />
      <section className="container-site py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <ContentCard
              key={item.id}
              href={`/news/${item.slug}`}
              title={item.title}
              description={item.excerpt}
              imageUrl={item.featuredImage || item.thumbnail}
              meta={[item.category?.name, formatDate(item.publishedAt)].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
        {data.items.length === 0 ? (
          <p className="text-sm text-muted">Chưa có tin tức đã xuất bản.</p>
        ) : null}
        <Pagination
          current={data.page}
          totalPages={data.totalPages}
          hrefFor={(p) => (p === 1 ? "/news" : `/news?page=${p}`)}
        />
      </section>
    </>
  );
}
