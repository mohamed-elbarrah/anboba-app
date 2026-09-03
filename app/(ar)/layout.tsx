import type { Metadata } from "next";
import "../globals.css";
import { pingARLT } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function ArabicRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={pingARLT.className}>{children}</body>
    </html>
  );
}
