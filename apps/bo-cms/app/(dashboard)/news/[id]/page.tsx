import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NewsForm } from "@/features/news/news-form";
import { CONTENT_STATUS_LABELS } from "@/lib/content/lifecycle";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:update");

  const { id } = await params;
  const [news, categories] = await Promise.all([
    prisma.news.findFirst({
      where: { id, deletedAt: null },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.newsCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!news) notFound();

  return (
    <div>
      <PageHeader
        title="Sửa tin"
        description={`${news.title} · ${CONTENT_STATUS_LABELS[news.status]}`}
      
        breadcrumbs={[{ label: "Tin tức", href: "/news" }, { label: "Sửa" }]}
      />
      <NewsForm
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "news:publish")}
        initial={{
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          content: news.content,
          featuredImage: news.featuredImage ?? news.thumbnail,
          categoryId: news.categoryId,
          tagNames: news.tags.map((item) => item.tag.name),
          seoTitle: news.seoTitle,
          seoDescription: news.seoDescription,
          status: news.status,
        }}
      />
    </div>
  );
}
