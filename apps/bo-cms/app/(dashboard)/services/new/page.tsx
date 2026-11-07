import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/features/services/service-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function NewServicePage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "service:create");

  return (
    <div>
      <PageHeader title="Thêm dịch vụ" description="Tạo dịch vụ mới" 
        breadcrumbs={[{ label: "Dịch vụ", href: "/services" }, { label: "Thêm" }]}
      />
      <ServiceForm
        canPublish={hasPermission(session?.user.permissions, "service:publish")}
      />
    </div>
  );
}
