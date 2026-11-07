import { PageHeader } from "@/components/layout/page-header";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Module sẽ được triển khai ở Phase 3/4.
      </div>
    </div>
  );
}
