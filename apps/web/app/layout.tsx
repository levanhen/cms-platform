import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  JsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/components/seo/json-ld";
import { getPublicSettings } from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-family",
});

const sans = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans-family",
});

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <html lang="vi" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">
        <JsonLd
          data={organizationJsonLd({
            name: settings.site_name,
            description: settings.site_description,
            email: settings.contact_email,
            phone: settings.contact_phone,
            address: settings.contact_address,
            logo: settings.logo,
          })}
        />
        <JsonLd
          data={webSiteJsonLd({
            name: settings.site_name,
            description: settings.site_description || settings.default_seo_description,
          })}
        />
        <SiteHeader
          siteName={settings.site_name}
          phone={settings.contact_phone}
          email={settings.contact_email}
        />
        <main>{children}</main>
        <SiteFooter
          siteName={settings.site_name}
          siteDescription={settings.site_description}
          address={settings.contact_address}
          phone={settings.contact_phone}
          email={settings.contact_email}
        />
      </body>
    </html>
  );
}
