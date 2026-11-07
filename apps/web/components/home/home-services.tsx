import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICE_FALLBACK_ICONS } from "@/lib/home-static";

type Service = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  icon?: string | null;
};

type Props = {
  services: Service[];
};

export function HomeServices({ services }: Props) {
  const items = services.slice(0, 4);

  return (
    <section className="home-section bg-sand">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Our Services</p>
          <h2 className="display-title mt-4">Dịch vụ xây dựng</h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((service, i) => (
            <article
              key={service.id}
              className="group bg-paper px-6 py-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="flex size-14 items-center justify-center bg-sand text-2xl text-accent transition group-hover:bg-accent group-hover:text-white">
                {service.icon || SERVICE_FALLBACK_ICONS[i % SERVICE_FALLBACK_ICONS.length]}
              </div>
              <h3 className="font-display mt-6 text-2xl">{service.name}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {service.shortDescription ||
                  "Giải pháp thiết kế và triển khai phù hợp từng không gian."}
              </p>
              <Link
                href={`/services/${service.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase transition group-hover:text-accent-deep"
              >
                Xem thêm
                <ArrowRight className="size-3.5" />
              </Link>
            </article>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">Chưa có dịch vụ đã xuất bản.</p>
        ) : (
          <div className="mt-12 text-center">
            <Link href="/services" className="btn-outline-dark">
              Tất cả dịch vụ
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
