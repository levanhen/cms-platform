import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMS Back Office",
  description: "Internal CMS administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={sans.variable}>
      <body className="font-sans">
        {children}
        <Toaster
          richColors
          closeButton
          position="top-right"
          duration={4200}
          toastOptions={{
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}
