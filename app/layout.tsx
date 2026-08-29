import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
