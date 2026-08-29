import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function ArabicRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteHeader locale="ar" />
        {children}
      </body>
    </html>
  );
}
