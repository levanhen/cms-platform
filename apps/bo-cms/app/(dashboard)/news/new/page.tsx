import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { NewsForm } from "@/features/news/news-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewNewsPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "news:create");

  const categories = await prisma.newsCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Thêm tin" description="Tạo bài viết / tin tức mới" 
        breadcrumbs={[{ label: "Tin tức", href: "/news" }, { label: "Thêm" }]}
      />
      <NewsForm
        categories={categories}
        canPublish={hasPermission(session?.user.permissions, "news:publish")}
      />
    </div>
  );
}
