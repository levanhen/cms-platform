import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div>
      <PageHeader
        title="Không có quyền"
        description="Bạn không được phép xem trang này"
        breadcrumbs={[{ label: "Không có quyền" }]}
      />
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-50">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">403 — Forbidden</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn thiếu quyền truy cập. Liên hệ quản trị viên nếu cần
            được cấp thêm quyền.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Về tổng quan</Link>
        </Button>
      </div>
    </div>
  );
}
