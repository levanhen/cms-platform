import Link from "next/link";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
};

export function PageHero({ eyebrow, title, description, ctaHref, ctaLabel }: Props) {
  return (
    <section className="relative overflow-hidden bg-ink pt-36 pb-16 text-white md:pt-44 md:pb-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(176,141,87,0.35), transparent 60%), linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
        }}
      />
      <div className="container-site relative">
        {eyebrow ? <p className="section-label animate-fade">{eyebrow}</p> : null}
        <h1 className="display-title mt-4 max-w-3xl animate-rise">{title}</h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 animate-rise delay-1">
            {description}
          </p>
        ) : null}
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} className="btn-primary mt-8 animate-rise delay-2">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
