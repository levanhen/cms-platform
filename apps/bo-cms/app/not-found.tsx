"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold tracking-tight">Không tìm thấy trang</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Đường dẫn không tồn tại hoặc bạn không có quyền truy cập.
      </p>
      <Button asChild>
        <Link href="/dashboard">Về tổng quan</Link>
      </Button>
    </div>
  );
}
