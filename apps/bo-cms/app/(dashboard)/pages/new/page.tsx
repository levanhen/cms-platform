import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageForm } from "@/features/pages/page-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewPagePage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "page:create");

  const canPublish = hasPermission(session?.user.permissions, "page:publish");

  return (
    <div>
      <PageHeader title="Thêm trang" description="Tạo trang nội dung mới" 
        breadcrumbs={[{ label: "Trang", href: "/pages" }, { label: "Thêm" }]}
      />
      <PageForm canPublish={canPublish} />
    </div>
  );
}
