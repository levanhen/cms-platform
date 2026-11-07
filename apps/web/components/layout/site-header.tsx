"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/pages/about-us", label: "Giới thiệu" },
  { href: "/services", label: "Dịch vụ" },
  { href: "/projects", label: "Dự án" },
  { href: "/news", label: "Tin tức" },
  { href: "/documents", label: "Tài liệu" },
  { href: "/contact", label: "Liên hệ" },
] as const;

type Props = {
  siteName: string;
  phone?: string;
  email?: string;
};

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function SiteHeader({ siteName, phone = "", email = "" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const solid = !isHome || scrolled || open;
  const phoneLink = phone ? telHref(phone) : undefined;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "hidden border-b text-xs tracking-wide transition md:block",
          solid
            ? "border-white/10 bg-accent text-white/80"
            : "border-white/10 bg-accent/95 text-white/85",
        )}
      >
        <div className="container-site flex h-10 items-center justify-between">
          <div className="flex items-center gap-6">
            {phone ? (
              <a
                href={phoneLink}
                className="inline-flex items-center gap-2 hover:text-secondary"
              >
                <Phone className="size-3.5" />
                {phone}
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 hover:text-secondary"
              >
                <Mail className="size-3.5" />
                {email}
              </a>
            ) : null}
          </div>
          <p className="text-white/60">Tư vấn thi công &amp; xây dựng miễn phí</p>
        </div>
      </div>

      <div
        className={cn(
          "transition duration-300",
          solid
            ? "bg-accent-deep/95 text-white shadow-lg shadow-black/25 backdrop-blur"
            : "bg-transparent text-white",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between md:h-[72px]">
          <Link href="/" className="font-display text-[1.75rem] tracking-wide md:text-[2rem]">
            {siteName}
          </Link>

          <nav className="hidden items-center gap-8 xl:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-[13px] font-medium tracking-wide uppercase transition hover:text-secondary",
                    active ? "text-secondary" : "text-white/88",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/contact"
            className="btn-primary hidden !px-5 !py-2.5 lg:inline-flex"
          >
            Liên hệ
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center p-2 xl:hidden"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-white/10 bg-ink xl:hidden">
            <nav className="container-site flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-1 py-3 text-sm tracking-wide text-white/90 uppercase hover:text-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" className="btn-primary mt-3 w-fit">
                Liên hệ
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
