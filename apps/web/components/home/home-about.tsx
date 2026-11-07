import Link from "next/link";
import { HOME_ABOUT_IMAGES } from "@/lib/home-static";
import { sanitizeHtml } from "@/lib/sanitize-html";

type Props = {
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  slug: string;
};

export function HomeAbout({ title, summary, contentHtml, slug }: Props) {
  return (
    <section className="home-section bg-paper">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="section-label">Professional & Creative</p>
          <h2 className="display-title mt-4">
            Đồng hành xây dựng
            <br />
            công trình bền vững
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            {summary ||
              "Hơn 20 năm kinh nghiệm thi công, giám sát và bàn giao công trình dân dụng & công nghiệp."}
          </p>
          {contentHtml ? (
            <div
              className="prose-cms mt-4 line-clamp-4"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }}
            />
          ) : null}
          <p className="mt-4 text-sm text-muted">
            Chủ đề: <span className="text-ink">{title}</span>
          </p>
          <Link href={`/pages/${slug}`} className="btn-outline-dark mt-8">
            Tìm hiểu thêm
          </Link>
        </div>

        <div className="relative lg:col-span-7">
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            <div className="col-span-7 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOME_ABOUT_IMAGES[0]}
                alt=""
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            <div className="col-span-5 flex flex-col gap-4 md:gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOME_ABOUT_IMAGES[1]}
                alt=""
                className="aspect-[4/5] w-full object-cover"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOME_ABOUT_IMAGES[2]}
                alt=""
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>
          <div className="absolute -bottom-6 left-6 bg-accent px-6 py-5 text-white shadow-lg md:left-10">
            <p className="font-display text-4xl font-medium md:text-5xl">21+</p>
            <p className="mt-1 text-xs font-semibold tracking-[0.14em] uppercase">
              Năm kinh nghiệm
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
