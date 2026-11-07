"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
  category?: { name: string; slug: string } | null;
  location?: string | null;
};

type Props = {
  projects: Project[];
};

export function HomePortfolio({ projects }: Props) {
  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of projects) {
      if (p.category) set.set(p.category.slug, p.category.name);
    }
    return [...set.entries()];
  }, [projects]);

  const [filter, setFilter] = useState<string>("all");

  const visible =
    filter === "all" ? projects : projects.filter((p) => p.category?.slug === filter);

  return (
    <section className="home-section bg-paper">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Portfolio</p>
          <h2 className="display-title mt-4">Dự án mới nhất</h2>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label={`Tất cả ${projects.length}`} />
          {categories.map(([slug, name]) => {
            const count = projects.filter((p) => p.category?.slug === slug).length;
            return (
              <FilterChip
                key={slug}
                active={filter === slug}
                onClick={() => setFilter(slug)}
                label={`${name} ${count}`}
              />
            );
          })}
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="group relative block overflow-hidden">
              <div className="media-hover aspect-[4/3] bg-sand-deep">
                {project.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.featuredImage} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-end bg-gradient-to-br from-[#3a342c] to-ink p-6">
                    <span className="font-display text-4xl text-white/30">{project.title.slice(0, 1)}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 transition duration-500 group-hover:opacity-100">
                <p className="text-[11px] tracking-[0.18em] text-secondary uppercase">
                  {project.category?.name || project.location || "Dự án"}
                </p>
                <h3 className="font-display mt-2 text-2xl text-white">{project.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">Chưa có dự án đã xuất bản.</p>
        ) : (
          <div className="mt-12 text-center">
            <Link href="/projects" className="btn-outline-dark">
              Xem tất cả dự án
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase transition",
        active ? "bg-ink text-white" : "bg-sand text-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
