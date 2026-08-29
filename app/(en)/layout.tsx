import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className="flex min-h-screen flex-col">
        <SiteHeader locale="en" />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter locale="en" />
      </body>
    </html>
  );
}
