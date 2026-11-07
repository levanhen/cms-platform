import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  meta?: string | null;
  className?: string;
};

export function ContentCard({ href, title, description, imageUrl, meta, className }: Props) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <article className="h-full">
        <div className="media-hover relative aspect-[4/3] bg-sand-deep">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-end bg-gradient-to-br from-ink-soft to-ink p-6">
              <span className="font-display text-3xl text-white/40">{title.slice(0, 1)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-ink/0 transition group-hover:bg-ink/25" />
          <span className="absolute right-4 bottom-4 inline-flex size-10 items-center justify-center bg-accent text-white opacity-0 transition group-hover:opacity-100">
            <ArrowUpRight className="size-5" />
          </span>
        </div>
        <div className="pt-5">
          {meta ? <p className="text-xs tracking-[0.18em] text-muted uppercase">{meta}</p> : null}
          <h3 className="font-display mt-2 text-2xl leading-snug transition group-hover:text-accent-deep">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
