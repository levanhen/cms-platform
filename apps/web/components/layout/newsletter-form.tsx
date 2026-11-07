"use client";

import { useState, useTransition } from "react";

export function NewsletterForm({ siteName }: { siteName: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "footer", website }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        if (!res.ok) {
          setError(data.message || "Không đăng ký được. Vui lòng thử lại.");
          return;
        }
        setSuccess(data.message || "Đăng ký nhận tin thành công.");
        setEmail("");
      } catch {
        setError("Không kết nối được máy chủ. Vui lòng thử lại.");
      }
    });
  }

  return (
    <div className="lg:col-span-7">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row"
        noValidate
      >
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden
        />
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email của bạn"
          className="h-12 flex-1 border border-white/20 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          aria-label="Email"
        />
        <button type="submit" disabled={pending} className="btn-primary h-12 shrink-0 disabled:opacity-60">
          {pending ? "Đang gửi…" : "Đăng ký"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-secondary">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm text-white/80">
          {success} Cảm ơn bạn đã đồng hành cùng {siteName}.
        </p>
      ) : null}
    </div>
  );
}
