import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/layout/newsletter-form";

type Props = {
  siteName: string;
  siteDescription?: string;
  address?: string;
  phone?: string;
  email?: string;
};

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function SiteFooter({
  siteName,
  siteDescription,
  address = "",
  phone = "",
  email = "",
}: Props) {
  const phoneLink = phone ? telHref(phone) : undefined;

  return (
    <footer className="bg-accent-deep text-white">
      <div className="border-b border-white/10">
        <div className="container-site grid gap-8 py-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl md:text-4xl">Đăng ký nhận tin</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Nhận cập nhật dự án, ưu đãi và câu chuyện thiết kế mới nhất từ {siteName}.
            </p>
          </div>
          <NewsletterForm siteName={siteName} />
        </div>
      </div>

      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl">{siteName}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {siteDescription ||
              "Đơn vị thi công xây dựng — đồng hành từ khảo sát, thi công đến bàn giao công trình."}
          </p>
        </div>

        <div>
          <p className="section-label">Liên kết</p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            {[
              { label: "Giới thiệu", href: "/pages/about-us" },
              { label: "Dịch vụ", href: "/services" },
              { label: "Dự án", href: "/projects" },
              { label: "Tin tức", href: "/news" },
              { label: "Tài liệu", href: "/documents" },
              { label: "Liên hệ", href: "/contact" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-secondary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-label">Hỗ trợ</p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            <li>Tư vấn thiết kế</li>
            <li>Báo giá dự án</li>
            <li>Chính sách bảo mật</li>
            <li>Điều khoản sử dụng</li>
          </ul>
        </div>

        <div>
          <p className="section-label">Liên hệ</p>
          <ul className="mt-5 space-y-4 text-sm text-white/70">
            {address ? (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-secondary" />
                <span>{address}</span>
              </li>
            ) : null}
            {phone ? (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-secondary" />
                <a href={phoneLink} className="hover:text-secondary">
                  {phone}
                </a>
              </li>
            ) : null}
            {email ? (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-secondary" />
                <a href={`mailto:${email}`} className="hover:text-secondary">
                  {email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p>Inspired by Architecture demo layout · Content by CMS</p>
        </div>
      </div>
    </footer>
  );
}
