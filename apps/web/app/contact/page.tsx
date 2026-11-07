import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHero } from "@/components/content/page-hero";
import { JsonLd, contactPageJsonLd } from "@/components/seo/json-ld";
import { getPublicSettings } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Liên hệ",
    description: "Gửi yêu cầu tư vấn và thông tin liên hệ",
    path: "/contact",
  });
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const phoneLink = settings.contact_phone ? telHref(settings.contact_phone) : undefined;

  return (
    <>
      <JsonLd
        data={contactPageJsonLd({
          name: settings.site_name,
          email: settings.contact_email,
          phone: settings.contact_phone,
          address: settings.contact_address,
        })}
      />
      <PageHero
        eyebrow="Contact"
        title="Liên hệ"
        description="Để lại thông tin — chúng tôi sẽ phản hồi qua email liên hệ của công ty."
      />
      <section className="container-site grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="section-label">Thông tin</p>
          <h2 className="display-title mt-4 text-3xl md:text-4xl">Kết nối với chúng tôi</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Bạn cũng có thể gọi điện hoặc gửi email trực tiếp theo thông tin bên dưới.
          </p>
          <ul className="mt-10 space-y-6 text-sm text-ink-soft">
            {settings.contact_address ? (
              <li className="flex gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Địa chỉ
                  </p>
                  <p className="mt-1">{settings.contact_address}</p>
                </div>
              </li>
            ) : null}
            {settings.contact_phone ? (
              <li className="flex gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Điện thoại
                  </p>
                  <a href={phoneLink} className="mt-1 inline-block hover:text-accent">
                    {settings.contact_phone}
                  </a>
                </div>
              </li>
            ) : null}
            {settings.contact_email ? (
              <li className="flex gap-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Email
                  </p>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="mt-1 inline-block hover:text-accent"
                  >
                    {settings.contact_email}
                  </a>
                </div>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="border border-line bg-sand/40 p-6 md:col-span-7 md:p-8">
          <p className="section-label">Form liên hệ</p>
          <h2 className="font-display mt-3 text-2xl md:text-3xl">Gửi yêu cầu</h2>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
