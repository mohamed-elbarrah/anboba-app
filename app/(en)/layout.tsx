import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <SiteHeader locale="en" />
        {children}
      </body>
    </html>
  );
}
