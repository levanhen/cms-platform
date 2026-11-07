"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url";
import { notify } from "@/lib/notify";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => safeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        const message =
          result.code === "RATE_LIMITED" || result.error === "RATE_LIMITED"
            ? "Quá nhiều lần đăng nhập thất bại. Thử lại sau 15 phút."
            : result.code === "INACTIVE" || result.error === "INACTIVE"
              ? "Tài khoản đã bị vô hiệu hóa."
            : "Email/tên đăng nhập hoặc mật khẩu không đúng.";
        setError(message);
        notify.error(message);
        return;
      }

      notify.success("Đăng nhập thành công.");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      const message = "Không thể đăng nhập. Kiểm tra kết nối và thử lại.";
      setError(message);
      notify.unexpected(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg shadow-slate-900/5">
      <CardHeader className="pb-2">
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Nhập thông tin tài khoản của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login">Email hoặc tên đăng nhập</Label>
            <Input
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
