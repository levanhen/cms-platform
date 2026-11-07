"use client";

import { cn } from "@/lib/utils";

const SECTION_TONES = {
  default: {
    bar: "bg-primary",
    badge: "bg-primary/10 text-primary",
    header: "bg-primary/[0.06]",
    headerBorder: "border-primary/10",
  },
  content: {
    bar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
    header: "bg-blue-50/80",
    headerBorder: "border-blue-100",
  },
  publish: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    header: "bg-emerald-50/80",
    headerBorder: "border-emerald-100",
  },
  seo: {
    bar: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700",
    header: "bg-violet-50/80",
    headerBorder: "border-violet-100",
  },
  taxonomy: {
    bar: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700",
    header: "bg-cyan-50/80",
    headerBorder: "border-cyan-100",
  },
  media: {
    bar: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700",
    header: "bg-teal-50/80",
    headerBorder: "border-teal-100",
  },
  meta: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    header: "bg-amber-50/80",
    headerBorder: "border-amber-100",
  },
  system: {
    bar: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700",
    header: "bg-slate-50",
    headerBorder: "border-slate-200",
  },
} as const;

export type FormSectionTone = keyof typeof SECTION_TONES;

function toneFromTitle(title: string): FormSectionTone {
  const t = title.toLowerCase();
  if (
    t.includes("xuất bản") ||
    t.includes("xuat ban") ||
    t.includes("publish")
  ) {
    return "publish";
  }
  if (t.includes("seo")) return "seo";
  if (
    t.includes("phân loại") ||
    t.includes("phan loai") ||
    t.includes("danh mục") ||
    t.includes("danh muc") ||
    t.includes("tag")
  ) {
    return "taxonomy";
  }
  if (
    t.includes("ảnh") ||
    t.includes("anh") ||
    t.includes("media") ||
    t.includes("gallery") ||
    t.includes("thumbnail")
  ) {
    return "media";
  }
  if (
    t.includes("nội dung") ||
    t.includes("noi dung") ||
    t.includes("thông tin") ||
    t.includes("thong tin")
  ) {
    return "content";
  }
  if (
    t.includes("hệ thống") ||
    t.includes("he thong") ||
    t.includes("cài đặt") ||
    t.includes("cai dat")
  ) {
    return "system";
  }
  if (t.includes("meta") || t.includes("ngày") || t.includes("ngay")) {
    return "meta";
  }
  return "default";
}

export function ContentFormLayout({
  main,
  side,
  actions,
  className,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">{main}</div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">{side}</aside>
      </div>
      {actions ? (
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t border-border/80 bg-background/90 px-1 py-3 backdrop-blur-md">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  children,
  className,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  tone?: FormSectionTone;
}) {
  const resolved = SECTION_TONES[tone ?? toneFromTitle(title)] ?? SECTION_TONES.default;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm shadow-slate-900/5",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute bottom-0 left-0 top-0 w-1", resolved.bar)}
      />
      <div
        className={cn(
          "flex items-center gap-2 border-b py-2.5 pl-4 pr-3",
          resolved.header,
          resolved.headerBorder,
        )}
      >
        <span
          className={cn(
            "inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide",
            resolved.badge,
          )}
        >
          {title}
        </span>
      </div>
      <div className="space-y-4 bg-card p-4 pl-4">{children}</div>
    </section>
  );
}
