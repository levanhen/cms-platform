"use client";

import { useState, useTransition } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  company: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  company: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(data.message || "Không gửi được. Vui lòng thử lại.");
          return;
        }
        setSuccess(true);
        setForm(INITIAL);
      } catch {
        setError("Không kết nối được máy chủ. Vui lòng thử lại.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="company"
        value={form.company}
        onChange={(e) => setField("company", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Họ và tên *" htmlFor="name">
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="field-input"
            placeholder="Nguyễn Văn A"
          />
        </Field>
        <Field label="Email *" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className="field-input"
            placeholder="ban@example.com"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Điện thoại" htmlFor="phone">
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className="field-input"
            placeholder="(+84) …"
          />
        </Field>
        <Field label="Chủ đề *" htmlFor="subject">
          <input
            id="subject"
            required
            value={form.subject}
            onChange={(e) => setField("subject", e.target.value)}
            className="field-input"
            placeholder="Tư vấn dự án / Báo giá…"
          />
        </Field>
      </div>

      <Field label="Nội dung *" htmlFor="message">
        <textarea
          id="message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setField("message", e.target.value)}
          className="field-input resize-y"
          placeholder="Mô tả nhu cầu của bạn…"
        />
      </Field>

      {error ? <p className="text-sm text-secondary">{error}</p> : null}
      {success ? (
        <p className="text-sm text-accent">
          Đã gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Đang gửi…" : "Gửi liên hệ"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
