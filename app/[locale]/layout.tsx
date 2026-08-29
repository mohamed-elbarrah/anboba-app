import type { Metadata } from "next";
import "../globals.css";
import { notFound } from "next/navigation";
import { getLocaleDirection, isLocale, locales } from "@/lib/locales";

export const metadata: Metadata = {
  title: "ANBOBA",
  description: "ANBOBA public website",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={getLocaleDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
