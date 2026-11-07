"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    notify.error("Không tải được nội dung. Vui lòng thử lại.");
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/25 bg-red-50/40 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Lỗi tải trang</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Có lỗi khi tải dữ liệu. Kiểm tra kết nối hoặc thử lại sau.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset}>
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Về tổng quan</Link>
        </Button>
      </div>
    </div>
  );
}
