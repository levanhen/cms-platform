import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgb(37_99_235_/_0.12),_transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
            CMS
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Back Office</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đăng nhập để quản trị nội dung
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
              Đang tải...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
