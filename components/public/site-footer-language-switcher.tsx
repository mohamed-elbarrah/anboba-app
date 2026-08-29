"use client";

import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import type { Locale } from "@/lib/locales";

export function SiteFooterLanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return <LanguageSwitcher locale={locale} pathname={pathname} />;
}
