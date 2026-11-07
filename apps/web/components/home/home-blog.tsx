import Link from "next/link";
import { formatDate } from "@/lib/utils";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  featuredImage?: string | null;
  publishedAt?: Date | string | null;
  category?: { name: string } | null;
};

type Props = {
  items: NewsItem[];
};

export function HomeBlog({ items }: Props) {
  return (
    <section className="home-section bg-sand">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Blog Post</p>
          <h2 className="display-title mt-4">
            Đọc câu chuyện
            <br />
            và tin tức mới
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {items.map((item) => {
            const image = item.featuredImage || item.thumbnail;
            return (
              <article key={item.id} className="group bg-paper">
                <Link href={`/news/${item.slug}`} className="block">
                  <div className="media-hover aspect-[16/10] bg-sand-deep">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-ink-soft to-ink" />
                    )}
                  </div>
                </Link>
                <div className="p-6">
                  <p className="text-xs tracking-wide text-muted">
                    {[item.category?.name, formatDate(item.publishedAt)].filter(Boolean).join(" — ")}
                  </p>
                  <h3 className="font-display mt-3 text-2xl leading-snug transition group-hover:text-accent-deep">
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </h3>
                  {item.excerpt ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{item.excerpt}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">Chưa có tin tức đã xuất bản.</p>
        ) : (
          <div className="mt-12 text-center">
            <Link href="/news" className="btn-outline-dark">
              Tất cả tin tức
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
