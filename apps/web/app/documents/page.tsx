import { Download } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { Pagination } from "@/components/content/pagination";
import { listPublishedDocuments } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";
import { formatBytes, formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata() {
  return buildMetadata({
    title: "Tài liệu",
    description: "Tài liệu công khai đã xuất bản",
    path: "/documents",
  });
}

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const data = await listPublishedDocuments(page, 12);

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Tài liệu"
        description="Tải các tài liệu đã được xuất bản công khai."
      />
      <section className="container-site py-16 md:py-20">
        <ul className="divide-y divide-line border-y border-line">
          {data.items.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.18em] text-muted uppercase">
                  {[doc.category?.name, doc.fileType, formatBytes(doc.fileSize)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h2 className="font-display mt-2 text-2xl">{doc.title}</h2>
                {doc.description ? (
                  <p className="mt-2 max-w-2xl text-sm text-muted">{doc.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted">Cập nhật {formatDate(doc.updatedAt)}</p>
              </div>
              <a
                href={`/documents/${doc.id}/download`}
                className="btn-primary shrink-0 gap-2"
              >
                <Download className="size-4" />
                Tải xuống
              </a>
            </li>
          ))}
        </ul>
        {data.items.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Chưa có tài liệu đã xuất bản.</p>
        ) : null}
        <Pagination
          current={data.page}
          totalPages={data.totalPages}
          hrefFor={(p) => (p === 1 ? "/documents" : `/documents?page=${p}`)}
        />
      </section>
    </>
  );
}
