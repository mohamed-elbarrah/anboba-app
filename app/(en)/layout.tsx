import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";
import { pingARLT } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";

// Published CMS content is read at request time; do not bake DB state into a build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ANBOBA",
    template: "%s | ANBOBA",
  },
  description:
    "ANBOBA makes ordering, delivery, and installation of home gas cylinders simple and reliable.",
};

export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${pingARLT.className} flex min-h-screen flex-col`}>
        <SiteHeader locale="en" />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter locale="en" />
        <Toaster position="top-center" dir="ltr" closeButton duration={5000} />
      </body>
    </html>
  );
}
