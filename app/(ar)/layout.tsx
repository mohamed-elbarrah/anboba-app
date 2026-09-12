import type { Metadata } from "next";
import "../globals.css";
import { pingARLT } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";

// Published CMS content is read at request time; do not bake DB state into a build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function ArabicRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={pingARLT.className}>
        {children}
        <Toaster position="top-center" dir="rtl" closeButton duration={5000} />
      </body>
    </html>
  );
}
