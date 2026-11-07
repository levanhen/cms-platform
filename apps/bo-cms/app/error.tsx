"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    notify.unexpected(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-destructive ring-4 ring-red-50">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Đã xảy ra lỗi</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Không thể hiển thị trang này. Thử tải lại hoặc quay về tổng quan.
        </p>
        {error.digest ? (
          <p className="text-[11px] text-muted-foreground">Mã: {error.digest}</p>
        ) : null}
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
