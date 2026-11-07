import Link from "next/link";
import { Inbox } from "lucide-react";
import { ReactNode } from "react";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/layout/breadcrumbs";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className="mb-6 border-b border-border/70 pb-5">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative pl-3.5">
          <span
            aria-hidden
            className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-primary to-sky-400"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.06] to-card px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-primary/10">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
